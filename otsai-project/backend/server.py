"""
OtsAI Backend — FastAPI + MongoDB
Universal AI Generator Platform
"""
import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Request, Response, APIRouter, status, Header, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from jose import jwt, JWTError
import httpx
from dotenv import load_dotenv

# Load env BEFORE reading anything
load_dotenv()

from emergentintegrations.llm.chat import LlmChat, UserMessage

# ---- Config ----
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ["JWT_ALGORITHM"]
JWT_EXPIRE_MINUTES = int(os.environ["JWT_EXPIRE_MINUTES"])
EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
ADMIN_NAME = os.environ["ADMIN_NAME"]
NEW_USER_STARTING_CREDITS = int(os.environ["NEW_USER_STARTING_CREDITS"])
ADMIN_STARTING_CREDITS = int(os.environ["ADMIN_STARTING_CREDITS"])

logger = logging.getLogger("otsai")
logging.basicConfig(level=logging.INFO)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ---- Models (collection: users) ----
class User(BaseModel):
    user_id: str
    email: str
    name: str
    role: str = "user"  # "user" | "admin"
    credits: int = 0
    auth_provider: str = "password"  # "password" | "google"
    picture: Optional[str] = None
    created_at: datetime
    is_active: bool = True

class UserPublic(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    credits: int
    auth_provider: str
    picture: Optional[str] = None
    created_at: datetime

class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=80)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic

class Project(BaseModel):
    project_id: str
    user_id: str
    title: str
    description: str = ""
    status: str = "active"  # "active" | "archived"
    created_at: datetime
    updated_at: datetime
    generation_count: int = 0

class ProjectCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=2000)

class ProjectUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=120)
    description: Optional[str] = Field(default=None, max_length=2000)
    status: Optional[str] = None

class GenerationCreate(BaseModel):
    project_id: Optional[str] = None
    prompt: str = Field(min_length=1, max_length=8000)
    model: str = "gpt-5.2"  # gpt-5.2 | claude-sonnet-4-5-20250929 | gemini-3.1-pro-preview
    system_message: Optional[str] = None

class Generation(BaseModel):
    generation_id: str
    user_id: str
    project_id: Optional[str]
    prompt: str
    model: str
    provider: str
    output: str
    credits_used: int
    status: str  # "success" | "error"
    error: Optional[str] = None
    created_at: datetime

class CreditAdjustment(BaseModel):
    target_user_id: str
    amount: int  # can be negative
    adjustment_type: str  # "add" | "deduct" | "promo" | "correction" | "test"
    reason: str = Field(min_length=1, max_length=500)
    note: Optional[str] = Field(default=None, max_length=1000)

class CreditTransaction(BaseModel):
    transaction_id: str
    user_id: str
    amount: int  # positive add, negative deduct
    balance_after: int
    type: str  # "signup_bonus" | "generation" | "admin_adjust" | "promo" | "correction" | "test" | "refund"
    reference_id: Optional[str] = None  # generation_id or admin_adjustment_id
    description: str
    created_at: datetime

class AuditLog(BaseModel):
    log_id: str
    actor_user_id: str
    actor_email: str
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    metadata: dict = {}
    ip: Optional[str] = None
    created_at: datetime


# ---- Lifespan / DB ----
mongo_client: Optional[AsyncIOMotorClient] = None
db = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global mongo_client, db
    mongo_client = AsyncIOMotorClient(MONGO_URL)
    db = mongo_client[DB_NAME]
    # Indexes
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.user_sessions.create_index("session_token", unique=True)
    await db.user_sessions.create_index("user_id")
    await db.projects.create_index("project_id", unique=True)
    await db.projects.create_index([("user_id", 1), ("created_at", -1)])
    await db.generations.create_index("generation_id", unique=True)
    await db.generations.create_index([("user_id", 1), ("created_at", -1)])
    await db.credit_transactions.create_index("transaction_id", unique=True)
    await db.credit_transactions.create_index([("user_id", 1), ("created_at", -1)])
    await db.audit_logs.create_index([("created_at", -1)])

    # Seed admin
    await seed_admin()
    logger.info("OtsAI backend ready.")
    yield
    mongo_client.close()


