import asyncio
import bcrypt
from app.database.connection import init_db
from app.models.user_model import User, UserRole

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

async def create_admin():
    print("Connecting to database...")
    await init_db()
    
    admin_email = "admin@smartland.com"
    admin_password = "admin123" # In a real app, this should be generated or passed as env
    
    print(f"Checking if admin '{admin_email}' exists...")
    existing_admin = await User.find_one(User.email == admin_email)
    
    if existing_admin:
        print(f"Admin '{admin_email}' already exists. Updating password...")
        existing_admin.hashed_password = hash_password(admin_password)
        await existing_admin.save()
        print("Admin user updated successfully.")
    else:
        print(f"Creating new admin user '{admin_email}'...")
        admin = User(
            full_name="System Administrator",
            nic_number="000000000V",
            role=UserRole.admin,
            address="System HQ",
            email=admin_email,
            hashed_password=hash_password(admin_password)
        )
        await admin.insert()
        print("Admin user created successfully.")

if __name__ == "__main__":
    asyncio.run(create_admin())
