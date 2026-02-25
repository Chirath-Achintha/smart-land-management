from sqlalchemy import create_engine
from app.core.config import settings

def test_connection():
    try:
        engine = create_engine(settings.DATABASE_URL)
        connection = engine.connect()
        print("Successfully connected to the database!")
        connection.close()
    except Exception as e:
        print(f"Failed to connect: {e}")

if __name__ == "__main__":
    test_connection()
