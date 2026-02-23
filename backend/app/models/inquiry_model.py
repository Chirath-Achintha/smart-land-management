from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database.connection import Base
import enum


class InquiryStatus(str, enum.Enum):
    open       = "Open"
    in_progress = "In Progress"
    resolved   = "Resolved"


class InquiryType(str, enum.Enum):
    listing  = "Listing"
    service  = "Service"
    general  = "General"


class Inquiry(Base):
    __tablename__ = "inquiries"

    id          = Column(Integer, primary_key=True, index=True, autoincrement=True)
    buyer_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title       = Column(String(255), nullable=False)
    inquiry_type = Column(Enum(InquiryType), nullable=False, default=InquiryType.general)
    message     = Column(Text, nullable=False)
    admin_reply = Column(Text, nullable=True)
    status      = Column(Enum(InquiryStatus), nullable=False, default=InquiryStatus.open)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationship
    buyer = relationship("User", back_populates="inquiries")
