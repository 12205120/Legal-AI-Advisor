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
from pydantic import BaseModel
from google import genai
import smtplib
from email.mime.text import MIMEText
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
    "gemini-2.0-flash",            # Fast & stable
    "gemini-2.0-flash-lite",       # Lite version
    "gemini-1.5-flash",            # Reliable fallback
    "gemini-1.5-flash-latest",     # Latest 1.5
    "gemini-1.5-pro",              # Pro fallback
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
        """Turbo-optimized API call. Fails fast without heavy time.sleep() to ensure lightning-fast responses like the web client."""
        last_err = None
        # Try maximum 2 rapid attempts
        for attempt in range(2):
            for key in self.keys:
                client = genai.Client(api_key=key)
                try:
                    # Explicitly use gemini-1.5-flash for maximum speed to mimic web speed
                    resp = client.models.generate_content(
                        model="gemini-1.5-flash", 
                        contents=prompt,
                        config={"temperature": 0.3} # Optimize speed
                    )
                    logger.info(f"Turbo execution success with key={key[:12]}...")
                    return resp.text
                except Exception as e:
                    last_err = e
                    logger.warning(f"Key failed, swapping instantly. Err: {str(e)[:40]}")
                    
        raise Exception(f"All fast attempts exhausted. Last error: {last_err}")

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
            "lawyer": ["Vakil Sahab", "Counsel", "Advocate", "learned friend"],
            "document": ["Vakalatnama", "Parcha", "affidavit", "evidence"]
        }

    def inject_slang(self, text):
        # Only inject if not already using formal terms to avoid over-cluttering
        if "Milord" in text or "Counsel" in text:
            return text
        
        slang_l = random.choice(self.slang_map["lawyer"])
        return f"Milord, {text}"

slang_engine = IndianLegalSlangEngine()

# ==============================
# 5. TTS + VIDEO
# ==============================
async def generate_sara_audio(text: str, output_id: str) -> str | None:
    """Generate TTS audio using edge-tts and return base64 data URI."""
    audio_path = f"temp/{output_id}.mp3"
    try:
        communicate = edge_tts.Communicate(text, "en-IN-NeerjaNeural")
        await communicate.save(audio_path)
        with open(audio_path, "rb") as f:
            encoded = base64.b64encode(f.read()).decode()
        return f"data:audio/mp3;base64,{encoded}"
    except Exception as e:
        logger.error(f"TTS audio error: {e}")
    return None


async def generate_sara_voice_and_video(text, output_id):
    """Try Wav2Lip video first; fall back to audio-only."""
    audio_path = f"temp/{output_id}.mp3"
    video_path = f"temp/{output_id}.mp4"

    checkpoint = "checkpoints/wav2lip_gan.pth"
    face_img = "public/sara-human.jpg"
    checkpoint_valid = os.path.exists(checkpoint) and os.path.getsize(checkpoint) > 1_000_000
    face_valid = os.path.exists(face_img)

    # Generate audio first (always)
    audio_b64 = await generate_sara_audio(text, output_id)

    # Try video if weights are ready
    if checkpoint_valid and face_valid:
        try:
            cmd = [
                "python", "Wav2Lip/inference.py",
                "--checkpoint_path", checkpoint,
                "--face", face_img,
                "--audio", audio_path,
                "--outfile", video_path,
                "--nosmooth"
            ]
            process = await asyncio.create_subprocess_exec(*cmd)
            await process.wait()
            if os.path.exists(video_path):
                with open(video_path, "rb") as f:
                    encoded = base64.b64encode(f.read()).decode()
                return f"data:video/mp4;base64,{encoded}", audio_b64
        except Exception as e:
            logger.warning(f"Wav2Lip failed, using audio-only: {e}")
    else:
        logger.info("Wav2Lip weights not ready — using audio-only mode")

    return None, audio_b64

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
    history = []
    scenario = "No scenario provided"
    user_role = "Victim" # Default
    
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            # Check for setup context
            if "setup" in payload:
                scenario = payload.get("scenario", scenario)
                user_role = payload.get("role", user_role)
                logger.info(f"Session setup: Role={user_role}")
                continue

            query = payload.get("query", "")
            history.append({"role": "user", "content": query})

            # Persona: If user is "Accused", Sara is the Public Prosecutor (Prosecution).
            # If user is "Victim/Complainant", Sara is the Defense Counsel.
            sara_role = "Public Prosecutor (Prosecution)" if user_role == "Accused" else "Defense Counsel"
            
            prompt = f"""
You are Senior Counsel Sara, representing the {sara_role} in an Indian Court.
Case Scenario: {scenario}

Current Conversation History:
{json.dumps(history[-5:], indent=2)}

YOUR GOAL: 
1. Argue aggressively but professionally as the {sara_role}.
2. Use courtroom language: "Milord", "My learned friend", "Objection", "With due respect".
3. Reference specific facts from the Case Scenario to counter the opponent's claims.
4. Keep your response concise (under 80 words) and high-impact.
5. If the opponent says something weak, point it out.

Respond to the latest argument now.
"""
            try:
                ai_text = rotator.generate(prompt)
            except Exception as e:
                logger.error(str(e))
                ai_text = "Milord, the prosecution require a brief adjournment. [Backend connectivity lost]."

            history.append({"role": "assistant", "content": ai_text})
            
            # Clean up text from potential markdown if LLM adds any
            ai_text = ai_text.replace("**", "").replace("#", "").strip()
            
            final_text = slang_engine.inject_slang(ai_text)
            output_id = str(int(time.time()))
            audio_url = await generate_sara_audio(final_text, output_id)

            await websocket.send_json({
                "message": final_text,
                "audio_url": audio_url
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

# ==============================
# 9. AUTHENTICATION & OTP
# ==============================
class OTPRequest(BaseModel):
    email: str

otp_store = {}

@app.post("/send_otp")
async def send_otp(req: OTPRequest):
    email = req.email
    otp = str(random.randint(100000, 999999))
    otp_store[email] = otp
    
    sender_email = os.environ.get("SENDER_EMAIL")
    sender_password = os.environ.get("SENDER_PASSWORD")
    
    logger.info(f"Generated OTP for {email}: {otp}")
    
    if sender_email and sender_password:
        try:
            msg = MIMEText(f"Your Nyaya AI Secure OTP is: {otp}\n\nPlease enter this code in the portal to authenticate.")
            msg['Subject'] = 'Nyaya AI - Security OTP'
            msg['From'] = sender_email
            msg['To'] = email

            with smtplib.SMTP('smtp.gmail.com', 587) as server:
                server.starttls()
                server.login(sender_email, sender_password)
                server.send_message(msg)
            logger.info("OTP Email sent successfully via SMTP.")
        except Exception as e:
            logger.error(f"Failed to send email: {e}")
            return {"status": "success", "message": "OTP generated in console (email failed)", "testing_otp": otp}
    else:
        logger.info("No SENDER_EMAIL or SENDER_PASSWORD in env. OTP printed to console only.")

    return {"status": "success", "message": "OTP processed successfully."}

@app.post("/verify_otp")
async def verify_otp(data: dict):
    email = data.get("email")
    otp = data.get("otp")
    if email in otp_store and str(otp_store[email]) == str(otp):
        # Clear after successful verification
        del otp_store[email]
        return {"status": "verified"}
    return {"status": "failed", "error": "Invalid OTP or Email"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)