from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
from datetime import datetime


class InquiryCreate(BaseModel):
    title: str
    inquiry_type: str  # "Listing" | "Service" | "General"
    message: str


class InquiryResponse(BaseModel):
    id:         str = Field(alias="_id")
    buyer_id:   str
    title: str
    inquiry_type: str
    message: str
    admin_reply: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    @field_validator("id", "buyer_id", mode="before")
    @classmethod
    def convert_id(cls, v: Any) -> str:
        return str(v)

    class Config:
        populate_by_name = True
        from_attributes = True


class InquiryAdminReply(BaseModel):
    admin_reply: Optional[str] = None
    status: Optional[str] = "In Progress"
