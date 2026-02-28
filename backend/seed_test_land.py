from sqlalchemy import create_engine
from app.core.config import settings
from app.models.user_model import User
from app.models.land_model import Land
from app.models.bid_model import Bid
from app.models.availability_model import Availability
from app.models.visit_model import Visit
from app.models.inquiry_model import Inquiry
from app.models.service_booking_model import ServiceBooking
from app.models.bidding_setup_model import BiddingSetup
from sqlalchemy.orm import sessionmaker

def seed_test_land():
    try:
        engine = create_engine(settings.DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Add a test land for user_id=1 (Manit)
        new_land = Land(
            seller_id=1,
            name="Golden Sunrise Acres",
            village="Hikkaduwa",
            district="Galle",
            total_price=5500000,
            perches=15,
            image_url="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80",
            location="Near the coastal road",
            description="Beautiful land near the beach, perfect for a villa.",
            id_verified=True
        )
        session.add(new_land)
        session.flush() # Get the land ID
        
        # Bidding setup
        bidding = BiddingSetup(
            land_id=new_land.id,
            open_for_bidding=True,
            starting_bid=5000000
        )
        session.add(bidding)
        
        session.commit()
        print("Test land and bidding setup added successfully!")
        session.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    seed_test_land()
