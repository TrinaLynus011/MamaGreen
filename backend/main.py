"""
MamaGreen — FastAPI Backend
Security-hardened, rate-limited, fully validated
"""
import os
import re
from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional
import pydantic
from pydantic import validator, Field
import httpx

from .database import get_db
from .models import init_db, User, MobilityLog, Challenge, Sprout, Leaderboard
from .ai_coach import get_coach_response
from .greenlens import analyze_image_data
from .auth import get_current_user, verify_password, get_password_hash, create_access_token

# ── Environment & Config ──────────────────────────────────────────────────────

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
ALLOWED_ORIGINS_ENV = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [o.strip() for o in ALLOWED_ORIGINS_ENV.split(",")]

# In development, also allow common local dev ports
if ENVIRONMENT == "development":
    ALLOWED_ORIGINS += [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ]
ALLOWED_ORIGINS = list(set(ALLOWED_ORIGINS))

# ── Rate Limiting (Custom, zero-dependency, efficient) ────────────────────────
import time
from collections import defaultdict

class CustomRateLimiter:
    def __init__(self, limit: int, window: int):
        self.limit = limit
        self.window = window
        self.requests = defaultdict(list)

    def check_limit(self, ip: str):
        now = time.time()
        # Clean older requests outside the window
        cutoff = now - self.window
        self.requests[ip] = [t for t in self.requests[ip] if t > cutoff]
        
        if len(self.requests[ip]) >= self.limit:
            raise HTTPException(status_code=429, detail="Too Many Requests")
        
        self.requests[ip].append(now)

# Limiters: Global (200/min), Chat (20/min), Log Trip (60/min)
global_limiter = CustomRateLimiter(200, 60)
chat_limiter = CustomRateLimiter(20, 60)
log_trip_limiter = CustomRateLimiter(60, 60)

def check_global_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    global_limiter.check_limit(client_ip)

def check_chat_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    chat_limiter.check_limit(client_ip)

def check_log_trip_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    log_trip_limiter.check_limit(client_ip)

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="MamaGreen Indian AI Sustainability API",
    description="Track, calculate, and reduce your daily environmental footprint",
    version="2.0.0",
    docs_url="/docs" if ENVIRONMENT == "development" else None,
    redoc_url=None,
    dependencies=[Depends(check_global_rate_limit)],
)

# ── Middleware ────────────────────────────────────────────────────────────────

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    print("VALIDATION ERROR:", exc.errors())
    try:
        body = await request.json()
        print("Request JSON body:", body)
    except Exception:
        try:
            body = await request.body()
            print("Request raw body:", body)
        except Exception:
            pass
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
def startup_event():
    init_db()

# ── Input Sanitization ────────────────────────────────────────────────────────

HTML_TAG_RE = re.compile(r"<[^>]+>")
DANGEROUS_CHARS_RE = re.compile(r"[<>&\"'`\x00-\x1f]")

def sanitize(value: str, max_len: int = 200) -> str:
    """Strip HTML tags, remove dangerous chars, truncate."""
    if not isinstance(value, str):
        return ""
    cleaned = HTML_TAG_RE.sub("", value)
    cleaned = DANGEROUS_CHARS_RE.sub("", cleaned)
    return cleaned.strip()[:max_len]

# ── Pydantic Schemas (validated) ──────────────────────────────────────────────

VALID_MODES = {"walking", "bicycle", "metro", "bus", "train", "auto", "scooter", "car"}
VALID_COMMUTE = {"Walking", "Cycling", "Bus", "Metro", "Train", "Auto", "Scooter", "Car", "Mixed"}

class RouteInput(pydantic.BaseModel):
    destination: str = Field(..., min_length=1, max_length=200)

    @validator("destination")
    def sanitize_destination(cls, v: str) -> str:
        return sanitize(v, 200)

