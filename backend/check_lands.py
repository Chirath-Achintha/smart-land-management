import asyncio
import os
import sys

# Add the current directory to sys.path to find 'app'
sys.path.append(os.getcwd())

from app.database.connection import init_db, db

async def check_lands():
    await init_db()
    try:
        lands = await db['lands'].find({}).to_list(length=100)
        with open("land_check_results.txt", "w") as f:
            f.write(f"Total lands in database: {len(lands)}\n")
            for land in lands:
                f.write(f"Name: {land.get('name')}, Status: {land.get('status')}, Verified: {land.get('is_verified')}, Village: {land.get('village')}, District: {land.get('district')}\n")
        print("Results written to land_check_results.txt")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_lands())
