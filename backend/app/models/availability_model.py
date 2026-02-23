from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base


class Availability(Base):
    __tablename__ = "availability"

    id         = Column(Integer, primary_key=True, index=True)
    land_id    = Column(Integer, ForeignKey("lands.id", ondelete="CASCADE"), nullable=False)
    seller_id  = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    day        = Column(String(20), nullable=False)   # e.g. "Monday"
    time_slot  = Column(String(50), nullable=False)   # e.g. "09:00 AM – 12:00 PM"

    # Relationships
    land   = relationship("Land",  back_populates="availability")
    seller = relationship("User",  back_populates="availability")
