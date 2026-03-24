from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime
from typing import Optional
import enum

class VisitStatus(str, enum.Enum):
    Pending = "Pending"
    SellerAccepted = "SellerAccepted"
    Assigned = "Assigned"
    Accepted = "Accepted"
    Rejected = "Rejected"
    AgentDeclined = "AgentDeclined"
    Completed = "Completed"
    Cancelled = "Cancelled"

class VisitType(str, enum.Enum):
    SelfVisit  = "self_visit"
    AgentVisit = "agent_visit"

class Visit(Document):
    land_id: PydanticObjectId
    buyer_id: PydanticObjectId
    visit_type: VisitType = Field(default=VisitType.SelfVisit)
    visit_date: str = Field(alias="date")
    visit_time: str = Field(alias="time")
    message: Optional[str] = None
    seller_message: Optional[str] = None
    agent_message: Optional[str] = None
    admin_message: Optional[str] = None
    internal_notes: Optional[str] = None
    visit_feedback: Optional[str] = None
    agent_id: Optional[PydanticObjectId] = None
    status: VisitStatus = Field(default=VisitStatus.Pending)
    cancel_reason: Optional[str] = None
    cancelled_by: Optional[str] = None # New: "buyer" or "seller"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "site_visits"

    class Config:
        populate_by_name = True
