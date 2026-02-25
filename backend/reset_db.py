from app.database.connection import engine, Base
# Import all models to ensure they are registered with Base.metadata
from app.models.user_model import User
from app.models.land_model import Land
from app.models.bid_model import Bid
from app.models.availability_model import Availability
from app.models.visit_model import Visit
from app.models.inquiry_model import Inquiry
from app.models.service_booking_model import ServiceBooking

from app.models.bidding_setup_model import BiddingSetup

def reset_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)
    print("Recreating all tables from ER-aligned models...")
    Base.metadata.create_all(bind=engine)
    print("Database reset complete.")

if __name__ == "__main__":
    reset_database()
