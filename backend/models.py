from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, create_engine
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import os
from .database import Base, engine

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True)
    username = Column(String, default="EcoHero")
    age = Column(Integer, default=25)
    primary_location = Column(String, default="Bengaluru")
    commute_preference = Column(String, default="Mixed")
    avatar_type = Column(String, default="transit")  # walker, cyclist, transit, driver, balanced
    
    # Settings
    notifications_enabled = Column(Boolean, default=True)
    dark_mode = Column(Boolean, default=False)
    units_preference = Column(String, default="metric")
    privacy_level = Column(String, default="public")
    
    accent_color = Column(String, default="forest")
    weekly_carbon_target = Column(Integer, default=20)
    weekly_steps_goal = Column(Integer, default=8000)
    achievement_alerts = Column(Boolean, default=True)
    carbon_milestones = Column(Boolean, default=True)
    weekly_summaries = Column(Boolean, default=True)
    transit_recs = Column(Boolean, default=True)
    share_stats = Column(Boolean, default=True)
    public_profile = Column(Boolean, default=True)
    ranking_visibility = Column(Boolean, default=True)
    
    onboarding_completed = Column(Boolean, default=False)
    profile_completion = Column(Integer, default=0)  # 0-100
    created_at = Column(String, default="")
    updated_at = Column(String, default="")
    xp = Column(Integer, default=0)
    level = Column(Integer, default=1)
    streak = Column(Integer, default=0)
    ecohealth_score = Column(Float, default=50.0)
    carbon_saved = Column(Float, default=0.0) # Total accumulated saved carbon (kg CO2)
    carbon_today = Column(Float, default=0.0) # Today's emissions (kg CO2)
    steps_today = Column(Integer, default=0)
    calories_today = Column(Float, default=0.0)
    last_active_date = Column(String, default="")

class MobilityLog(Base):
    __tablename__ = "mobility_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    date = Column(String, index=True) # YYYY-MM-DD
    mode = Column(String) # walking, bicycle, bus, train, metro, auto, scooter, car
    distance = Column(Float) # in km
    duration = Column(Float) # in minutes
    emissions = Column(Float) # in kg CO2
    calories = Column(Float) # in kcal
    cost = Column(Float) # in INR (₹)

class Challenge(Base):
    __tablename__ = "challenges"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True, nullable=True)
    title = Column(String)
    description = Column(String)
    type = Column(String) # daily, weekly, monthly
    goal_value = Column(Float)
    current_value = Column(Float)
    reward_xp = Column(Integer)
    reward_score = Column(Float)
    is_completed = Column(Boolean, default=False)
    is_claimed = Column(Boolean, default=False)

class Sprout(Base):
    __tablename__ = "sprout"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    name = Column(String, default="Sprout")
    level = Column(Integer, default=1)
    mood = Column(String, default="Happy") # Sad, Neutral, Happy, Thriving, Sleepy
    evolution_stage = Column(String, default="Seed") # Seed, Sprout, Sapling, Tree Spirit
    xp = Column(Integer, default=0)
    energy = Column(Integer, default=100) # 0-100% mascot energy

class Leaderboard(Base):
    __tablename__ = "leaderboard"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String)
    xp = Column(Integer)
    rank = Column(Integer)
    is_user = Column(Boolean, default=False)

def run_migrations():
    # Inspect schema and run migrations dynamically
    from sqlalchemy import text
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        # Check users table columns
        res = db.execute(text("PRAGMA table_info(users)")).fetchall()
        existing_user_cols = {row[1] for row in res}
        
        # Add columns to users if missing
        user_migrations = {
            "email": "ALTER TABLE users ADD COLUMN email VARCHAR",
            "hashed_password": "ALTER TABLE users ADD COLUMN hashed_password VARCHAR",
            "accent_color": "ALTER TABLE users ADD COLUMN accent_color VARCHAR DEFAULT 'forest'",
            "weekly_carbon_target": "ALTER TABLE users ADD COLUMN weekly_carbon_target INTEGER DEFAULT 20",
            "weekly_steps_goal": "ALTER TABLE users ADD COLUMN weekly_steps_goal INTEGER DEFAULT 8000",
            "achievement_alerts": "ALTER TABLE users ADD COLUMN achievement_alerts BOOLEAN DEFAULT 1",
            "carbon_milestones": "ALTER TABLE users ADD COLUMN carbon_milestones BOOLEAN DEFAULT 1",
            "weekly_summaries": "ALTER TABLE users ADD COLUMN weekly_summaries BOOLEAN DEFAULT 1",
            "transit_recs": "ALTER TABLE users ADD COLUMN transit_recs BOOLEAN DEFAULT 1",
            "share_stats": "ALTER TABLE users ADD COLUMN share_stats BOOLEAN DEFAULT 1",
            "public_profile": "ALTER TABLE users ADD COLUMN public_profile BOOLEAN DEFAULT 1",
            "ranking_visibility": "ALTER TABLE users ADD COLUMN ranking_visibility BOOLEAN DEFAULT 1",
        }
        
        for col, sql in user_migrations.items():
            if col not in existing_user_cols:
                db.execute(text(sql))
        
        # Check challenges table columns
        res_challenges = db.execute(text("PRAGMA table_info(challenges)")).fetchall()
        existing_challenge_cols = {row[1] for row in res_challenges}
        
        if "user_id" not in existing_challenge_cols:
            db.execute(text("ALTER TABLE challenges ADD COLUMN user_id INTEGER"))
            
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Migration error: {e}")
    finally:
        db.close()

