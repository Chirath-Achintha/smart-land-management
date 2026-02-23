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

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    seller_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # Basic details
    name = Column(String(200), nullable=False)
    district = Column(String(100), nullable=False)
    village = Column(String(100), nullable=False)
    perches = Column(Float, nullable=False)
    price_per_perch = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)
    land_type = Column(Enum(LandType), nullable=False, default=LandType.Residential)
    status = Column(Enum(LandStatus), nullable=False, default=LandStatus.Available)
    road_access = Column(String(200), nullable=True)
    electricity = Column(Boolean, default=False)
    water = Column(Boolean, default=False)

    # Image stored as URL string (comma-separated if multiple)
    image_url = Column(Text, nullable=True)

    # Bidding
    open_for_bidding = Column(Boolean, default=False)
    starting_bid = Column(Float, nullable=True)
    bidding_end = Column(String(20), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    seller           = relationship("User", back_populates="lands")
    bids             = relationship("Bid",  back_populates="land",  cascade="all, delete-orphan")
    availability     = relationship("Availability", back_populates="land", cascade="all, delete-orphan")
    visits           = relationship("Visit", back_populates="land", cascade="all, delete-orphan")
    service_bookings = relationship("ServiceBooking", back_populates="land")
