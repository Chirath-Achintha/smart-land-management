from sqlalchemy import Column, Integer, String, Enum, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.connection import Base
import enum

class UserRole(str, enum.Enum):
    buyer = "buyer"
    seller = "seller"
    constructor_manager = "constructor_manager"
    admin = "admin"
    agent = "agent"

class User(Base):
    __tablename__ = "users"

    id = Column('user_id', Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column('name', String(100), nullable=False)
    nic_number = Column('nic', String(20), unique=True, nullable=False, index=True)
    role = Column('type', Enum(UserRole), nullable=False, default=UserRole.buyer)
    phone = Column(String(20), nullable=True)
    address = Column('Address', String(255), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column('password', String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    lands        = relationship("Land",         back_populates="seller")
    bids         = relationship("Bid",          back_populates="buyer")
    availability = relationship("Availability", back_populates="seller")
    visits       = relationship("Visit",        back_populates="buyer")
    inquiries    = relationship("Inquiry",      back_populates="buyer")
    service_bookings_as_buyer       = relationship("ServiceBooking", foreign_keys="ServiceBooking.buyer_id", back_populates="buyer")
    service_bookings_as_constructor = relationship("ServiceBooking", foreign_keys="ServiceBooking.constructor_id", back_populates="constructor")
