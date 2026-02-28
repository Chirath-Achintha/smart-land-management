import requests
from sqlalchemy import create_engine
from app.core.config import settings
from app.models.user_model import User
from sqlalchemy.orm import sessionmaker

def check_system():
    # 1. Check API Health
    try:
        r = requests.get("http://localhost:8000/")
        print(f"API Health Check: {r.status_code} - {r.json()}")
    except Exception as e:
        print(f"API Health Check Failed: {e}")

    # 2. Check Database Data
    try:
        engine = create_engine(settings.DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        user_count = session.query(User).count()
        print(f"Database User Count: {user_count}")
        session.close()
    except Exception as e:
        print(f"Database Query Failed: {e}")

if __name__ == "__main__":
    check_system()
