import traceback
from sqlalchemy import create_engine
from app.database.connection import Base
from app.core.config import settings

def detailed_check():
    try:
        print(f"Connecting to: {settings.DATABASE_URL}")
        engine = create_engine(settings.DATABASE_URL)
        
        # Test basic connection
        with engine.connect() as conn:
            print("Successfully established raw connection.")
            
        # Check tables
        from sqlalchemy import inspect
        inspector = inspect(engine)
        tables = inspector.get_table_names()
        print(f"Tables in database: {tables}")
        
    except Exception:
        print("Detailed Error Traceback:")
        print(traceback.format_exc())

if __name__ == "__main__":
    detailed_check()