async def seed_admin():
    existing = await db.users.find_one({"email": ADMIN_EMAIL}, {"_id": 0})
    if existing:
        # ensure admin role + credits not below threshold
        updates = {}
        if existing.get("role") != "admin":
            updates["role"] = "admin"
        if updates:
            await db.users.update_one({"email": ADMIN_EMAIL}, {"$set": updates})
        return

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    admin_doc = {
        "user_id": user_id,
        "email": ADMIN_EMAIL,
        "name": ADMIN_NAME,
        "role": "admin",
        "credits": ADMIN_STARTING_CREDITS,
        "auth_provider": "password",
        "password_hash": pwd_context.hash(ADMIN_PASSWORD),
        "picture": None,
        "created_at": now,
        "is_active": True,
    }
    await db.users.insert_one(admin_doc)
    await db.credit_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:16]}",
        "user_id": user_id,
        "amount": ADMIN_STARTING_CREDITS,
        "balance_after": ADMIN_STARTING_CREDITS,
        "type": "signup_bonus",
        "reference_id": None,
        "description": "Initial admin allocation",
        "created_at": now,
    })
    logger.info(f"Seeded admin user: {ADMIN_EMAIL}")


# ---- App ----
app = FastAPI(title="OtsAI API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api = APIRouter(prefix="/api")


# ---- Auth helpers ----
def create_jwt(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES)
    return jwt.encode({"sub": user_id, "exp": expire}, JWT_SECRET, algorithm=JWT_ALGORITHM)


def doc_to_public(doc: dict) -> UserPublic:
    return UserPublic(
        user_id=doc["user_id"],
        email=doc["email"],
        name=doc["name"],
        role=doc.get("role", "user"),
        credits=doc.get("credits", 0),
        auth_provider=doc.get("auth_provider", "password"),
        picture=doc.get("picture"),
        created_at=doc["created_at"],
    )


async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(default=None),
    session_token: Optional[str] = Cookie(default=None),
) -> dict:
    """Resolve user via either JWT (Authorization: Bearer) or session_token (cookie or Bearer)."""
    token = None
    auth_kind = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:].strip()
    if session_token:
        # cookie session token (Emergent google auth)
        sess = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if sess:
            expires_at = sess["expires_at"]
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at < datetime.now(timezone.utc):
                raise HTTPException(status_code=401, detail="Session expired")
            user_doc = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0, "password_hash": 0})
            if user_doc:
                return user_doc

    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Try JWT first
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if user_id:
            user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
            if user_doc:
                return user_doc
    except JWTError:
        pass

    # Fallback: treat token as session_token
    sess = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if sess:
        expires_at = sess["expires_at"]
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=401, detail="Session expired")
        user_doc = await db.users.find_one({"user_id": sess["user_id"]}, {"_id": 0, "password_hash": 0})
        if user_doc:
            return user_doc

    raise HTTPException(status_code=401, detail="Invalid or expired token")


async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def write_audit(actor: dict, action: str, target_type: Optional[str] = None,
                      target_id: Optional[str] = None, metadata: Optional[dict] = None,
                      ip: Optional[str] = None):
    await db.audit_logs.insert_one({
        "log_id": f"log_{uuid.uuid4().hex[:16]}",
        "actor_user_id": actor["user_id"],
        "actor_email": actor["email"],
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "metadata": metadata or {},
        "ip": ip,
        "created_at": datetime.now(timezone.utc),
    })


# ---- AI / Credits config ----
MODEL_REGISTRY = {
    "gpt-5.2": {"provider": "openai", "model": "gpt-5.2", "label": "GPT-5.2", "credits": 5},
    "claude-sonnet-4-5-20250929": {"provider": "anthropic", "model": "claude-sonnet-4-5-20250929", "label": "Claude Sonnet 4.5", "credits": 5},
    "gemini-3.1-pro-preview": {"provider": "gemini", "model": "gemini-3.1-pro-preview", "label": "Gemini 3 Pro", "credits": 4},
}


# ============ ROUTES ============

@api.get("/")
async def root():
    return {"app": "OtsAI", "status": "ok", "version": "1.0.0"}


@api.get("/health")
async def health():
    return {"status": "healthy", "time": datetime.now(timezone.utc).isoformat()}


# ---- Auth: Email/Password ----
@api.post("/auth/signup", response_model=TokenResponse)
async def signup(payload: SignupRequest, request: Request):
    existing = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    doc = {
        "user_id": user_id,
        "email": payload.email.lower(),
        "name": payload.name,
        "role": "user",
        "credits": NEW_USER_STARTING_CREDITS,
        "auth_provider": "password",
        "password_hash": pwd_context.hash(payload.password),
        "picture": None,
        "created_at": now,
        "is_active": True,
    }
    await db.users.insert_one(doc)
    await db.credit_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:16]}",
        "user_id": user_id,
        "amount": NEW_USER_STARTING_CREDITS,
        "balance_after": NEW_USER_STARTING_CREDITS,
        "type": "signup_bonus",
        "reference_id": None,
        "description": "Welcome to OtsAI — starter credits",
        "created_at": now,
    })
    await write_audit({"user_id": user_id, "email": payload.email.lower()}, "user.signup",
                      "user", user_id, {"provider": "password"}, request.client.host if request.client else None)
    public = doc_to_public(doc)
    return TokenResponse(access_token=create_jwt(user_id), user=public)


