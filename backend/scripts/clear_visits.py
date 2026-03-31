import asyncio
import os
import sys

# Add the backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database.connection import init_db
from app.models.visit_model import Visit

async def clear_visits():
    print("Connecting to database...")
    await init_db()
    
    print("Counting site visits...")
    count = await Visit.count()
    print(f"Found {count} site visits.")
    
    if count > 0:
        print("Emptying visits database...")
        await Visit.delete_all()
        print("Database cleared successfully.")
    else:
        print("Database is already empty.")

if __name__ == "__main__":
    asyncio.run(clear_visits())
