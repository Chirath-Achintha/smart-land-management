from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
import dns.resolver

# Force Google's DNS (8.8.8.8) to resolve the MongoDB Atlas SRV link
# This is required if the system DNS (default) fails to resolve the SRV record.
try:
    dns.resolver.default_resolver = dns.resolver.Resolver(configure=False)
    dns.resolver.default_resolver.nameservers = ['8.8.8.8']
except Exception as e:
    print(f"Warning: Could not force Google DNS for DB connection: {e}")


# Export the database client and initialization function
client = AsyncIOMotorClient(settings.DATABASE_URL)
db = client.get_default_database()


async def init_db():
    # To be called on FastAPI startup
    from app.models.user_model import User
    from app.models.land_model import Land
    from app.models.bid_model import Bid
    from app.models.availability_model import Availability
    from app.models.visit_model import Visit
    from app.models.inquiry_model import Inquiry
    from app.models.service_booking_model import ServiceBooking
    from app.models.bidding_setup_model import BiddingSetup

    from app.models.notification_model import Notification
    
    await init_beanie(
        database=db,
        document_models=[
            User,
            Land,
            Bid,
            Availability,
            Visit,
            Inquiry,
            ServiceBooking,
            BiddingSetup,
            Notification
        ]
    )

def get_db():
    # Mocking SQLAlchemy dependency for now to avoid breaking routes
    # In Beanie, models are used directly, but we can return the db object if needed
    yield db
