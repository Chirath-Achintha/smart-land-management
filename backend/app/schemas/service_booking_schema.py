from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ServiceBookingCreate(BaseModel):
    land_id:        Optional[int] = None
    service_type:   str
    preferred_date: str
    preferred_time: str
    notes:          Optional[str] = None


class ServiceBookingUpdate(BaseModel):
    preferred_date: Optional[str] = None
    preferred_time: Optional[str] = None
    notes:          Optional[str] = None
    service_type:   Optional[str] = None


class ServiceBookingStatusUpdate(BaseModel):
    status: str   # "Scheduled" | "In Progress" | "Completed" | "Cancelled"


class ServiceBookingResponse(BaseModel):
    id:             int
    buyer_id:       int
    land_id:        Optional[int]
    constructor_id: Optional[int]
    service_type:   str
    preferred_date: str
    preferred_time: str
    notes:          Optional[str]
    status:         str
    created_at:     datetime
    buyer_name:     Optional[str] = None
    land_name:      Optional[str] = None

    class Config:
        from_attributes = True
