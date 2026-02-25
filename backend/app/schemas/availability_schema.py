from pydantic import BaseModel
from typing import List


# ── Land-Specific Availability ──────────────────────────────────────────────

class AvailabilityBase(BaseModel):
    day:       str
    time_slot: str

class AvailabilityCreate(AvailabilityBase):
    pass

class AvailabilityResponse(AvailabilityBase):
    id:        int
    land_id:   int
    seller_id: int

    class Config:
        from_attributes = True

class AvailabilityBulkCreate(BaseModel):
    slots: List[AvailabilityBase]
