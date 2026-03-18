from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
from datetime import datetime
from app.models.visit_model import VisitStatus, VisitType


class VisitCreate(BaseModel):
    land_id:    str
    visit_type: VisitType
    visit_date: str
    visit_time: str
    message:    Optional[str] = None


class VisitUpdateStatus(BaseModel):
    status: VisitStatus
    seller_message: Optional[str] = None
    agent_id: Optional[str] = None


class VisitResponse(BaseModel):
    id:         str = Field(alias="_id")
    land_id:    str
    buyer_id:   str
    visit_type: VisitType
    visit_date: str
    visit_time: str
    message:    Optional[str] = None
    seller_message: Optional[str] = None
    status:     VisitStatus
    created_at: datetime
    buyer_name: Optional[str] = None
    land_name:  Optional[str] = None
    land_address: Optional[str] = None
    agent_id:   Optional[str] = None
    agent_name: Optional[str] = None

    @field_validator("id", "land_id", "buyer_id", "agent_id", mode="before")
    @classmethod
    def convert_id(cls, v: Any) -> str:
        if v is None: return None
        return str(v)

    class Config:
        populate_by_name = True
        from_attributes = True
