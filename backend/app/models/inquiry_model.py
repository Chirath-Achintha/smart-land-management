from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime
from typing import Optional
import enum

class InquiryStatus(str, enum.Enum):
    open       = "Open"
    in_progress = "In Progress"
    resolved   = "Resolved"

class InquiryType(str, enum.Enum):
    listing  = "Listing"
    service  = "Service"
    general  = "General"
    winner_contact = "WinnerContact"

class Inquiry(Document):
    buyer_id: PydanticObjectId
    receiver_id: Optional[PydanticObjectId] = None  # If null, it's for Admin
    land_id: Optional[PydanticObjectId] = None     # Related land listing
    title: str = Field(max_length=255)
    inquiry_type: InquiryType = Field(default=InquiryType.general, alias="type")
    message: str = Field(alias="description")
    admin_reply: Optional[str] = None
    status: InquiryStatus = Field(default=InquiryStatus.open)
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="created_time")
    updated_at: Optional[datetime] = None

    class Settings:
        name = "inquiries"

    class Config:
        populate_by_name = True