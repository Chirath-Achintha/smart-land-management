from sqlalchemy import Column, Integer, Float, String, Enum, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.connection import Base
import enum

class BidStatus(str, enum.Enum):
    pending  = "Pending"
    accepted = "Accepted"
    rejected = "Rejected"

class Bid(Base):
    __tablename__ = "bids"

    id         = Column('bid_id', Integer, primary_key=True, index=True, autoincrement=True)
    land_id    = Column(Integer, ForeignKey("lands.listing_id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id   = Column(Integer, ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, index=True)
    amount     = Column(Float, nullable=False)
    message    = Column(Text, nullable=True)
    status     = Column('bid_status', Enum(BidStatus), nullable=False, default=BidStatus.pending)
    created_at = Column('timestamp', DateTime(timezone=True), server_default=func.now())

    # Relationships
    land  = relationship("Land",  back_populates="bids")
    buyer = relationship("User",  back_populates="bids")