class ChatInput(pydantic.BaseModel):
    message: str = Field(..., min_length=1, max_length=1000)
    context: Optional[str] = Field(None, max_length=500)

    @validator("message", "context")
    def sanitize_message(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        return sanitize(v, 1000)

class UserSetupInput(pydantic.BaseModel):
    fullName: str = Field(..., min_length=1, max_length=100)
    username: str = Field(..., min_length=1, max_length=80)
    email: str = Field(..., max_length=150)
    age: int = Field(..., ge=5, le=120)
    location: str = Field(..., min_length=1, max_length=100)
    commutePreference: str = Field(..., max_length=50)

    @validator("fullName", "username", "location", "email")
    def sanitize_str(cls, v: str) -> str:
        return sanitize(v)

    @validator("commutePreference")
    def validate_commute(cls, v: str) -> str:
        cleaned = sanitize(v)
        if cleaned not in VALID_COMMUTE:
            raise ValueError(f"Invalid commute preference: {v}")
        return cleaned

class UserUpdateInput(pydantic.BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=5, le=120)
    location: str = Field(..., min_length=1, max_length=100)
    commutePreference: str = Field(..., max_length=50)
    avatarType: Optional[str] = Field(None, max_length=30)

    @validator("username", "location")
    def sanitize_str(cls, v: str) -> str:
        return sanitize(v)

    @validator("commutePreference")
    def validate_commute(cls, v: str) -> str:
        cleaned = sanitize(v)
        if cleaned not in VALID_COMMUTE:
            raise ValueError(f"Invalid commute preference: {v}")
        return cleaned


class UserSettingsInput(pydantic.BaseModel):
    notificationsEnabled: Optional[bool] = True
    darkMode: Optional[bool] = False
    unitsPreference: Optional[str] = Field("metric", max_length=20)
    privacyLevel: Optional[str] = Field("public", max_length=20)
    accentColor: Optional[str] = Field("forest", max_length=20)
    weeklyCarbonTarget: Optional[int] = 20
    weeklyStepsGoal: Optional[int] = 8000
    achievementAlerts: Optional[bool] = True
    carbonMilestones: Optional[bool] = True
    weeklySummaries: Optional[bool] = True
    transitRecs: Optional[bool] = True
    shareStats: Optional[bool] = True
    publicProfile: Optional[bool] = True
    rankingVisibility: Optional[bool] = True

    @validator("unitsPreference")
    def validate_units(cls, v: Optional[str]) -> str:
        if v is None:
            return "metric"
        cleaned = sanitize(v, 20).lower()
        if cleaned not in {"metric", "imperial"}:
            raise ValueError("Invalid units preference")
        return cleaned

    @validator("privacyLevel")
    def validate_privacy(cls, v: Optional[str]) -> str:
        if v is None:
            return "public"
        cleaned = sanitize(v, 20).lower()
        if cleaned not in {"public", "private"}:
            raise ValueError("Invalid privacy level")
        return cleaned

    @validator("accentColor")
    def validate_accent(cls, v: Optional[str]) -> str:
        if v is None:
            return "forest"
        cleaned = sanitize(v, 20).lower()
        if cleaned not in {"forest", "ocean", "earth"}:
            raise ValueError("Invalid accent color")
        return cleaned

class LogTripInput(pydantic.BaseModel):
    mode: str = Field(..., max_length=20)
    distance: float = Field(..., gt=0, le=500)
    duration: float = Field(..., gt=0, le=720)

    @validator("mode")
    def validate_mode(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in VALID_MODES:
            raise ValueError(f"Invalid transport mode: {v}")
        return v

# ── Emissions & Cost Constants ────────────────────────────────────────────────

EMISSIONS_FACTORS = {
    "walking": 0.0, "bicycle": 0.0, "metro": 0.015,
    "bus": 0.040, "train": 0.012, "auto": 0.080,
    "scooter": 0.055, "car": 0.185,
}

CALORIES_FACTORS = {
    "walking": 60.0, "bicycle": 40.0, "metro": 0.0,
    "bus": 0.0, "train": 0.0, "auto": 0.0, "scooter": 0.0, "car": 0.0,
}

COST_FLAT = {
    "walking": 0, "bicycle": 0, "metro": 30, "bus": 15,
    "train": 20, "auto": 25, "scooter": 0, "car": 0,
}

COST_PER_KM = {
    "walking": 0, "bicycle": 0, "metro": 2, "bus": 1,
    "train": 1.5, "auto": 15, "scooter": 4, "car": 12,
}

SPEED_KMH = {
    "walking": 4.5, "bicycle": 14, "metro": 35, "bus": 18,
    "train": 40, "auto": 22, "scooter": 28, "car": 25,
}

CAR_EMISSION_FACTOR = EMISSIONS_FACTORS["car"]

def trip_cost(mode: str, distance: float) -> float:
    flat = COST_FLAT.get(mode, 0)
    per_km = COST_PER_KM.get(mode, 12)
    return round(flat + per_km * distance, 1)

# ── EcoHealth Score ───────────────────────────────────────────────────────────

def calculate_ecohealth_score(db: Session, user_id: int) -> float:
    score = 50.0
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return score

    active_logs = db.query(MobilityLog).filter(
        MobilityLog.user_id == user_id,
        MobilityLog.mode.in_(["walking", "bicycle"])
    ).limit(30).all()
    active_km = sum(log.distance for log in active_logs)
    score += min(30.0, active_km * 4.0)

    transit_logs = db.query(MobilityLog).filter(
        MobilityLog.user_id == user_id,
        MobilityLog.mode.in_(["metro", "bus", "train"])
    ).limit(30).all()
    transit_km = sum(log.distance for log in transit_logs)
    score += min(20.0, transit_km * 2.0)

    score -= min(25.0, user.carbon_today * 10.0)
    score += min(10.0, user.steps_today / 1000.0)

    return float(max(10.0, min(100.0, score)))

def get_ecohealth_title(level: int) -> str:
    if level >= 6: return "Transit Champion"
    if level == 5: return "Carbon Saver"
    if level == 4: return "Sustainable Traveler"
    if level == 3: return "Green Explorer"
    if level == 2: return "Smart Commuter"
    return "Eco Starter"

def update_sprout_progression(sprout: Sprout):
    xp_required = sprout.level * 100
    while sprout.xp >= xp_required:
        sprout.xp -= xp_required
        sprout.level += 1
        xp_required = sprout.level * 100
    if sprout.level >= 10:
        sprout.evolution_stage = "Tree Spirit"
    elif sprout.level >= 6:
        sprout.evolution_stage = "Sapling"
    elif sprout.level >= 3:
        sprout.evolution_stage = "Sprout"
    else:
        sprout.evolution_stage = "Seed"

# ── Profile Helpers ───────────────────────────────────────────────────────────

def build_profile_response(user: User, sprout: Sprout, db: Session) -> dict:
    logs = db.query(MobilityLog).filter(MobilityLog.user_id == user.id).all()
    total_saved_inr = sum(
        max(0.0, log.distance * 12.0 - log.cost)
        for log in logs if log.mode != "car"
    )
    completion = 0
    if user.username and user.username != "EcoHero": completion += 20
    if user.age and user.age > 0: completion += 15
    if user.primary_location and user.primary_location != "Bengaluru": completion += 20
    if user.commute_preference and user.commute_preference != "Mixed": completion += 20
    if user.avatar_type and user.avatar_type != "transit": completion += 15
    log_count = db.query(MobilityLog).filter(MobilityLog.user_id == user.id).count()
    if log_count > 0: completion += 10

    return {
        "id": user.id,
        "username": user.username,
        "name": user.username,
        "age": user.age,
        "primary_location": user.primary_location,
        "location": user.primary_location,
        "commute_preference": user.commute_preference,
        "commute_type": user.commute_preference,
        "avatar_type": user.avatar_type or "transit",
        "avatar": user.avatar_type or "transit",
        "profile_completion": min(100, completion),
        "onboarding_completed": bool(user.onboarding_completed),
        "created_at": user.created_at or "",
        "updated_at": user.updated_at or "",
        "xp": user.xp,
        "level": user.level,
        "streak": user.streak,
        "ecohealth_score": round(user.ecohealth_score, 1),
        "ecohealth_level": get_ecohealth_title(user.level),
        "carbon_saved": round(user.carbon_saved, 2),
        "carbon_today": round(user.carbon_today, 2),
        "money_saved": round(total_saved_inr, 1),
        "steps_today": user.steps_today,
        "calories_today": round(user.calories_today, 1),
        "settings": {
            "notificationsEnabled": bool(user.notifications_enabled),
            "darkMode": bool(user.dark_mode),
            "unitsPreference": user.units_preference or "metric",
            "privacyLevel": user.privacy_level or "public",
            "accentColor": user.accent_color or "forest",
            "weeklyCarbonTarget": user.weekly_carbon_target or 20,
            "weeklyStepsGoal": user.weekly_steps_goal or 8000,
            "achievementAlerts": bool(user.achievement_alerts),
            "carbonMilestones": bool(user.carbon_milestones),
            "weeklySummaries": bool(user.weekly_summaries),
            "transitRecs": bool(user.transit_recs),
            "shareStats": bool(user.share_stats),
            "publicProfile": bool(user.public_profile),
            "rankingVisibility": bool(user.ranking_visibility),
        },
        "sprout": {
            "name": sprout.name if sprout else "Sprout",
            "level": sprout.level if sprout else 1,
            "mood": sprout.mood if sprout else "Happy",
            "evolution_stage": sprout.evolution_stage if sprout else "Seed",
            "xp": sprout.xp if sprout else 0,
            "energy": sprout.energy if sprout else 100,
            "xp_next_level": (sprout.level if sprout else 1) * 100,
        },
    }

class UserRegisterInput(pydantic.BaseModel):
    email: str = Field(..., max_length=150)
    password: str = Field(..., min_length=6, max_length=100)
    fullName: str = Field(..., min_length=1, max_length=100)
    age: int = Field(..., ge=5, le=120)
    location: str = Field(..., min_length=1, max_length=100)
    commutePreference: str = Field(..., max_length=50)

    @validator("fullName", "location", "email")
    def sanitize_str(cls, v: str) -> str:
        return sanitize(v)

    @validator("commutePreference")
    def validate_commute(cls, v: str) -> str:
        cleaned = sanitize(v)
        if cleaned not in VALID_COMMUTE:
            raise ValueError(f"Invalid commute preference: {v}")
        return cleaned

class UserLoginInput(pydantic.BaseModel):
    email: str = Field(..., max_length=150)
    password: str = Field(..., min_length=1, max_length=100)

    @validator("email")
    def sanitize_email(cls, v: str) -> str:
        return sanitize(v)

def seed_user_data(db: Session, user: User, commute_preference: str):
    # Seed default Sprout pet
    sprout = db.query(Sprout).filter(Sprout.user_id == user.id).first()
    if not sprout:
        db_sprout = Sprout(
            user_id=user.id,
            name="Sprout",
            level=1,
            mood="Happy",
            evolution_stage="Seed",
            xp=0,
            energy=100
        )
        db.add(db_sprout)
        
    # Seed Challenges specific to this user
    challs = db.query(Challenge).filter(Challenge.user_id == user.id).first()
    if not challs:
        db_challenges = [
            Challenge(user_id=user.id, title="Walk 5,000 steps", description="Walk around college or office, log at least 5,000 steps today.", type="daily", goal_value=5000.0, current_value=0.0, reward_xp=50, reward_score=2.0),
            Challenge(user_id=user.id, title="Use public transport once", description="Take a Metro or BMTC/BEST bus instead of using a scooter or cab.", type="daily", goal_value=1.0, current_value=0.0, reward_xp=40, reward_score=1.5),
            Challenge(user_id=user.id, title="Reduce 1kg CO₂", description="Save at least 1kg of carbon emissions today compared to solo driving.", type="daily", goal_value=1.0, current_value=0.0, reward_xp=60, reward_score=3.0),
            
            Challenge(user_id=user.id, title="Ditch cabs for 3 commutes", description="Use Metro, cycling, or walking for 3 commutes this week.", type="weekly", goal_value=3.0, current_value=0.0, reward_xp=120, reward_score=4.0),
            Challenge(user_id=user.id, title="Save ₹250 in fuel/fares", description="Save money on transit by utilizing active or public transport options.", type="weekly", goal_value=250.0, current_value=0.0, reward_xp=150, reward_score=5.0),
            
            Challenge(user_id=user.id, title="Eco-Commuter Master: 50km active", description="Log 50km of walking or cycling cumulative distance this month.", type="monthly", goal_value=50.0, current_value=0.0, reward_xp=350, reward_score=10.0),
            Challenge(user_id=user.id, title="Nurture Sprout: Plant 5 Saplings", description="Evolve Sprout and complete challenges to plant virtual trees.", type="monthly", goal_value=5.0, current_value=0.0, reward_xp=300, reward_score=8.0)
        ]
        for c in db_challenges:
            db.add(c)
            
    # Seed 7 days of mobility logs
    logs = db.query(MobilityLog).filter(MobilityLog.user_id == user.id).first()
    if not logs:
        from datetime import timedelta
        for i in range(7, 0, -1):
            log_date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            if i % 3 == 0:
                db.add(MobilityLog(user_id=user.id, date=log_date, mode="walking", distance=2.5, duration=35.0, emissions=0.0, calories=150.0, cost=0.0))
                db.add(MobilityLog(user_id=user.id, date=log_date, mode="metro", distance=12.0, duration=20.0, emissions=0.18, calories=0.0, cost=30.0))
            elif i % 3 == 1:
                db.add(MobilityLog(user_id=user.id, date=log_date, mode="bicycle", distance=6.0, duration=25.0, emissions=0.0, calories=240.0, cost=0.0))
                db.add(MobilityLog(user_id=user.id, date=log_date, mode="bus", distance=8.0, duration=22.0, emissions=0.32, calories=0.0, cost=15.0))
            else:
                db.add(MobilityLog(user_id=user.id, date=log_date, mode="walking", distance=1.0, duration=12.0, emissions=0.0, calories=60.0, cost=0.0))
                db.add(MobilityLog(user_id=user.id, date=log_date, mode="auto", distance=7.0, duration=18.0, emissions=0.56, calories=0.0, cost=130.0))
    db.commit()

# ── Routes ────────────────────────────────────────────────────────────────────

@app.post("/api/auth/register")
def register_user(reg_in: UserRegisterInput, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == reg_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")
        
    today_str = datetime.now().strftime("%Y-%m-%d")
    pref = reg_in.commutePreference.strip().lower()
    if pref in ("walking", "cycling"):
        initial_score = 75.0
    elif pref in ("bus", "metro", "train", "mixed"):
        initial_score = 60.0
    else:
        initial_score = 40.0
        
    hashed_pwd = get_password_hash(reg_in.password)
    user = User(
        email=reg_in.email,
        hashed_password=hashed_pwd,
        username=reg_in.fullName.strip() or "EcoHero",
        age=reg_in.age,
        primary_location=reg_in.location.strip() or "Bengaluru",
        commute_preference=reg_in.commutePreference.strip(),
        xp=0,
        level=1,
        streak=1,
        ecohealth_score=initial_score,
        carbon_saved=0.0,
        carbon_today=0.0,
        steps_today=0,
        calories_today=0.0,
        onboarding_completed=True,
        notifications_enabled=True,
        dark_mode=False,
        units_preference="metric",
        privacy_level="public",
        last_active_date=today_str,
        created_at=today_str,
        updated_at=today_str,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    seed_user_data(db, user, reg_in.commutePreference)
    
    token = create_access_token({"sub": user.id})
    sprout = db.query(Sprout).filter(Sprout.user_id == user.id).first()
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "profile": build_profile_response(user, sprout, db)
    }

@app.post("/api/auth/login")
def login_user(login_in: UserLoginInput, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    if not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid email or password")
        
    token = create_access_token({"sub": user.id})
    sprout = db.query(Sprout).filter(Sprout.user_id == user.id).first()
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "profile": build_profile_response(user, sprout, db)
    }


@app.get("/api/user/profile")
def get_user_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sprout = db.query(Sprout).filter(Sprout.user_id == user.id).first()
    return build_profile_response(user, sprout, db)


@app.post("/api/user/update")
def update_user_profile(update_in: UserUpdateInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.username = update_in.username or user.username
    user.age = update_in.age
    user.primary_location = update_in.location or user.primary_location
    user.commute_preference = update_in.commutePreference or user.commute_preference
    if update_in.avatarType:
        user.avatar_type = sanitize(update_in.avatarType, 30)
    user.onboarding_completed = True
    user.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    db.refresh(user)
    sprout = db.query(Sprout).filter(Sprout.user_id == user.id).first()
    return build_profile_response(user, sprout, db)


@app.post("/api/user/settings")
def update_user_settings(settings_in: UserSettingsInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if settings_in.notificationsEnabled is not None:
        user.notifications_enabled = bool(settings_in.notificationsEnabled)
    if settings_in.darkMode is not None:
        user.dark_mode = bool(settings_in.darkMode)
    if settings_in.unitsPreference is not None:
        user.units_preference = settings_in.unitsPreference
    if settings_in.privacyLevel is not None:
        user.privacy_level = settings_in.privacyLevel
    if settings_in.accentColor is not None:
        user.accent_color = settings_in.accentColor
    if settings_in.weeklyCarbonTarget is not None:
        user.weekly_carbon_target = settings_in.weeklyCarbonTarget
    if settings_in.weeklyStepsGoal is not None:
        user.weekly_steps_goal = settings_in.weeklyStepsGoal
    if settings_in.achievementAlerts is not None:
        user.achievement_alerts = bool(settings_in.achievementAlerts)
    if settings_in.carbonMilestones is not None:
        user.carbon_milestones = bool(settings_in.carbonMilestones)
    if settings_in.weeklySummaries is not None:
        user.weekly_summaries = bool(settings_in.weeklySummaries)
    if settings_in.transitRecs is not None:
        user.transit_recs = bool(settings_in.transitRecs)
    if settings_in.shareStats is not None:
        user.share_stats = bool(settings_in.shareStats)
    if settings_in.publicProfile is not None:
        user.public_profile = bool(settings_in.publicProfile)
    if settings_in.rankingVisibility is not None:
        user.ranking_visibility = bool(settings_in.rankingVisibility)

    user.updated_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.commit()
    db.refresh(user)
    sprout = db.query(Sprout).filter(Sprout.user_id == user.id).first()
    return build_profile_response(user, sprout, db)


@app.post("/api/log-trip", dependencies=[Depends(check_log_trip_rate_limit)])
def log_trip_endpoint(log_in: LogTripInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sprout = db.query(Sprout).filter(Sprout.user_id == user.id).first()

    mode = log_in.mode
    distance = log_in.distance
    duration = log_in.duration

    trip_emissions = round(distance * EMISSIONS_FACTORS.get(mode, 0.185), 3)
    trip_calories = round(distance * CALORIES_FACTORS.get(mode, 0.0), 1)
    trip_cost_inr = trip_cost(mode, distance)

    car_equiv_emissions = distance * CAR_EMISSION_FACTOR
    saved_emissions = max(0.0, car_equiv_emissions - trip_emissions)
    car_equiv_cost = trip_cost("car", distance)
    saved_money = max(0.0, car_equiv_cost - trip_cost_inr)

    today_str = datetime.now().strftime("%Y-%m-%d")
    new_log = MobilityLog(
        user_id=user.id, date=today_str, mode=mode,
        distance=distance, duration=duration,
        emissions=trip_emissions, calories=trip_calories, cost=trip_cost_inr,
    )
    db.add(new_log)

    user.carbon_today = round(user.carbon_today + trip_emissions, 2)
    user.carbon_saved = round(user.carbon_saved + saved_emissions, 2)
    user.calories_today = round(user.calories_today + trip_calories, 1)
    if mode == "walking":
        user.steps_today += int(distance * 1300)

    xp_gained = 0
    if mode in ("walking", "bicycle"):
        xp_gained = int(distance * 20)
    elif mode in ("metro", "bus", "train"):
        xp_gained = int(distance * 12)
    elif mode == "auto":
        xp_gained = int(distance * 4)

    user.xp += xp_gained
    level_up = False
    xp_req = user.level * 200
    while user.xp >= xp_req:
        user.xp -= xp_req
        user.level += 1
        level_up = True
        xp_req = user.level * 200

    if sprout:
        sprout.xp += xp_gained
        update_sprout_progression(sprout)
        if mode in ("walking", "bicycle"):
            sprout.energy = min(100, sprout.energy + 15)
            sprout.mood = "Thriving"
        elif mode in ("metro", "bus", "train"):
            sprout.energy = min(100, sprout.energy + 8)
            sprout.mood = "Happy"
        elif mode == "car":
            sprout.energy = max(0, sprout.energy - 20)
            sprout.mood = "Sad" if sprout.energy < 40 else "Neutral"
        else:
            sprout.energy = max(0, sprout.energy - 8)
            sprout.mood = "Sad" if sprout.energy < 40 else "Neutral"
        if datetime.now().hour >= 20 and user.steps_today < 3000:
            sprout.mood = "Sleepy"

    user.ecohealth_score = calculate_ecohealth_score(db, user.id)

    user_comp = db.query(Leaderboard).filter(Leaderboard.is_user == True).first()
    if user_comp:
        user_comp.xp = user.level * 200 + user.xp
    all_comps = db.query(Leaderboard).order_by(Leaderboard.xp.desc()).all()
    for rank_idx, comp in enumerate(all_comps):
        comp.rank = rank_idx + 1

    challs = db.query(Challenge).filter(Challenge.user_id == user.id, Challenge.is_completed == False).all()
    for ch in challs:
        tl = ch.title.lower()
        if "walk" in tl and mode == "walking":
            ch.current_value = float(user.steps_today)
        elif "public transport" in tl and mode in ("metro", "bus", "train"):
            ch.current_value = 1.0
        elif ("reduce" in tl or "co₂" in tl or "co2" in tl) and saved_emissions > 0:
            ch.current_value = round(ch.current_value + saved_emissions, 2)
        elif "ditch" in tl and mode in ("walking", "bicycle", "metro", "bus", "train"):
            ch.current_value = float(ch.current_value + 1.0)
        elif "save" in tl and "₹" in ch.title and saved_money > 0:
            ch.current_value = round(ch.current_value + saved_money, 2)
        elif ("active" in tl or "eco-commuter" in tl or "eco-fitness" in tl or "km" in tl) and mode in ("walking", "bicycle"):
            ch.current_value = round(ch.current_value + distance, 2)
        if ch.current_value >= ch.goal_value:
            ch.is_completed = True

    db.commit()
    return {
        "status": "success",
        "xpGained": xp_gained,
        "levelUp": level_up,
        "emissions": trip_emissions,
        "savedEmissions": round(saved_emissions, 2),
        "calories": trip_calories,
        "cost": trip_cost_inr,
        "moneySaved": round(saved_money, 1),
        "sprout": {"mood": sprout.mood if sprout else "Happy", "energy": sprout.energy if sprout else 100},
    }


# Keep old form endpoint as alias for backwards compatibility
@app.post("/api/mobility/log", dependencies=[Depends(check_log_trip_rate_limit)])
def log_mobility_trip_legacy(
    mode: str = Form(...),
    distance: float = Form(...),
    duration: float = Form(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    validated = LogTripInput(mode=mode, distance=distance, duration=duration)
    return log_trip_endpoint(validated, user, db)


@app.get("/api/history")
def get_history(db: Session = Depends(get_db)):
    logs = db.query(MobilityLog).order_by(MobilityLog.id.desc()).limit(30).all()
    return [
        {
            "id": log.id, "date": log.date, "mode": log.mode,
            "distance": round(log.distance, 1), "duration": round(log.duration, 0),
            "emissions": round(log.emissions, 3), "calories": round(log.calories, 1),
            "cost": round(log.cost, 1),
        }
        for log in logs
    ]


@app.get("/api/mobility/history")
def get_mobility_history_legacy(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return get_history(user, db)


@app.post("/api/route/compare")
def compare_routes(route_in: RouteInput):
    dest = route_in.destination
    if not dest:
        raise HTTPException(status_code=400, detail="Destination cannot be empty")

    dist = max(2.5, min(25.0, float(len(dest) * 0.7)))
    modes = ["walking", "bicycle", "metro", "bus", "auto", "car"]
    routes = []
    for m in modes:
        emissions = round(dist * EMISSIONS_FACTORS.get(m, 0.185), 3)
        calories = round(dist * CALORIES_FACTORS.get(m, 0.0), 0)
        cost = trip_cost(m, dist)
        speed = SPEED_KMH.get(m, 20)
        duration = round((dist / speed) * 60 + (5.0 if m in ("bus", "metro") else 0.0), 0)
        car_co2 = round(dist * CAR_EMISSION_FACTOR, 3)
        car_cost = trip_cost("car", dist)
        routes.append({
            "mode": m,
            "distance": round(dist, 1),
            "duration": duration,
            "emissions": emissions,
            "calories": int(calories),
            "cost": cost,
            "co2Saved": round(max(0.0, car_co2 - emissions), 3),
            "moneySaved": round(max(0.0, car_cost - cost), 1),
        })

    lowest_co2 = min(routes, key=lambda r: r["emissions"])["mode"]
    recommended = "cycling" if dist < 5 else ("metro" if dist > 7 else "bus")
    reason = (
        "Zero emissions, burns calories, saves money vs. auto." if dist < 5
        else "Fastest green option — AC Metro is emission-efficient."
    )
    return {"destination": dest, "distance": round(dist, 1), "routes": routes,
            "lowestCarbonMode": lowest_co2, "recommendation": {"mode": recommended, "reason": reason}}


@app.get("/api/leaderboard")
def get_leaderboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    all_users = db.query(User).all()
    static_comps = db.query(Leaderboard).filter(Leaderboard.is_user == False).all()
    
    entries = []
    for u in all_users:
        total_xp = u.level * 200 + u.xp
        is_curr = (u.id == user.id)
        username = f"{u.username} (You)" if is_curr else u.username
        entries.append({
            "username": username,
            "xp": total_xp,
            "isUser": is_curr
        })
        
    for c in static_comps:
        entries.append({
            "username": c.username,
            "xp": c.xp,
            "isUser": False
        })
        
    entries.sort(key=lambda x: x["xp"], reverse=True)
    for idx, entry in enumerate(entries):
        entry["rank"] = idx + 1
        
    return entries


@app.get("/api/weather")
def get_weather(city: str = "Bengaluru"):
    city = sanitize(city, 50)
    weathers = {
        "bengaluru": {"temp": 27.5, "condition": "Overcast & Cloudy", "tip": "Pleasant breeze — perfect for walking or cycling to Indiranagar!"},
        "mumbai": {"temp": 31.0, "condition": "Humid / Patchy Rain", "tip": "Humid outside. Take the AC Metro — zero emissions, full comfort."},
        "delhi": {"temp": 38.5, "condition": "Sunny / Heat Alert", "tip": "Strong sunlight. Avoid cycling now. Opt for the Metro to stay safe and green."},
        "chennai": {"temp": 33.0, "condition": "Hot & Humid", "tip": "Keep hydrated. Choose electric suburban trains over autos to save ₹50."},
        "coimbatore": {"temp": 29.0, "condition": "Partly Cloudy", "tip": "Good weather for a cycle ride or walk — save emissions and calories."},
        "hyderabad": {"temp": 32.0, "condition": "Clear Skies", "tip": "Take TSRTC Metro Rail — reduce 85% carbon vs. driving your car."},
        "pune": {"temp": 26.0, "condition": "Mild & Breezy", "tip": "Excellent cycling weather! Log a trip to earn XP and boost your EcoScore."},
    }
    key = city.strip().lower()
    data = weathers.get(key, weathers["bengaluru"])
    return {"city": city, "temp": data["temp"], "condition": data["condition"], "tip": data["tip"]}


@app.post("/api/chat", dependencies=[Depends(check_chat_rate_limit)])
async def chat_with_coach(chat_in: ChatInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    msg = chat_in.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    if len(msg) > 1000:
        raise HTTPException(status_code=400, detail="Message too long (max 1000 chars)")
    reply = await get_coach_response(msg, user)
    return {"reply": reply}


@app.post("/api/greenlens")
async def upload_lens_image(file: UploadFile = File(...)):
    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 10 MB)")
    allowed_types = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(status_code=415, detail="Unsupported image format")
    content = await file.read()
    analysis = await analyze_image_data(file.filename, content)
    return analysis


@app.get("/api/challenges")
def get_challenges(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    challs = db.query(Challenge).filter(Challenge.user_id == user.id).all()
    return [
        {
            "id": c.id, "title": c.title, "description": c.description,
            "type": c.type, "goalValue": c.goal_value,
            "currentValue": round(min(c.goal_value, c.current_value), 1),
            "rewardXp": c.reward_xp, "rewardScore": c.reward_score,
            "isCompleted": c.is_completed, "isClaimed": c.is_claimed,
        }
        for c in challs
    ]


@app.post("/api/challenges/{challenge_id}/claim")
def claim_challenge(challenge_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if challenge_id <= 0:
        raise HTTPException(status_code=400, detail="Invalid challenge ID")
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id, Challenge.user_id == user.id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    if not challenge.is_completed:
        raise HTTPException(status_code=400, detail="Challenge not completed yet")
    if challenge.is_claimed:
        raise HTTPException(status_code=400, detail="Reward already claimed")

    challenge.is_claimed = True
    user.xp += challenge.reward_xp
    user.ecohealth_score = min(100.0, user.ecohealth_score + challenge.reward_score)

    xp_req = user.level * 200
    while user.xp >= xp_req:
        user.xp -= xp_req
        user.level += 1
        xp_req = user.level * 200

    sprout = db.query(Sprout).filter(Sprout.user_id == user.id).first()
    if sprout:
        sprout.xp += challenge.reward_xp
        sprout.mood = "Thriving"
        sprout.energy = min(100, sprout.energy + 20)
        update_sprout_progression(sprout)

    db.commit()
    return {"status": "success", "xpReward": challenge.reward_xp, "scoreReward": challenge.reward_score}


# Legacy claim endpoint alias
@app.post("/api/challenges/claim/{challenge_id}")
def claim_challenge_legacy(challenge_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return claim_challenge(challenge_id, user, db)


@app.get("/api/analytics")
def get_analytics(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(MobilityLog).filter(MobilityLog.user_id == user.id).all()

    dates_list = sorted({log.date for log in logs})[-7:]
    emissions_trend, fitness_trend, cost_savings, ecohealth_trend = [], [], [], []

    for idx, date in enumerate(dates_list):
        day_logs = [l for l in logs if l.date == date]
        day_emissions = sum(l.emissions for l in day_logs)
        day_dist = sum(l.distance for l in day_logs)
        day_calories = sum(l.calories for l in day_logs)
        day_savings = sum(max(0.0, l.distance * 12.0 - l.cost) for l in day_logs if l.mode != "car")
        day_saved_co2 = sum(max(0.0, l.distance * CAR_EMISSION_FACTOR - l.emissions) for l in day_logs)

        dt = datetime.strptime(date, "%Y-%m-%d")
        day_label = dt.strftime("%a")
        emissions_trend.append({"day": day_label, "actual": round(day_emissions, 2), "saved": round(day_saved_co2, 2)})
        fitness_trend.append({"day": day_label, "distance": round(day_dist, 1), "calories": round(day_calories, 0)})
        cost_savings.append({"day": day_label, "amount": round(day_savings, 1)})
        ecohealth_trend.append({"day": day_label, "score": round(user.ecohealth_score, 1)})

    mode_counts: dict = {}
    for log in logs:
        m = log.mode.lower()
        mode_counts[m] = mode_counts.get(m, 0) + 1
    mode_colors = {"walking": "#10B981", "bicycle": "#14B8A6", "metro": "#6366F1",
                   "bus": "#3B82F6", "auto": "#F59E0B", "scooter": "#8B5CF6", "car": "#EF4444"}
    mode_breakdown = [
        {"name": m.capitalize(), "value": c, "color": mode_colors.get(m, "#6B7280")}
        for m, c in mode_counts.items()
    ]

    total_dist = sum(l.distance for l in logs)
    total_co2_saved = sum(max(0.0, l.distance * CAR_EMISSION_FACTOR - l.emissions) for l in logs)
    total_money = sum(max(0.0, l.distance * 12.0 - l.cost) for l in logs if l.mode != "car")
    total_steps = sum(int(l.distance * 1300) for l in logs if l.mode == "walking")
    total_calories = sum(l.calories for l in logs)

    return {
        "emissionsTrend": emissions_trend,
        "fitnessTrend": fitness_trend,
        "costSavings": cost_savings,
        "ecohealthTrend": ecohealth_trend,
        "modeSplit": mode_breakdown,
        "totalCarbon": round(user.carbon_today, 2),
        "totalSaved": round(total_co2_saved, 2),
        "totalMoney": round(total_money, 1),
        "totalSteps": total_steps,
        "totalCalories": round(total_calories, 1),
        "totalDistance": round(total_dist, 1),
    }


@app.post("/api/user/setup")
def setup_user_profile(setup_in: UserSetupInput, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pref = setup_in.commutePreference.strip().lower()
    if pref in ("walking", "cycling"):
        initial_score = 75.0
    elif pref in ("bus", "metro", "train", "mixed"):
        initial_score = 60.0
    else:
        initial_score = 40.0

    today_str = datetime.now().strftime("%Y-%m-%d")
    user.username = setup_in.fullName.strip() or user.username
    user.age = setup_in.age
    user.primary_location = setup_in.location.strip() or user.primary_location
    user.commute_preference = setup_in.commutePreference.strip()
    user.ecohealth_score = initial_score
    user.onboarding_completed = True
    user.updated_at = today_str
    
    db.commit()
    db.refresh(user)

    # Seed sprout, logs, and challenges for this user if not present
    seed_user_data(db, user, setup_in.commutePreference)

    sprout = db.query(Sprout).filter(Sprout.user_id == user.id).first()
    return build_profile_response(user, sprout, db)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "2.0.0", "service": "MamaGreen API"}


if ENVIRONMENT == "development":
    @app.post("/api/dev/reset-db")
    def dev_reset_db(db: Session = Depends(get_db)):
        from .database import engine, Base
        from .models import get_password_hash, User, Sprout, Leaderboard, MobilityLog, Challenge
        from datetime import timedelta
        # Drop all tables
        Base.metadata.drop_all(bind=engine)
        # Recreate all tables
        Base.metadata.create_all(bind=engine)
        
        # Seed default data
        today_str = datetime.now().strftime("%Y-%m-%d")
        db_user = User(
            email="green@traveler.com",
            hashed_password=get_password_hash("green123"),
            username="Green Traveler",
            age=25,
            primary_location="Bengaluru",
            commute_preference="Mixed",
            avatar_type="balanced",
            profile_completion=80,
            created_at=today_str,
            updated_at=today_str,
            xp=80,
            level=3,
            streak=5,
            ecohealth_score=78.5,
            carbon_saved=42.3,
            carbon_today=1.4,
            steps_today=4200,
            calories_today=185.0,
            last_active_date=today_str
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Seed Sprout pet
        db_sprout = Sprout(
            user_id=db_user.id,
            name="Sprout",
            level=3,
            mood="Happy",
            evolution_stage="Sprout",
            xp=80,
            energy=85
        )
        db.add(db_sprout)
        
        # Seed Leaderboard
        competitors = [
            Leaderboard(username="Priya Sharma", xp=750, rank=1, is_user=False),
            Leaderboard(username="Rahul Verma", xp=680, rank=2, is_user=False),
            Leaderboard(username="Green Traveler (You)", xp=480, rank=3, is_user=True),
            Leaderboard(username="Amit Patel", xp=420, rank=4, is_user=False),
            Leaderboard(username="Rohan Das", xp=310, rank=5, is_user=False)
        ]
        for comp in competitors:
            db.add(comp)
        
        # Seed mobility logs
        logs_to_add = []
        for i in range(7, 0, -1):
            log_date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            if i % 3 == 0:
                logs_to_add.append(MobilityLog(user_id=db_user.id, date=log_date, mode="walking", distance=2.5, duration=35.0, emissions=0.0, calories=150.0, cost=0.0))
                logs_to_add.append(MobilityLog(user_id=db_user.id, date=log_date, mode="metro", distance=12.0, duration=20.0, emissions=0.18, calories=0.0, cost=30.0))
            elif i % 3 == 1:
                logs_to_add.append(MobilityLog(user_id=db_user.id, date=log_date, mode="bicycle", distance=6.0, duration=25.0, emissions=0.0, calories=240.0, cost=0.0))
                logs_to_add.append(MobilityLog(user_id=db_user.id, date=log_date, mode="bus", distance=8.0, duration=22.0, emissions=0.32, calories=0.0, cost=15.0))
            else:
                logs_to_add.append(MobilityLog(user_id=db_user.id, date=log_date, mode="walking", distance=1.0, duration=12.0, emissions=0.0, calories=60.0, cost=0.0))
                logs_to_add.append(MobilityLog(user_id=db_user.id, date=log_date, mode="auto", distance=7.0, duration=18.0, emissions=0.56, calories=0.0, cost=130.0))
        for log in logs_to_add:
            db.add(log)
            
        # Seed Challenges
        challenges = [
            Challenge(user_id=db_user.id, title="Walk 5,000 steps", description="Walk around college or office, log at least 5,000 steps today.", type="daily", goal_value=5000.0, current_value=4200.0, reward_xp=50, reward_score=2.0, is_completed=False, is_claimed=False),
            Challenge(user_id=db_user.id, title="Use public transport once", description="Take a Metro or BMTC/BEST bus instead of using a scooter or cab.", type="daily", goal_value=1.0, current_value=1.0, reward_xp=40, reward_score=1.5, is_completed=True, is_claimed=False),
            Challenge(user_id=db_user.id, title="Reduce 1kg CO₂", description="Save at least 1kg of carbon emissions today compared to solo driving.", type="daily", goal_value=1.0, current_value=0.8, reward_xp=60, reward_score=3.0, is_completed=False, is_claimed=False),
            Challenge(user_id=db_user.id, title="Ditch cabs for 3 commutes", description="Use Metro, cycling, or walking for 3 commutes this week.", type="weekly", goal_value=3.0, current_value=2.0, reward_xp=120, reward_score=4.0, is_completed=False, is_claimed=False),
            Challenge(user_id=db_user.id, title="Save ₹250 in fuel/fares", description="Save money on transit by utilizing active or public transport options.", type="weekly", goal_value=250.0, current_value=180.0, reward_xp=150, reward_score=5.0, is_completed=False, is_claimed=False),
            Challenge(user_id=db_user.id, title="Eco-Commuter Master: 50km active", description="Log 50km of walking or cycling cumulative distance this month.", type="monthly", goal_value=50.0, current_value=32.5, reward_xp=350, reward_score=10.0, is_completed=False, is_claimed=False),
            Challenge(user_id=db_user.id, title="Nurture Sprout: Plant 5 Saplings", description="Evolve Sprout and complete challenges to plant virtual trees.", type="monthly", goal_value=5.0, current_value=2.0, reward_xp=300, reward_score=8.0, is_completed=False, is_claimed=False)
        ]
        for challenge in challenges:
            db.add(challenge)
            
        db.commit()
        return {"status": "success", "message": "Database reset and seeded successfully"}
