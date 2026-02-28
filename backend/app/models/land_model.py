from sqlalchemy import Column, Integer, String, Float, Boolean, Enum, DateTime, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.connection import Base
import enum

class LandStatus(str, enum.Enum):
    Available = "Available"
    Reserved = "Reserved"
    Sold = "Sold"

class LandType(str, enum.Enum):
    Residential = "Residential"
    Agricultural = "Agricultural"
    Mixed = "Mixed"
    Commercial = "Commercial"

class Land(Base):
    __tablename__ = "lands"

    id = Column('listing_id', Integer, primary_key=True, index=True, autoincrement=True)
    seller_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, index=True)

    # Basic details
    name = Column(String(200), nullable=False)
    location = Column(String(200), nullable=True)
    district = Column(String(100), nullable=False)
    village = Column(String(100), nullable=False)
    perches = Column('size', Float, nullable=False)
    price_per_perch = Column(Float, nullable=False)
    total_price = Column('price', Float, nullable=False)
    land_type = Column(Enum(LandType), nullable=False, default=LandType.Residential)
    status = Column(Enum(LandStatus), nullable=False, default=LandStatus.Available)
    road_access = Column('road_access', String(200), nullable=True)
    electricity = Column(Boolean, default=False)
    water = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    id_verified = Column(Boolean, default=False)

    # Image stored as URL string (comma-separated if multiple)
    image_url = Column('images', Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Bidding properties (for Pydantic flattening/frontend compatibility)
    @property
    def open_for_bidding(self):
        return self.bidding_setup.open_for_bidding if self.bidding_setup else False

    @property
    def starting_bid(self):
        return self.bidding_setup.starting_bid if self.bidding_setup else None

    @property
    def bidding_end(self):
        return self.bidding_setup.bidding_end if self.bidding_setup else None

    # Relationships
    seller           = relationship("User", back_populates="lands")
    bids             = relationship("Bid",  back_populates="land",  cascade="all, delete-orphan")
    bidding_setup    = relationship("BiddingSetup", back_populates="land", uselist=False, cascade="all, delete-orphan")
    availability     = relationship("Availability", back_populates="land", cascade="all, delete-orphan")
    visits           = relationship("Visit", back_populates="land", cascade="all, delete-orphan")
    service_bookings = relationship("ServiceBooking", back_populates="land")