@api.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest, request: Request):
    user = await db.users.find_one({"email": payload.email.lower()}, {"_id": 0})
    if not user or not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not pwd_context.verify(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.get("is_active", True):
        raise HTTPException(status_code=403, detail="Account disabled")
    await write_audit(user, "user.login", "user", user["user_id"], {"provider": "password"},
                      request.client.host if request.client else None)
    return TokenResponse(access_token=create_jwt(user["user_id"]), user=doc_to_public(user))


# ---- Auth: Emergent Google OAuth ----
class GoogleSessionExchange(BaseModel):
    session_id: str


@api.post("/auth/google/session")
async def google_session_exchange(payload: GoogleSessionExchange, response: Response, request: Request):
    """Exchange session_id from Emergent Google Auth for our session_token cookie."""
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": payload.session_id},
        )
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()
    email = data["email"].lower()
    name = data.get("name", email)
    picture = data.get("picture")
    session_token = data["session_token"]

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    now = datetime.now(timezone.utc)
    if not existing:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        doc = {
            "user_id": user_id,
            "email": email,
            "name": name,
            "role": "user",
            "credits": NEW_USER_STARTING_CREDITS,
            "auth_provider": "google",
            "picture": picture,
            "created_at": now,
            "is_active": True,
        }
        await db.users.insert_one(doc)
        await db.credit_transactions.insert_one({
            "transaction_id": f"txn_{uuid.uuid4().hex[:16]}",
            "user_id": user_id,
            "amount": NEW_USER_STARTING_CREDITS,
            "balance_after": NEW_USER_STARTING_CREDITS,
            "type": "signup_bonus",
            "reference_id": None,
            "description": "Welcome to OtsAI — starter credits",
            "created_at": now,
        })
        existing = doc
        await write_audit(doc, "user.signup", "user", user_id, {"provider": "google"},
                          request.client.host if request.client else None)
    else:
        # Update name/picture if missing
        update = {}
        if picture and not existing.get("picture"):
            update["picture"] = picture
        if update:
            await db.users.update_one({"user_id": existing["user_id"]}, {"$set": update})

    # Save session
    expires_at = now + timedelta(days=7)
    await db.user_sessions.update_one(
        {"session_token": session_token},
        {"$set": {
            "session_token": session_token,
            "user_id": existing["user_id"],
            "expires_at": expires_at,
            "created_at": now,
        }},
        upsert=True,
    )
    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=7 * 24 * 60 * 60,
        path="/",
        secure=True,
        httponly=True,
        samesite="none",
    )
    await write_audit(existing, "user.login", "user", existing["user_id"], {"provider": "google"},
                      request.client.host if request.client else None)
    return {"user": doc_to_public(existing).model_dump(mode="json")}


@api.get("/auth/me", response_model=UserPublic)
async def me(user: dict = Depends(get_current_user)):
    return doc_to_public(user)


@api.post("/auth/logout")
async def logout(response: Response, session_token: Optional[str] = Cookie(default=None)):
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"ok": True}


# ---- Projects ----
@api.get("/projects")
async def list_projects(user: dict = Depends(get_current_user)):
    cursor = db.projects.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1)
    items = await cursor.to_list(length=200)
    return {"projects": items}


@api.post("/projects")
async def create_project(payload: ProjectCreate, user: dict = Depends(get_current_user)):
    project_id = f"proj_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    doc = {
        "project_id": project_id,
        "user_id": user["user_id"],
        "title": payload.title,
        "description": payload.description,
        "status": "active",
        "created_at": now,
        "updated_at": now,
        "generation_count": 0,
    }
    await db.projects.insert_one(doc)
    return {"project": {k: v for k, v in doc.items() if k != "_id"}}


