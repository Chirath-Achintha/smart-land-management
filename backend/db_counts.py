from sqlalchemy import create_engine, text
from app.core.config import settings

def check_counts():
    try:
        engine = create_engine(settings.DATABASE_URL)
        inspector = __import__('sqlalchemy').inspect(engine)
        tables = inspector.get_table_names()
        
        with engine.connect() as conn:
            for table in tables:
                count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                print(f"Table '{table}': {count} rows")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_counts()
