import os
import json
import base64
import random
import logging
import ssl
import time
import asyncio
import subprocess
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from google import genai
import edge_tts
import torch

# ==============================
# 1. SSL & ENVIRONMENT
# ==============================
ssl._create_default_https_context = ssl._create_unverified_context

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NyayaAI_Neural_Engine")

# ==============================
# 2. API ROTATOR
# ==============================
API_KEYS = [
    "AIzaSyD_EJKgWQrHOAjEwWJzK4lCtW7zAmfzF40",
    "AIzaSyDrBIpRpC2iD9VS380LGhlpB0JHtiliFIQ",
    "AIzaSyB-T7pm593-L-999iFmGzGUDPTF9umTw4g",
]

# Try these models in order until one works
MODEL_FALLBACKS = [
    "models/gemini-3-flash-preview",       # Newest & fastest
    "models/gemini-3.1-flash-lite-preview", # Gemini 3.1 lite
    "models/gemini-2.5-flash",             # Stable fallback
    "models/gemini-2.0-flash",             # Older fallback
    "models/gemini-flash-latest",           # Generic latest
]

MODEL_ID = MODEL_FALLBACKS[0]  # default

class NeuralRotator:
    def __init__(self, keys):
        self.keys = keys
        self.index = 0

    def get_client(self):
        key = self.keys[self.index]
        client = genai.Client(api_key=key)
        logger.info(f"Rotating to Key Index {self.index}")
        self.index = (self.index + 1) % len(self.keys)
        return client

    def generate(self, prompt: str) -> str:
        """Try all keys and models with exponential backoff. Returns text or raises."""
        last_err = None
        for key in self.keys:
            client = genai.Client(api_key=key)
            for model in MODEL_FALLBACKS:
                for attempt in range(3):
                    try:
                        resp = client.models.generate_content(model=model, contents=prompt)
                        logger.info(f"Success with key={key[:12]}... model={model}")
                        return resp.text
                    except Exception as e:
                        last_err = e
                        err_str = str(e)
                        if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                            wait = (2 ** attempt) * 2
                            logger.warning(f"429 on {model} key={key[:12]}... waiting {wait}s")
                            time.sleep(wait)
                        elif "404" in err_str or "NOT_FOUND" in err_str:
                            logger.warning(f"Model {model} not found, trying next")
                            break  # try next model
                        else:
                            logger.error(f"Unexpected error: {err_str[:120]}")
                            break
        raise Exception(f"All keys and models exhausted. Last error: {last_err}")

rotator = NeuralRotator(API_KEYS)

# ==============================
# 3. LAW DATABASE
# ==============================
LAW_DATABASE = {
    "302": {"bns": "101", "name": "Murder"},
    "307": {"bns": "109", "name": "Attempt to Murder"},
    "376": {"bns": "64", "name": "Rape"},
    "379": {"bns": "303", "name": "Theft"},
    "420": {"bns": "318", "name": "Cheating"},
    "498A": {"bns": "85", "name": "Cruelty"},
    "506": {"bns": "351", "name": "Criminal Intimidation"}
}

LEGAL_LIBRARY = {
    "criminal": "IPC/BNS offences like murder, theft, fraud.",
    "constitutional": "Fundamental Rights, Writs, Structure.",
    "family": "Marriage, Divorce, Maintenance.",
    "contract": "Indian Contract Act principles."
}

# ==============================
# 4. SLANG ENGINE
# ==============================
class IndianLegalSlangEngine:
    def __init__(self):
        self.slang_map = {
            "lawyer": ["Vakil Sahab", "Counsel"],
            "document": ["Vakalatnama", "Parcha"]
        }

    def inject_slang(self, text):
        slang_l = random.choice(self.slang_map["lawyer"])
        slang_d = random.choice(self.slang_map["document"])
        return f"Ji {slang_l}, {text}. Ensure the {slang_d} is processed."

slang_engine = IndianLegalSlangEngine()

