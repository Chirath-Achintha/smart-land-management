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
    SelfVisit  = "self_visit"
    AgentVisit = "agent_visit"


class Visit(Base):
    __tablename__ = "site_visits"

    id         = Column('visit_id', Integer, primary_key=True, index=True)
    land_id    = Column(Integer, ForeignKey("lands.listing_id",  ondelete="CASCADE"), nullable=False)
    buyer_id   = Column(Integer, ForeignKey("users.user_id",  ondelete="CASCADE"), nullable=False)
    visit_type = Column(Enum(VisitType), default=VisitType.SelfVisit, nullable=False)
    visit_date = Column('date', String(20),  nullable=False)   # e.g. "2026-03-10"
    visit_time = Column('time', String(50),  nullable=False)   # e.g. "09:00 AM – 12:00 PM"
    message    = Column(Text, nullable=True)
    status     = Column(Enum(VisitStatus), default=VisitStatus.Pending, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    land  = relationship("Land",  back_populates="visits")
    buyer = relationship("User",  back_populates="visits")
