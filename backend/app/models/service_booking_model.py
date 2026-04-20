from beanie import Document, PydanticObjectId
from pydantic import Field, BaseModel
from datetime import datetime
from typing import Optional, List
import enum

class ServiceType(str, enum.Enum):
    Full_Construction = "Full Construction"
    Land_Development  = "Land Development"

class BookingStatus(str, enum.Enum):
    Pending         = "Pending"
    QuoteSubmitted  = "Quote Submitted"
    Accepted        = "Accepted"
    Completed       = "Completed"
    Cancelled       = "Cancelled"

class Milestone(BaseModel):
    id: str = Field(default_factory=lambda: str(datetime.utcnow().timestamp()))
    title: str
    is_completed: bool = False

class ServiceBooking(Document):
    buyer_id: PydanticObjectId
    land_id: Optional[PydanticObjectId] = None
    constructor_id: Optional[PydanticObjectId] = None
    service_type: str # "Full Construction" , "Land Development"
    preferred_date: str = Field(alias="date")
    preferred_time: str = Field(alias="time")
    notes: Optional[str] = Field(None, alias="request")
    status: str = Field(default="Pending")
    
    # Premium Flow Fields
    quote_amount: Optional[float] = None
    quote_notes: Optional[str] = None
    milestones: List[Milestone] = []

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "service_bookings"

    class Config:
        populate_by_name = True
