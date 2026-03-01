from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime
from typing import Optional
import enum

class BidStatus(str, enum.Enum):
    pending  = "Pending"
    accepted = "Accepted"
    rejected = "Rejected"

class Bid(Document):
    land_id: PydanticObjectId
    buyer_id: PydanticObjectId
    amount: float
    message: Optional[str] = None
    status: BidStatus = Field(default=BidStatus.pending, alias="bid_status")
    created_at: datetime = Field(default_factory=datetime.utcnow, alias="timestamp")

    class Settings:
        name = "bids"

    class Config:
        populate_by_name = True
