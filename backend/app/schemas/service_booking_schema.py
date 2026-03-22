from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
from datetime import datetime


class ServiceBookingCreate(BaseModel):
    land_id:        Optional[str] = None
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


class ServiceBookingAssignRequest(BaseModel):
    constructor_id: str


class ConstructorOptionResponse(BaseModel):
    id: str = Field(alias="_id")
    full_name: str
    team_name: Optional[str] = None
    manager_name: Optional[str] = None
    email: str
    phone: Optional[str] = None
    address: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    district_match: bool = False
    is_available: bool = True
    active_assignments: int = 0

    @field_validator("id", mode="before")
    @classmethod
    def convert_constructor_id(cls, v: Any) -> str:
        return str(v)

    class Config:
        populate_by_name = True
        from_attributes = True


class ServiceBookingResponse(BaseModel):
    id:             str = Field(alias="_id")
    buyer_id:       str
    land_id:        Optional[str]
    constructor_id: Optional[str]
    service_type:   str
    preferred_date: str
    preferred_time: str
    notes:          Optional[str]
    status:         str
    created_at:     datetime
    buyer_name:     Optional[str] = None
    land_name:      Optional[str] = None
    land_district:  Optional[str] = None
    land_location:  Optional[str] = None
    land_price:     Optional[float] = None
    constructor_name: Optional[str] = None
    constructor_phone: Optional[str] = None
    constructor_email: Optional[str] = None

    @field_validator("id", "buyer_id", "land_id", "constructor_id", mode="before")
    @classmethod
    def convert_id(cls, v: Any) -> str:
        if v is None: return None
        return str(v)

    class Config:
        populate_by_name = True
        from_attributes = True
