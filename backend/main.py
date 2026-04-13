import os
import json
import base64
import random
import logging
import ssl
import time
import asyncio
import subprocess
import urllib.request
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import edge_tts
import sqlite3
from knowledge_vault import vault
from passlib.context import CryptContext
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from twilio.rest import Client as TwilioClient
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv()

# Password/OTP Hashing Context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==============================
# 1. SSL & ENVIRONMENT
# ==============================
ssl._create_default_https_context = ssl._create_unverified_context

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("NyayaAI_Neural_Engine")

# ==============================
# 2. NEURAL ENGINE (LOCAL ONLY)
# ==============================

class NeuralRotator:
    def __init__(self):
        self.ollama_url = "http://127.0.0.1:11434/api/generate"
        self.ollama_model = "llama3:latest" # Matches your local installation

    def generate(self, prompt: str, use_vault: bool = True) -> str:
        """Forced Local Neural Execution. All traffic routed to Ollama."""
        
        # 1. Inject Context from Knowledge Vault if applicable
        if use_vault:
            context = vault.query(prompt)
            if context:
                prompt = f"{context}\n\n(IMPORTANT: Use the provided RELEVANT LEGAL CONTEXT above to anchor your answer if applicable. If the context contains specific sections or previous cases, CITE them directly.)\n\nUSER QUERY: {prompt}"

        # 2. Inject Entropy Seed for Non-Repetition
        entropy = f"\n\n[SYSTEM_SEED: {random.randint(1000, 9999)}-{time.time()}]\n[INSTRUCTION: Ensure this response is unique, uses a distinct Indian district, and focuses on a specific but different legal nuance than previous iterations.]"
        prompt += entropy

        # 3. Primary & Only Route: Local Ollama
        payload = {
            "model": self.ollama_model,
            "prompt": prompt,
            "stream": False
        }
        try:
            req = urllib.request.Request(
                self.ollama_url, 
                data=json.dumps(payload).encode('utf-8'),
                headers={'Content-Type': 'application/json'}, 
                method='POST'
            )
            # Increase timeout to 120s for complex local legal inference
            with urllib.request.urlopen(req, timeout=120) as response:
                result = json.loads(response.read().decode('utf-8'))
                text_response = result.get("response", "").strip()
                logger.info(f"Ollama local execution success using {self.ollama_model}.")
                
                # If the calling function expects JSON, ensure we don't return plain error text
                # We return the raw text, and endpoints will handle JSON conversion themselves.
                return text_response
        except Exception as e:
            logger.error(f"FAILURE: Local Neural Engine (Ollama) failed. Err: {e}")
            # Instead of returning a sentence, throw an exception so calling functions know it failed
            raise Exception(f"Ollama connection error: {str(e)}")

rotator = NeuralRotator()

