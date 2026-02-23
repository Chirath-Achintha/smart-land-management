from pydantic import BaseModel
from typing import List


class AvailabilityCreate(BaseModel):
    land_id:   int
    day:       str
    time_slot: str


class AvailabilityResponse(BaseModel):
    id:        int
    land_id:   int
    seller_id: int
    day:       str
    time_slot: str

    class Config:
        from_attributes = True


class BulkAvailabilityCreate(BaseModel):
    land_id: int
    slots: List[dict]   # [{"day": "Monday", "time_slot": "09:00 AM – 12:00 PM"}, ...]
