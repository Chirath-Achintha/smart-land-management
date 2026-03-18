import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.visit_model import Visit
from app.models.user_model import User
from app.models.land_model import Land

async def run():
    try:
        client = AsyncIOMotorClient('mongodb+srv://uvindu:wlCkhUU4WuNNs6GL@cluster0.yckakom.mongodb.net/smart_land_db?retryWrites=true&w=majority')
        db = client.get_default_database()
        await init_beanie(database=db, document_models=[Visit, User, Land])
        visits = await Visit.find_all().to_list()
        print(f"Total visits: {len(visits)}")
        for v in visits:
            print(f"ID: {v.id} | Type: {v.visit_type} | Status: {v.status}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(run())