@api.get("/projects/{project_id}")
async def get_project(project_id: str, user: dict = Depends(get_current_user)):
    proj = await db.projects.find_one({"project_id": project_id, "user_id": user["user_id"]}, {"_id": 0})
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    gens = await db.generations.find(
        {"project_id": project_id, "user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(length=100)
    return {"project": proj, "generations": gens}


@api.patch("/projects/{project_id}")
async def update_project(project_id: str, payload: ProjectUpdate, user: dict = Depends(get_current_user)):
    proj = await db.projects.find_one({"project_id": project_id, "user_id": user["user_id"]}, {"_id": 0})
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    updates = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if updates:
        updates["updated_at"] = datetime.now(timezone.utc)
        await db.projects.update_one({"project_id": project_id}, {"$set": updates})
    proj = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    return {"project": proj}


@api.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: dict = Depends(get_current_user)):
    proj = await db.projects.find_one({"project_id": project_id, "user_id": user["user_id"]}, {"_id": 0})
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.projects.delete_one({"project_id": project_id})
    await db.generations.delete_many({"project_id": project_id})
    return {"ok": True}


# ---- AI Generation ----
@api.get("/generate/models")
async def list_models():
    return {"models": [
        {"id": k, "label": v["label"], "provider": v["provider"], "credits": v["credits"]}
        for k, v in MODEL_REGISTRY.items()
    ]}


@api.post("/generate")
async def generate(payload: GenerationCreate, user: dict = Depends(get_current_user)):
    model_cfg = MODEL_REGISTRY.get(payload.model)
    if not model_cfg:
        raise HTTPException(status_code=400, detail="Unknown model")
    cost = model_cfg["credits"]

    # Check credits
    fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if fresh["credits"] < cost:
        raise HTTPException(status_code=402, detail=f"Insufficient credits — need {cost}, have {fresh['credits']}")

    # Validate project ownership if specified
    if payload.project_id:
        proj = await db.projects.find_one({"project_id": payload.project_id, "user_id": user["user_id"]}, {"_id": 0})
        if not proj:
            raise HTTPException(status_code=404, detail="Project not found")

    generation_id = f"gen_{uuid.uuid4().hex[:14]}"
    now = datetime.now(timezone.utc)
    sys_msg = payload.system_message or (
        "You are OtsAI — a universal AI generator that can produce anything the user asks for. "
        "Be concise, structured, and immediately useful. Use markdown when helpful."
    )

    output_text = ""
    status_str = "success"
    err = None
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=generation_id,
            system_message=sys_msg,
        ).with_model(model_cfg["provider"], model_cfg["model"])
        msg = UserMessage(text=payload.prompt)
        output_text = await chat.send_message(msg)
        if not isinstance(output_text, str):
            output_text = str(output_text)
    except Exception as e:
        logger.exception("LLM error")
        status_str = "error"
        err = str(e)[:500]

    # Persist generation
    gen_doc = {
        "generation_id": generation_id,
        "user_id": user["user_id"],
        "project_id": payload.project_id,
        "prompt": payload.prompt,
        "model": model_cfg["model"],
        "provider": model_cfg["provider"],
        "output": output_text,
        "credits_used": cost if status_str == "success" else 0,
        "status": status_str,
        "error": err,
        "created_at": now,
    }
    await db.generations.insert_one(gen_doc)

    if status_str == "success":
        # Deduct credits + ledger
        new_balance = fresh["credits"] - cost
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"credits": new_balance}})
        await db.credit_transactions.insert_one({
            "transaction_id": f"txn_{uuid.uuid4().hex[:16]}",
            "user_id": user["user_id"],
            "amount": -cost,
            "balance_after": new_balance,
            "type": "generation",
            "reference_id": generation_id,
            "description": f"Generation via {model_cfg['label']}",
            "created_at": now,
        })
        if payload.project_id:
            await db.projects.update_one(
                {"project_id": payload.project_id},
                {"$inc": {"generation_count": 1}, "$set": {"updated_at": now}},
            )

    return {
        "generation": {k: v for k, v in gen_doc.items() if k != "_id"},
        "balance": (fresh["credits"] - cost) if status_str == "success" else fresh["credits"],
    }


@api.get("/generations")
async def list_generations(limit: int = 50, user: dict = Depends(get_current_user)):
    items = await db.generations.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(min(limit, 200)).to_list(length=200)
    return {"generations": items}


# ---- Credits ----
@api.get("/credits/me")
async def my_credits(user: dict = Depends(get_current_user)):
    fresh = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0, "password_hash": 0})
    txns = await db.credit_transactions.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(length=50)
    return {"balance": fresh["credits"], "transactions": txns}


