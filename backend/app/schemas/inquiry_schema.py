from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class InquiryCreate(BaseModel):
    title: str
    inquiry_type: str  # "Listing" | "Service" | "General"
    message: str


class InquiryResponse(BaseModel):
    id: int
    buyer_id: int
    title: str
    inquiry_type: str
    message: str
    admin_reply: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class InquiryAdminReply(BaseModel):
    admin_reply: str
    status: Optional[str] = "In Progress"  # "In Progress" | "Resolved"