# ==============================
# 5. TTS + VIDEO
# ==============================
async def generate_sara_voice_and_video(text, output_id):
    audio_path = f"temp/{output_id}.mp3"
    video_path = f"temp/{output_id}.mp4"

    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Hardware: {device}")

    try:
        communicate = edge_tts.Communicate(text, "en-IN-NeerjaNeural")
        await communicate.save(audio_path)

        cmd = [
            "python", "Wav2Lip/inference.py",
            "--checkpoint_path", "checkpoints/wav2lip_gan.pth",
            "--face", "public/sara-human.jpg",
            "--audio", audio_path,
            "--outfile", video_path,
            "--nosmooth"
        ]

        process = await asyncio.create_subprocess_exec(*cmd)
        await process.wait()

        if os.path.exists(video_path):
            with open(video_path, "rb") as f:
                encoded = base64.b64encode(f.read()).decode()
            return f"data:video/mp4;base64,{encoded}"
    except Exception as e:
        logger.error(f"Video generation error: {e}")

    return None

# ==============================
# 6. FASTAPI INIT
# ==============================
@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs("temp", exist_ok=True)
    os.makedirs("checkpoints", exist_ok=True)
    yield

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# 7. WEBSOCKET – LEGAL DEBATE
# ==============================
@app.websocket("/ws/legal_debate")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            query = payload.get("query", "")

            try:
                client = rotator.get_client()
                resp = client.models.generate_content(
                    model=MODEL_ID,
                    contents=f"Respond as Senior Counsel Sara to: {query}"
                )
                ai_text = resp.text
            except Exception as e:
                logger.error(str(e))
                ai_text = "Judicial system temporarily offline."

            final_text = slang_engine.inject_slang(ai_text)
            video_url = await generate_sara_voice_and_video(final_text, str(int(time.time())))

            await websocket.send_json({
                "message": final_text,
                "url": video_url
            })

    except WebSocketDisconnect:
        logger.info("Disconnected")

# ==============================
# 8. TRAINING MODULES
# ==============================

@app.post("/generate_scenario")
async def generate_scenario(data: dict):
    law = data.get("law", "criminal")
    prompt = f"""You are an expert Indian Legal Case Author. Generate a highly realistic and detailed Indian court case scenario under {law}.

Respond with ONLY a valid JSON object. No markdown, no code blocks.
{{
  "caseTitle": "Short case title, e.g., State v. Rajesh Kumar",
  "caseNumber": "A realistic case number, e.g., Sessions Case No. 142/2024",
  "court": "Relevant Indian court for this case",
  "accusedName": "A realistic Indian name",
  "victimName": "A realistic Indian name or 'The State' if applicable",
  "sections": "Relevant IPC/BNS/Specific Act sections, e.g., IPC Section 302, 34",
  "summary": "3-4 sentence narrative summary of the incident",
  "prosecution": "Key arguments the prosecution will make",
  "defense": "Key arguments the defense can raise",
  "keyEvidence": "3 bullet points of key evidence in the case",
  "charges": "Formal charges as stated by the court"
}}"""
    try:
        text = rotator.generate(prompt).strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        logger.error(str(e))
        return {"error": "AI system temporarily unavailable. Please try again in a moment."}


@app.post("/upload_scenario")
async def upload_scenario(file: UploadFile = File(...)):
    try:
        content = await file.read()
        with open(f"temp/{file.filename}", "wb") as f:
            f.write(content)
        return {"status": "uploaded"}
    except Exception as e:
        logger.error(str(e))
        return {"status": "upload failed"}


@app.post("/logic_solver")
async def logic_solver(data: dict):
    scenario = data.get("scenario")
    prompt = f"You are a senior Indian lawyer. Analyze this case legally and provide section-wise analysis, arguments for both sides, and likely verdict:\n{scenario}"
    try:
        return {"analysis": rotator.generate(prompt)}
    except Exception as e:
        logger.error(str(e))
        return {"analysis": "AI system temporarily unavailable. Please try again."}


@app.post("/generate_assessment")
async def generate_assessment(data: dict):
    law = data.get("law", "criminal")
    difficulty = data.get("difficulty", "beginner")
    prompt = f"""Generate 1 challenging MCQ on Indian {law} law at a {difficulty} difficulty level. The question must test practical legal knowledge.
You must respond with ONLY a valid JSON object. Do not include any markdown formatting or code blocks like ```json.
The JSON object must have the following exact keys:
{{
  "question": "The question text here - make it specific and practical",
  "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
  "correctAnswer": "The exact text of the correct option here",
  "explanation": "Detailed 3-4 sentence explanation citing specific sections, case laws, or legal principles"
}}"""
    try:
        text = rotator.generate(prompt).strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        return json.loads(text.strip())
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON: {e}")
        return {"error": "Failed to generate a valid question format. Please try again."}
    except Exception as e:
        logger.error(str(e))
        return {"error": "AI system temporarily unavailable. Please try again."}


