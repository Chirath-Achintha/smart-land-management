from pydantic import BaseModel, Field, field_validator
from typing import List, Any


# ── Land-Specific Availability ──────────────────────────────────────────────

class AvailabilityBase(BaseModel):
    day:       str
    time_slot: str

class AvailabilityCreate(AvailabilityBase):
    pass

class AvailabilityResponse(AvailabilityBase):
    id:        str = Field(alias="_id")
    land_id:   str
    seller_id: str

    @field_validator("id", "land_id", "seller_id", mode="before")
    @classmethod
    def convert_id(cls, v: Any) -> str:
        return str(v)

    class Config:
        populate_by_name = True
        from_attributes = True

class AvailabilityBulkCreate(BaseModel):
    slots: List[AvailabilityBase]
