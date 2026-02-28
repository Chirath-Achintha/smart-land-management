import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.connection import Base


class ServiceType(str, enum.Enum):
    Full_Construction = "Full Construction"
    Land_Development  = "Land Development"


class BookingStatus(str, enum.Enum):
    Scheduled   = "Scheduled"
    In_Progress = "In Progress"
    Completed   = "Completed"
    Cancelled   = "Cancelled"


class ServiceBooking(Base):
    __tablename__ = "service_bookings"

    id                   = Column('booking_id', Integer, primary_key=True, index=True)
    buyer_id             = Column(Integer, ForeignKey("users.user_id",  ondelete="CASCADE"), nullable=False)
    land_id              = Column(Integer, ForeignKey("lands.listing_id",  ondelete="SET NULL"), nullable=True)
    constructor_id       = Column(Integer, ForeignKey("users.user_id",  ondelete="SET NULL"), nullable=True)
    service_type         = Column(String(50), nullable=False)   # "Full Construction" | "Land Development"
    preferred_date       = Column('date', String(20), nullable=False)
    preferred_time       = Column('time', String(10), nullable=False)
    notes                = Column('request', Text, nullable=True)
    status               = Column(String(20), default="Scheduled", nullable=False)
    created_at           = Column(DateTime(timezone=True), server_default=func.now())
    updated_at           = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    buyer       = relationship("User",  foreign_keys=[buyer_id],       back_populates="service_bookings_as_buyer")
    constructor = relationship("User",  foreign_keys=[constructor_id], back_populates="service_bookings_as_constructor")
    land        = relationship("Land",  back_populates="service_bookings")
