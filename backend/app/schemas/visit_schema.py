from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.visit_model import VisitStatus, VisitType


class VisitCreate(BaseModel):
    land_id:    int
    visit_type: VisitType
    visit_date: str
    visit_time: str
    message:    Optional[str] = None


class VisitUpdateStatus(BaseModel):
    status: VisitStatus


class VisitResponse(BaseModel):
    id:         int
    land_id:    int
    buyer_id:   int
    visit_type: VisitType
    visit_date: str
    visit_time: str
    message:    Optional[str] = None
    status:     VisitStatus
    created_at: datetime
    buyer_name: Optional[str] = None
    land_name:  Optional[str] = None

    class Config:
        from_attributes = True
