import enum
from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.connection import Base


class VisitStatus(str, enum.Enum):
    Pending  = "Pending"
    Accepted = "Accepted"
    Rejected = "Rejected"


class VisitType(str, enum.Enum):
    Self  = "Self"
    Agent = "Agent"


class Visit(Base):
    __tablename__ = "visits"

    id         = Column(Integer, primary_key=True, index=True)
    land_id    = Column(Integer, ForeignKey("lands.id",  ondelete="CASCADE"), nullable=False)
    buyer_id   = Column(Integer, ForeignKey("users.id",  ondelete="CASCADE"), nullable=False)
    visit_type = Column(Enum(VisitType), default=VisitType.Self, nullable=False)
    visit_date = Column(String(20),  nullable=False)   # e.g. "2026-03-10"
    visit_time = Column(String(10),  nullable=False)   # e.g. "10:30"
    message    = Column(Text, nullable=True)
    status     = Column(Enum(VisitStatus), default=VisitStatus.Pending, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    land  = relationship("Land",  back_populates="visits")
    buyer = relationship("User",  back_populates="visits")