# ---- Admin ----
@api.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    users_count = await db.users.count_documents({})
    proj_count = await db.projects.count_documents({})
    gen_count = await db.generations.count_documents({})
    success_gen = await db.generations.count_documents({"status": "success"})
    total_credits_pipeline = await db.users.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$credits"}}}
    ]).to_list(length=1)
    total_credits = total_credits_pipeline[0]["total"] if total_credits_pipeline else 0
    return {
        "users": users_count,
        "projects": proj_count,
        "generations": gen_count,
        "successful_generations": success_gen,
        "total_credits_in_circulation": total_credits,
    }


@api.get("/admin/users")
async def admin_list_users(q: Optional[str] = None, limit: int = 100, admin: dict = Depends(require_admin)):
    query = {}
    if q:
        query["$or"] = [
            {"email": {"$regex": q, "$options": "i"}},
            {"name": {"$regex": q, "$options": "i"}},
            {"user_id": q},
        ]
    items = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).limit(min(limit, 500)).to_list(length=500)
    return {"users": items}


@api.get("/admin/users/{user_id}")
async def admin_get_user(user_id: str, admin: dict = Depends(require_admin)):
    u = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    txns = await db.credit_transactions.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(length=100)
    projs = await db.projects.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(length=50)
    return {"user": u, "transactions": txns, "projects": projs}


@api.post("/admin/credits/adjust")
async def admin_adjust_credits(payload: CreditAdjustment, request: Request, admin: dict = Depends(require_admin)):
    target = await db.users.find_one({"user_id": payload.target_user_id}, {"_id": 0, "password_hash": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found")
    if payload.adjustment_type not in ("add", "deduct", "promo", "correction", "test"):
        raise HTTPException(status_code=400, detail="Invalid adjustment_type")
    if payload.amount == 0:
        raise HTTPException(status_code=400, detail="Amount cannot be zero")

    delta = payload.amount
    # 'deduct' implies negative regardless of sign provided
    if payload.adjustment_type == "deduct":
        delta = -abs(payload.amount)
    elif payload.adjustment_type in ("add", "promo", "test"):
        delta = abs(payload.amount)
    # 'correction' uses sign as provided

    new_balance = max(0, target["credits"] + delta)
    actual_delta = new_balance - target["credits"]
    await db.users.update_one({"user_id": target["user_id"]}, {"$set": {"credits": new_balance}})
    adj_id = f"adj_{uuid.uuid4().hex[:16]}"
    now = datetime.now(timezone.utc)
    await db.credit_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:16]}",
        "user_id": target["user_id"],
        "amount": actual_delta,
        "balance_after": new_balance,
        "type": "admin_adjust",
        "reference_id": adj_id,
        "description": f"[{payload.adjustment_type}] {payload.reason}",
        "created_at": now,
    })
    await db.admin_adjustments.insert_one({
        "adjustment_id": adj_id,
        "admin_user_id": admin["user_id"],
        "admin_email": admin["email"],
        "target_user_id": target["user_id"],
        "target_email": target["email"],
        "amount_requested": payload.amount,
        "amount_applied": actual_delta,
        "balance_after": new_balance,
        "adjustment_type": payload.adjustment_type,
        "reason": payload.reason,
        "note": payload.note,
        "created_at": now,
    })
    await write_audit(admin, "admin.credit_adjust", "user", target["user_id"], {
        "adjustment_id": adj_id,
        "type": payload.adjustment_type,
        "amount_requested": payload.amount,
        "amount_applied": actual_delta,
        "balance_after": new_balance,
        "reason": payload.reason,
    }, request.client.host if request.client else None)
    return {"adjustment_id": adj_id, "balance_after": new_balance, "amount_applied": actual_delta}


@api.get("/admin/audit")
async def admin_audit(limit: int = 100, admin: dict = Depends(require_admin)):
    items = await db.audit_logs.find({}, {"_id": 0}).sort("created_at", -1).limit(min(limit, 500)).to_list(length=500)
    return {"logs": items}


@api.get("/admin/projects")
async def admin_projects(limit: int = 100, admin: dict = Depends(require_admin)):
    items = await db.projects.find({}, {"_id": 0}).sort("created_at", -1).limit(min(limit, 500)).to_list(length=500)
    return {"projects": items}


@api.patch("/admin/users/{user_id}/role")
async def admin_set_role(user_id: str, role: str, request: Request, admin: dict = Depends(require_admin)):
    if role not in ("user", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    target = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    await db.users.update_one({"user_id": user_id}, {"$set": {"role": role}})
    await write_audit(admin, "admin.role_change", "user", user_id, {"new_role": role},
                      request.client.host if request.client else None)
    return {"ok": True, "role": role}


# Mount router
app.include_router(api)


@app.get("/")
async def app_root():
    return {"app": "OtsAI", "api": "/api"}
