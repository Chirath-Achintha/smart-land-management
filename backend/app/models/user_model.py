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

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    full_name = Column(String(100), nullable=False)
    nic_number = Column(String(20), unique=True, nullable=False, index=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.buyer)
    address = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    lands        = relationship("Land",         back_populates="seller")
    bids         = relationship("Bid",          back_populates="buyer")
    availability = relationship("Availability", back_populates="seller")
    visits       = relationship("Visit",        back_populates="buyer")
    inquiries    = relationship("Inquiry",      back_populates="buyer")
