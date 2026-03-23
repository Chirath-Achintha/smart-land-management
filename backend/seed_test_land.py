import asyncio
from app.database.connection import init_db
from app.models.land_model import Land
from app.models.bidding_setup_model import BiddingSetup
from beanie import PydanticObjectId

async def seed_test_land():
    await init_db()
    try:
        # Add a test land
        # Note: seller_id needs to be a valid PydanticObjectId, 
        # normally you should get an existing user's ID
        # Since this is a seed script, we'll try to find a seller first
        # For now, let's just use a dummy ID or find the first user
        from app.models.user_model import User
        seller = await User.find_one(User.role == "seller")
        
        if not seller:
            print("[WARN] No seller found. Please register a seller first.")
            return

        # Add a test land for the seller
        new_land = Land(
            seller_id=seller.id,
            name="Golden Sunrise Acres",
            village="Hikkaduwa",
            district="Galle",
            price_per_perch=366666.67,
            perches=15,
            total_price=5500000,
            image_url="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
            location="Near the coastal road",
            description="Beautiful land near the beach, perfect for a villa.",
            id_verified=True
        )
        await new_land.insert()
        
        # Bidding setup
        bidding = BiddingSetup(
            land_id=new_land.id,
            open_for_bidding=True,
            starting_bid=5000000
        )
        await bidding.insert()
        
        print("Test land and bidding setup added successfully for seller: " + seller.email)
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(seed_test_land())