@app.post("/virtual_court")
async def virtual_court(data: dict):
    scenario = data.get("scenario")
    role = data.get("role", "judge")
    prompt = f"Simulate Indian court as {role}. Case:\n{scenario}"
    try:
        return {"simulation": rotator.generate(prompt)}
    except Exception as e:
        logger.error(str(e))
        return {"simulation": "AI system temporarily unavailable."}


@app.get("/library/{topic}")
async def get_library(topic: str):
    return {"content": LEGAL_LIBRARY.get(topic.lower(), "Not found")}


@app.post("/library_search")
async def library_search(data: dict):
    query = data.get("query", "")
    prompt = f"""You are an expert Indian Legal Scholar with deep knowledge of all Indian laws, acts, and constitutional provisions.
The user wants to learn about: "{query}"

Provide a comprehensive, well-structured legal explanation. Respond with ONLY a valid JSON object. No markdown, no code blocks.
{{
  "title": "Clear topic title",
  "overview": "2-3 sentence overview of the legal concept",
  "keyProvisions": ["Key provision 1", "Key provision 2", "Key provision 3", "Key provision 4", "Key provision 5"],
  "relevantSections": "Specific sections/articles from the act or constitution",
  "landmarkCases": [{{"name": "Case name", "ruling": "One-sentence ruling summary"}}],
  "practicalImplication": "How this law affects common citizens in practice",
  "recentAmendments": "Any recent amendments or changes (BNS, BNSS, BSA etc.)"
}}"""
    try:
        text = rotator.generate(prompt).strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        logger.error(str(e))
        return {"error": "AI library system temporarily unavailable. Please try again."}


@app.post("/map_law")
async def map_law(data: dict):
    query = data.get("query", "")
    prompt = f"""You are an expert Indian Legal Assistant. The user wants to map a law related to: "{query}".
Identify the relevant Indian Penal Code (IPC) section and its new equivalent in the Bharatiya Nyaya Sanhita (BNS).
You must respond with ONLY a valid JSON object. Do not include any markdown formatting or code blocks like ```json.
The JSON object must have the following exact keys:
{{
  "ipcSection": "e.g., IPC 302",
  "bnsSection": "e.g., BNS 101",
  "crimeName": "e.g., Murder",
  "punishment": "Brief description of the punishment",
  "difference": "A brief explanation of what changed in the BNS version compared to IPC"
}}"""
    try:
        text = rotator.generate(prompt).strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        logger.error(str(e))
        return {"error": "AI mapping temporarily unavailable."}

@app.post("/suggest_bail")
async def suggest_bail(data: dict):
    applicant_name = data.get("applicant_name", "[Applicant Name]")
    id_number = data.get("id_number", "[ID Number]")
    case_description = data.get("case_description", "")
    client = rotator.get_client()
    prompt = f"""You are an expert Indian Defense Lawyer. Analyze this case and suggest the appropriate bail:
Case: "{case_description}"
Applicant Name: "{applicant_name}"
Applicant ID: "{id_number}"

You must respond with ONLY a valid JSON object. Do not include any markdown formatting or code blocks.
The JSON object must have the following exact keys:
{{
  "bailType": "e.g., Anticipatory Bail, Regular Bail, Default Bail",
  "reason": "Explain legally why this bail type is most appropriate for this case",
  "draftTemplate": "Provide a complete, formal bail application ready for court submission (300-400 words) written in formal legal English. Include standard Indian legal headers like 'IN THE COURT OF THE SESSIONS JUDGE', the title 'BAIL APPLICATION UNDER SECTION [APPROPRIATE SECTION]', and formal numbered paragraphs. Explicitly replace ALL applicant name placeholders with '{applicant_name}' and ID placeholders with '{id_number}'. Rewrite the raw case description into a highly formal, professional legal tone suitable for court."
}}"""

    try:
        resp = client.models.generate_content(model=MODEL_ID, contents=prompt)
        text = resp.text.strip()
        
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        text = text.strip()
            
        return json.loads(text)
    except Exception as e:
        logger.error(str(e))
        return {"error": "AI bail suggestion temporarily unavailable."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)