import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Setup test database
from backend.database import Base, get_db
from backend.main import app, CustomRateLimiter
from backend.models import User, Sprout, Challenge, Leaderboard

SQLALCHEMY_DATABASE_URL = "sqlite:///./test_mamagreen.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="module", autouse=True)
def test_db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    # Seed minimal data for testing endpoints
    db_user = User(
        username="TestHero",
        age=30,
        primary_location="Coimbatore",
        commute_preference="Cycling",
        avatar_type="cyclist",
        profile_completion=80,
        xp=10,
        level=1,
        streak=1,
        ecohealth_score=65.0,
        carbon_saved=5.0,
        carbon_today=0.0,
        steps_today=0,
        calories_today=0.0,
        last_active_date="2026-06-19"
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    db_sprout = Sprout(
        user_id=db_user.id,
        name="TestSprout",
        level=1,
        mood="Happy",
        evolution_stage="Seed",
        xp=10,
        energy=100
    )
    db.add(db_sprout)

    db_challenge = Challenge(
        id=1,
        title="Walk 8000 steps today",
        description="Walk active commutes",
        type="daily",
        goal_value=8000.0,
        current_value=0.0,
        reward_xp=50,
        reward_score=2.0,
        is_completed=False,
        is_claimed=False
    )
    db.add(db_challenge)
    
    competitors = [
        Leaderboard(username="Priya Sharma", xp=750, rank=1, is_user=False),
        Leaderboard(username="TestHero (You)", xp=10, rank=2, is_user=True)
    ]
    for comp in competitors:
        db.add(comp)

    db.commit()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists("./test_mamagreen.db"):
        os.remove("./test_mamagreen.db")

@pytest.fixture(scope="module")
def client(test_db):
    def override_get_db():
        try:
            yield test_db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_get_profile(client):
    response = client.get("/api/user/profile")
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "TestHero"
    assert data["primary_location"] == "Coimbatore"
    assert data["commute_preference"] == "Cycling"

def test_update_profile_validation(client):
    # Valid update
    response = client.post(
        "/api/user/update",
        json={
            "username": "NewHero",
            "age": 28,
            "location": "Chennai",
            "commutePreference": "Bus",
            "avatarType": "transit"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["username"] == "NewHero"
    assert data["primary_location"] == "Chennai"
    assert data["commute_preference"] == "Bus"

    # Invalid age update
    response = client.post(
        "/api/user/update",
        json={
            "username": "BadHero",
            "age": 3, # too young
            "location": "Chennai",
            "commutePreference": "Bus"
        }
    )
    assert response.status_code == 422

    # Invalid commute update
    response = client.post(
        "/api/user/update",
        json={
            "username": "BadHero2",
            "age": 30,
            "location": "Chennai",
            "commutePreference": "Rocket" # invalid
        }
    )
    assert response.status_code == 422

def test_log_trip(client):
    response = client.post(
        "/api/log-trip",
        json={
            "mode": "walking",
            "distance": 3.0,
            "duration": 40.0
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["xpGained"] > 0
    assert data["emissions"] == 0.0 # walking has 0 emissions

def test_weather_endpoint(client):
    response = client.get("/api/weather?city=Chennai")
    assert response.status_code == 200
    data = response.json()
    assert data["city"] == "Chennai"
    assert "temp" in data

def test_leaderboard(client):
    response = client.get("/api/leaderboard")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2
    assert data[0]["rank"] == 1

def test_rate_limiting():
    limiter = CustomRateLimiter(limit=2, window=10)
    # First request
    limiter.check_limit("127.0.0.1")
    # Second request
    limiter.check_limit("127.0.0.1")
    
    # Third request within 10s should raise HTTPException
    with pytest.raises(Exception) as exc_info:
        limiter.check_limit("127.0.0.1")
    assert exc_info.value.status_code == 429