def init_db():
    # Create tables only if they do not exist — data persists across restarts
    Base.metadata.create_all(bind=engine)
    run_migrations()

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            # Seed default user only on first run (empty database)
            from .auth import get_password_hash
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
                xp=80, # 480 XP total: Lvl 1 is 200, Lvl 2 is 400. Total = 80 XP remaining at Lvl 3.
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
            
            # Seed default Sprout pet
            db_sprout = Sprout(
                user_id=db_user.id,
                name="Sprout",
                level=3,
                mood="Happy",
                evolution_stage="Sprout",
                xp=80, # 180 XP total: Lvl 1 is 100, Lvl 2 is 200 (so 80 XP remaining at Lvl 3)
                energy=85
            )
            db.add(db_sprout)
            
            # Seed Leaderboard competitors
            competitors = [
                Leaderboard(username="Priya Sharma", xp=750, rank=1, is_user=False),
                Leaderboard(username="Rahul Verma", xp=680, rank=2, is_user=False),
                Leaderboard(username="Green Traveler (You)", xp=480, rank=3, is_user=True),
                Leaderboard(username="Amit Patel", xp=420, rank=4, is_user=False),
                Leaderboard(username="Rohan Das", xp=310, rank=5, is_user=False)
            ]
            for comp in competitors:
                db.add(comp)
            
            # Seed 7 days of mobility logs in INR (₹)
            logs_to_add = []
            
            for i in range(7, 0, -1):
                log_date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
                
                if i % 3 == 0:
                    # Healthy commute: walking & Metro
                    logs_to_add.append(MobilityLog(user_id=db_user.id, date=log_date, mode="walking", distance=2.5, duration=35.0, emissions=0.0, calories=150.0, cost=0.0))
                    logs_to_add.append(MobilityLog(user_id=db_user.id, date=log_date, mode="metro", distance=12.0, duration=20.0, emissions=0.18, calories=0.0, cost=30.0))
                elif i % 3 == 1:
                    # Cycling & Bus
                    logs_to_add.append(MobilityLog(user_id=db_user.id, date=log_date, mode="bicycle", distance=6.0, duration=25.0, emissions=0.0, calories=240.0, cost=0.0))
                    logs_to_add.append(MobilityLog(user_id=db_user.id, date=log_date, mode="bus", distance=8.0, duration=22.0, emissions=0.32, calories=0.0, cost=15.0))
                else:
                    # Auto commute
                    logs_to_add.append(MobilityLog(user_id=db_user.id, date=log_date, mode="walking", distance=1.0, duration=12.0, emissions=0.0, calories=60.0, cost=0.0))
                    logs_to_add.append(MobilityLog(user_id=db_user.id, date=log_date, mode="auto", distance=7.0, duration=18.0, emissions=0.56, calories=0.0, cost=130.0))
            
            for log in logs_to_add:
                db.add(log)
                
            # Seed Challenges (Daily, Weekly, Monthly) with user_id
            challenges = [
                # Daily Challenges
                Challenge(user_id=db_user.id, title="Walk 5,000 steps", description="Walk around college or office, log at least 5,000 steps today.", type="daily", goal_value=5000.0, current_value=4200.0, reward_xp=50, reward_score=2.0, is_completed=False, is_claimed=False),
                Challenge(user_id=db_user.id, title="Use public transport once", description="Take a Metro or BMTC/BEST bus instead of using a scooter or cab.", type="daily", goal_value=1.0, current_value=1.0, reward_xp=40, reward_score=1.5, is_completed=True, is_claimed=False),
                Challenge(user_id=db_user.id, title="Reduce 1kg CO₂", description="Save at least 1kg of carbon emissions today compared to solo driving.", type="daily", goal_value=1.0, current_value=0.8, reward_xp=60, reward_score=3.0, is_completed=False, is_claimed=False),
                
                # Weekly Missions
                Challenge(user_id=db_user.id, title="Ditch cabs for 3 commutes", description="Use Metro, cycling, or walking for 3 commutes this week.", type="weekly", goal_value=3.0, current_value=2.0, reward_xp=120, reward_score=4.0, is_completed=False, is_claimed=False),
                Challenge(user_id=db_user.id, title="Save ₹250 in fuel/fares", description="Save money on transit by utilizing active or public transport options.", type="weekly", goal_value=250.0, current_value=180.0, reward_xp=150, reward_score=5.0, is_completed=False, is_claimed=False),
                
                # Monthly Missions
                Challenge(user_id=db_user.id, title="Eco-Commuter Master: 50km active", description="Log 50km of walking or cycling cumulative distance this month.", type="monthly", goal_value=50.0, current_value=32.5, reward_xp=350, reward_score=10.0, is_completed=False, is_claimed=False),
                Challenge(user_id=db_user.id, title="Nurture Sprout: Plant 5 Saplings", description="Evolve Sprout and complete challenges to plant virtual trees.", type="monthly", goal_value=5.0, current_value=2.0, reward_xp=300, reward_score=8.0, is_completed=False, is_claimed=False)
            ]
            
            for challenge in challenges:
                db.add(challenge)
                
            db.commit()
    finally:
        db.close()