# ==============================
# 3. LAW DATABASE
# ==============================
LAW_DATABASE = {
    # Homicide & Attempt
    "302": {"bns": "101", "name": "Murder"},
    "307": {"bns": "109", "name": "Attempt to Murder"},
    "304B": {"bns": "80", "name": "Dowry Death"},
    
    # Sexual Offences
    "376": {"bns": "64", "name": "Rape"},
    "376D": {"bns": "70", "name": "Gang Rape"},
    
    # Theft & Property
    "379": {"bns": "303", "name": "Theft"},
    "380": {"bns": "305", "name": "Theft in Dwelling House"},
    "392": {"bns": "309", "name": "Robbery"},
    "411": {"bns": "317", "name": "Receiving Stolen Property"},
    
    # Fraud & Dishonesty
    "420": {"bns": "318", "name": "Cheating and Dishonestly inducing delivery of property"},
    "406": {"bns": "316", "name": "Criminal Breach of Trust"},
    
    # Hurt & Assault
    "323": {"bns": "115", "name": "Voluntarily Causing Hurt"},
    "324": {"bns": "118", "name": "Voluntarily Causing Hurt by Dangerous Weapons"},
    "354": {"bns": "74", "name": "Assault or criminal force to woman with intent to outrage her modesty"},
    
    # Others
    "498A": {"bns": "85", "name": "Cruelty by Husband or Relatives"},
    "506": {"bns": "351", "name": "Criminal Intimidation"},
    "120B": {"bns": "61", "name": "Criminal Conspiracy"},
    "143": {"bns": "189", "name": "Unlawful Assembly"},
    "34": {"bns": "3", "name": "Common Intention"}
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
    
    # Init DB
    conn = sqlite3.connect("nyaya_users.db")
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            email TEXT PRIMARY KEY,
            password TEXT,
            first_name TEXT,
            last_name TEXT,
            phone_number TEXT,
            role TEXT,
            college TEXT,
            registration_no TEXT,
            govt_id TEXT,
            judicial_id TEXT,
            verified BOOLEAN
        )
    ''')
    conn.commit()
    conn.close()
    
    # Background Task: Auto-Sync Brain every 60s
    async def auto_reload_vault():
        while True:
            await asyncio.sleep(60)
            if vault.reload():
                logger.info("Auto-sync: Knowledge Vault updated.")
                
    asyncio.create_task(auto_reload_vault())
    
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
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, room: str, websocket: WebSocket):
        await websocket.accept()
        if room not in self.active_connections:
            self.active_connections[room] = []
        self.active_connections[room].append(websocket)

    def disconnect(self, room: str, websocket: WebSocket):
        if room in self.active_connections:
             if websocket in self.active_connections[room]:
                 self.active_connections[room].remove(websocket)
             if not self.active_connections[room]:
                 del self.active_connections[room]

    async def broadcast(self, room: str, message: dict, sender: WebSocket = None):
        if room in self.active_connections:
            for connection in self.active_connections[room]:
                if connection != sender:
                    try:
                        await connection.send_json(message)
                    except:
                        pass

manager = ConnectionManager()

@app.websocket("/ws/legal_debate/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    await manager.connect(session_id, websocket)
    history = []
    scenario = "No scenario provided"
    user_role = "Victim" # Default
    
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            # Broadcast payload to other human participants (P2P mode)
            await manager.broadcast(session_id, payload, sender=websocket)
            
            # Check for setup context
            if "setup" in payload:
                scenario = payload.get("scenario", scenario)
                user_role = payload.get("role", user_role)
                logger.info(f"Session setup: Role={user_role}")
                continue

            query = payload.get("query", "")
            
            # Only trigger AI if opponent is AI Sara or query forces it
            if payload.get("opponent", "AI Sara") == "AI Sara" and query:
                history.append({"role": "user", "content": query})

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
                ai_text = ai_text.replace("**", "").replace("#", "").strip()
                final_text = slang_engine.inject_slang(ai_text)
                
                output_id = str(int(time.time()))
                audio_url = await generate_sara_audio(final_text, output_id)

                await websocket.send_json({
                    "message": final_text,
                    "audio_url": audio_url,
                    "sender_role": sara_role
                })

    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
        logger.info("Disconnected")

# ==============================
# 8. TRAINING MODULES
# ==============================

@app.post("/generate_scenario")
async def generate_scenario(data: dict):
    law_type = data.get("law", "criminal")
    
    # DIVERSITY ENGINE: Inject random geographic and thematic seeds
    districts = ["Pune", "Thane", "Nagpur", "Nashik", "Aurangabad", "Ahmednagar", "Solapur", "Amravati"]
    locations = ["Railway Station", "Main Market", "Corporate Office", "Residential Society", "Public Park", "Highway"]
    random_id = random.randint(1000, 9999)
    current_district = random.choice(districts)
    current_loc = random.choice(locations)
    
    prompt = f"""You are an expert Indian Legal Case Author. 
Generate a HIGHLY UNIQUE and detailed Indian court case scenario.
MANDATORY VARIATION SEED: #{random_id}
LOCATION: {current_district}, {current_loc}

TASK:
1. Create a realistic, complex legal scenario for a {law_type} case.
2. Ensure it is NOT a generic template. Add specific details like exact names, specific items involved, and a unique sequence of events.
3. Choose a specific Indian city and district randomly from Maharashtra.

Respond with ONLY a valid JSON object. No markdown, no code blocks.
{{
  "caseTitle": "State of Maharashtra v. [Unique Name]",
  "caseNumber": "CNR No. MH{random.randint(10,99)}01-{random.randint(100000, 999999)}-2024",
  "court": "District & Sessions Court, {current_district}",
  "accusedName": "Full Indian name",
  "victimName": "Full Indian name",
  "sections": "Relevant BNS sections and equivalent IPC sections",
  "summary": "Detailed narrative of the specific incident (6-8 sentences)",
  "prosecution": "3 sharp, specific legal arguments",
  "defense": "3 realistic legal defenses",
  "keyEvidence": "Detailed list including forensics or specific documents",
  "charges": "Formal charges as per BNSS/CrPC"
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


@app.post("/upload_training_pdf")
async def upload_training_pdf(file: UploadFile = File(...)):
    """Upload and index a PDF into the Knowledge Vault."""
    try:
        temp_path = f"temp/{file.filename}"
        content = await file.read()
        with open(temp_path, "wb") as f:
            f.write(content)
        
        # Trigger indexing
        chunk_count = vault.add_pdf(temp_path)
        
        # Cleanup temp file
        os.remove(temp_path)
        
        return {
            "status": "success", 
            "message": f"Successfully indexed {chunk_count} legal chunks from {file.filename}.",
            "filename": file.filename
        }
    except Exception as e:
        logger.error(f"Training upload failed: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/reload_vault")
async def reload_vault():
    """Manual trigger to refresh the AI brain from disk."""
    success = vault.reload()
    if success:
        return {"status": "success", "message": "Knowledge Vault reloaded successfully.", "chunks": len(vault.metadata)}
    return {"status": "error", "message": "Failed to reload vault index."}

@app.get("/vault_status")
async def get_vault_status():
    """Get statistics about the Knowledge Vault."""
    return {
        "status": "active",
        "chunks": len(vault.metadata),
        "documents": list(set(item["source"] for item in vault.metadata))
    }

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
    prompt = f"""You are a High Court Advocate and Senior Legal Consultant.
Analyze the following case scenario with absolute legal precision using your local Knowledge Vault.

TASK:
1. Identify the core legal issues.
2. Map the facts to specific Sections of BNS and IPC.
3. PREDICT THE VERDICT: Based on current Indian judicial trends and the PROVIDED CONTEXT, what is the most likely outcome?
4. ADVISE THE USER: What should be the immediate next legal steps?

Provide a deep, professional analysis. If the Context contains similar past judgments or specific acts, YOU MUST CITE THEM.
Case Scenario:
{scenario}
"""
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

Using the PROVIDED LEGAL CONTEXT from the Knowledge Vault, provide a comprehensive, well-structured legal explanation. 
Respond with ONLY a valid JSON object. No markdown, no code blocks.

{{
  "title": "Clear topic title",
  "overview": "2-3 sentence overview of the legal concept based on the vault data",
  "keyProvisions": ["Provision from vault 1", "Provision from vault 2", "Provision from vault 3"],
  "relevantSections": "Specific sections/articles mentioned in the vault",
  "landmarkCases": [{{"name": "Case name from vault", "ruling": "One-sentence ruling summary"}}],
  "practicalImplication": "How this law affects common citizens in practice",
  "recentAmendments": "Any recent amendments from BNS/BSA as seen in the vault"
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
    
    # FORCED BNSS CONTEXT
    prompt = f"""You are a Supreme Court of India Defense Advocate specializing in the new Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023.
Case Facts: "{case_description}"
Applicant: {applicant_name} (ID: {id_number})

TASK:
1. Determine the appropriate bail type (e.g., Anticipatory Bail under Sec 482 BNSS, Regular Bail under Sec 480 BNSS, or Interim Bail).
2. Evaluate if Section 479 BNSS (Detention of undertrail prisoners) applies (e.g., if the person has already served half the maximum punishment).
3. Provide a RATIONALE based solely on BNSS procedures.
4. Draft a formal BAIL APPLICATION in professional legal English.

MANDATORY FORMATTING:
- Cite BNSS sections throughout (replacing CrPC).
- Address to "IN THE COURT OF THE SESSIONS JUDGE / HIGH COURT".
- Use formal numbered paragraphs.

Respond with ONLY JSON:
{{
  "bailType": "BNSS Section based bail type",
  "reason": "Detailed legal evaluation using BNSS 2023 provisions.",
  "draftTemplate": "Full formal legal draft (300-500 words)."
}}"""

    try:
        text = rotator.generate(prompt).strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        logger.error(str(e))
        return {"error": "AI bail suggestion temporarily unavailable."}

@app.post("/analyze_arguments")
async def analyze_arguments(data: dict):
    prosecution = data.get("prosecution", "")
    defense = data.get("defense", "")
    scenario = data.get("scenario", "")

    prompt = f"""You are a Lead Judicial Analyst (Judge's Bench).
Case Scenario: {scenario}

PROSECUTION ARGUMENT:
{prosecution}

DEFENSE ARGUMENT:
{defense}

TASK:
1. Conduct a deep comparative analysis of both arguments against the Bharatiya Nyaya Sanhita (BNS) and Bharatiya Nagarik Suraksha Sanhita (BNSS).
2. Identify specific 'Contradictions' or 'Legal Loopholed' in either side's argument.
3. Reference the Knowledge Vault (RAG) to find matching precedents or sections.
4. Give a 'Judicial Edge' - which side currently has a stronger legal standing?

Respond with ONLY JSON:
{{
  "prosecutionStrength": "1-10",
  "defenseStrength": "1-10",
  "contradictions": ["list of flaws"],
  "legalPrecedents": ["Relevant BNS/BNSS Sections"],
  "benchOpinion": "Deep judicial analysis of the debate (150 words)."
}}"""

    try:
        text = rotator.generate(prompt).strip()
        if text.startswith("```json"): text = text[7:]
        if text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        return json.loads(text.strip())
    except Exception as e:
        logger.error(str(e))
        return {"error": "Judicial Analysis system error."}

# ==============================
# 9. PRODUCTION OTP SYSTEM
# ==============================

class OTPManager:
    def __init__(self):
        self.store = {} # In-memory store: {email: {"hash": str, "expiry": datetime, "attempts": int, "phone": str}}
        self.rate_limits = {} # {email: [timestamps]}

    def _generate_otp(self):
        return str(random.randint(100000, 999999))

    def _hash_otp(self, otp: str):
        return pwd_context.hash(otp)

    def _verify_hash(self, otp: str, hashed: str):
        return pwd_context.verify(otp, hashed)

    def is_rate_limited(self, email: str):
        now = datetime.now()
        # Max 3 per hour
        if email not in self.rate_limits:
            return False
        # Clean old timestamps
        self.rate_limits[email] = [t for t in self.rate_limits[email] if t > now - timedelta(hours=1)]
        return len(self.rate_limits[email]) >= 3

    def send_and_store(self, email: str, phone: str = None):
        if self.is_rate_limited(email):
            return "RATE_LIMIT"

        otp = self._generate_otp()
        hashed = self._hash_otp(otp)
        expiry = datetime.now() + timedelta(minutes=5)
        
        self.store[email] = {
            "hash": hashed,
            "expiry": expiry,
            "attempts": 0,
            "phone": phone
        }
        
        # Track rate limit
        if email not in self.rate_limits:
            self.rate_limits[email] = []
        self.rate_limits[email].append(datetime.now())

        # DELIVERY
        email_sent = self._dispatch_email(email, otp)
        sms_sent = self._dispatch_sms(phone, otp) if phone else False
        
        return {"otp": otp, "email_sent": email_sent, "sms_sent": sms_sent}

    def verify(self, email: str, otp: str):
        if email not in self.store:
            return "NOT_FOUND"
        
        data = self.store[email]
        
        if datetime.now() > data["expiry"]:
            del self.store[email]
            return "EXPIRED"
        
        if data["attempts"] >= 3:
            del self.store[email]
            return "TOO_MANY_ATTEMPTS"

        if self._verify_hash(otp, data["hash"]):
            del self.store[email]
            return "SUCCESS"
        else:
            data["attempts"] += 1
            return "INVALID"

    def _dispatch_email(self, email: str, otp: str):
        api_key = os.environ.get("SENDGRID_API_KEY")
        sender = os.environ.get("SENDER_EMAIL")
        if not api_key or not sender:
            logger.warning("SendGrid credentials missing. Email skipped.")
            return False
        
        message = Mail(
            from_email=sender,
            to_emails=email,
            subject='Nyaya AI - Security Verification Code',
            html_content=f'<strong>Your Nyaya AI Verification Code is: {otp}</strong><br>Expires in 5 minutes.'
        )
        try:
            sg = SendGridAPIClient(api_key)
            sg.send(message)
            return True
        except Exception as e:
            logger.error(f"SendGrid Error: {e}")
            return False

    def _dispatch_sms(self, phone: str, otp: str):
        sid = os.environ.get("TWILIO_ACCOUNT_SID")
        token = os.environ.get("TWILIO_AUTH_TOKEN")
        from_phone = os.environ.get("TWILIO_PHONE_NUMBER")
        if not all([sid, token, from_phone]):
            logger.warning("Twilio credentials missing. SMS skipped.")
            return False
        
        try:
            client = TwilioClient(sid, token)
            client.messages.create(
                body=f"Your Nyaya AI Verification Code is: {otp}. Valid for 5 minutes.",
                from_=from_phone,
                to=phone
            )
            return True
        except Exception as e:
            logger.error(f"Twilio Error: {e}")
            return False

otp_manager = OTPManager()

@app.post("/send_otp")
async def send_otp(req: dict):
    email = req.get("email")
    # Retrieve phone from DB or request
    phone = req.get("phoneNumber")
    
    if not phone:
        # Try to look up phone from DB if it's a login flow
        try:
            conn = sqlite3.connect("nyaya_users.db")
            c = conn.cursor()
            c.execute("SELECT phone_number FROM users WHERE email=?", (email,))
            res = c.fetchone()
            if res:
                phone = res[0]
            conn.close()
        except:
            pass

    result = otp_manager.send_and_store(email, phone)
    
    if result == "RATE_LIMIT":
        return {"status": "error", "message": "Too many requests. Try again later."}
    
    # In production, we don't return the OTP in JSON. 
    # For user convenience during setup, we'll log it very clearly.
    logger.info(f"--- NYAYA AI OTP DELIVERY ---")
    logger.info(f"EMAIL: {email} | SMS: {phone}")
    logger.info(f"OTP_CODE: {result['otp']}")
    logger.info(f"Email Sent: {result['email_sent']} | SMS Sent: {result['sms_sent']}")
    logger.info(f"-----------------------------")

    return {
        "status": "success", 
        "message": "Verification code sent.",
        "debug_otp": result['otp'] if not os.environ.get("PRODUCTION") else None
    }

@app.post("/verify_otp")
async def verify_otp(data: dict):
    email = data.get("email")
    otp = data.get("otp")
    
    status = otp_manager.verify(email, otp)
    
    if status == "SUCCESS":
        try:
            conn = sqlite3.connect("nyaya_users.db")
            c = conn.cursor()
            c.execute("UPDATE users SET verified=1 WHERE email=?", (email,))
            conn.commit()
            conn.close()
        except:
            pass
        return {"status": "verified"}
    elif status == "EXPIRED":
        return {"status": "failed", "error": "Code expired. Please resend."}
    elif status == "TOO_MANY_ATTEMPTS":
        return {"status": "failed", "error": "Too many incorrect attempts. New code required."}
    elif status == "NOT_FOUND":
        return {"status": "failed", "error": "No active code found for this email."}
    else:
        return {"status": "failed", "error": "Invalid verification code."}

@app.post("/register")
async def register_user(data: dict):
    email = data.get("email")
    password = data.get("password")
    first_name = data.get("first_name", "")
    last_name = data.get("last_name", "")
    phone_number = data.get("phone_number", "")
    role = data.get("role")
    college = data.get("college", "")
    reg_no = data.get("registration_no", "")
    govt_id = data.get("govt_id", "")
    judicial_id = data.get("judicial_id", "")
    
    try:
        conn = sqlite3.connect("nyaya_users.db")
        c = conn.cursor()
        c.execute("INSERT OR REPLACE INTO users (email, password, first_name, last_name, phone_number, role, college, registration_no, govt_id, judicial_id, verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                  (email, password, first_name, last_name, phone_number, role, college, reg_no, govt_id, judicial_id, False))
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Error saving to DB: {e}")
        return {"status": "error", "error": str(e)}

@app.post("/login")
async def login_user(data: dict):
    email = data.get("email")
    password = data.get("password")
    try:
        conn = sqlite3.connect("nyaya_users.db")
        conn.row_factory = sqlite3.Row
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE email=? AND password=?", (email, password))
        user = c.fetchone()
        conn.close()
        if user:
            return {"status": "success", "user": dict(user)}
        return {"status": "error", "error": "Invalid credentials"}
    except Exception as e:
        logger.error(f"Login DB error: {e}")
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)