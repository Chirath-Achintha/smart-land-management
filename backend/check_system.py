import asyncio
import requests
from app.database.connection import init_db
from app.models.user_model import User

async def check_system():
    # 1. Check API Health
    try:
        r = requests.get("http://localhost:8000/")
        print(f"API Health Check: {r.status_code} - {r.json()}")
    except Exception as e:
        print(f"API Health Check Failed (is the server running?): {e}")

    # 2. Check Database Data
    try:
        await init_db()
        user_count = await User.count()
        print(f"Database User Collection Count: {user_count}")
    except Exception as e:
        print(f"Database Connection/Query Failed: {e}")

if __name__ == "__main__":
    asyncio.run(check_system())

