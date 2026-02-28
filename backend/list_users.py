from sqlalchemy import create_engine, text
from app.core.config import settings

def list_users():
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT user_id, name, email, type FROM users"))
            for row in result:
                print(f"User: ID={row[0]}, Name={row[1]}, Email={row[2]}, Role={row[3]}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    list_users()
