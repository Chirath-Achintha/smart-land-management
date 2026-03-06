from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime
from typing import Optional
import enum

class NotificationType(str, enum.Enum):
    bid_won = "bid_won"
    bid_outbid = "bid_outbid"
    bid_closed = "bid_closed"
    general = "general"

class Notification(Document):
    user_id: PydanticObjectId
    type: NotificationType = NotificationType.general
    title: str = Field(max_length=255)
    message: str
    link: Optional[str] = None  # Frontend link to relevant page
    is_read: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "notifications"

    class Config:
        populate_by_name = True
