from sqlalchemy import Column, Integer, Boolean, Float, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

class BiddingSetup(Base):
    __tablename__ = "bidding_setup"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    land_id = Column(Integer, ForeignKey("lands.listing_id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    
    open_for_bidding = Column(Boolean, default=False)
    starting_bid = Column(Float, nullable=True)
    bidding_start = Column(String(40), nullable=True)   # ISO datetime for scheduled start
    bidding_end = Column(String(40), nullable=True)     # ISO datetime for auto-end

    # Relationship
    land = relationship("Land", back_populates="bidding_setup")
