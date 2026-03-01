import asyncio
from app.database.connection import init_db, db

async def check_counts():
    await init_db()
    try:
        collections = await db.list_collection_names()
        for collection_name in collections:
            count = await db[collection_name].count_documents({})
            print(f"Collection '{collection_name}': {count} documents")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_counts())

