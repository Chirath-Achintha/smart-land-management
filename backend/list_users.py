import asyncio
from app.database.connection import init_db
from app.models.user_model import User

async def list_users():
    await init_db()
    try:
        users = await User.find_all().to_list()
        if not users:
            print("No users found.")
            return
            
        for user in users:
            print(f"User: ID={str(user.id)}, Name={user.full_name}, Email={user.email}, Role={user.role}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(list_users())

