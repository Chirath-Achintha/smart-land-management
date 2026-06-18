from pydantic import BaseModel, Field, field_validator
from typing import Optional, Any
from datetime import datetime

# ── Request Schemas ───────────────────────────────────────────────────────────

class BidCreate(BaseModel):
    land_id: str
    amount: float
    message: Optional[str] = None

class BidUpdate(BaseModel):
    amount: Optional[float] = None
    message: Optional[str] = None

# ── Response Schema ───────────────────────────────────────────────────────────

class BidResponse(BaseModel):
    id: str = Field(alias="_id")
    land_id: str
    land_name: Optional[str] = None
    buyer_id: str
    buyer_name: Optional[str] = None
    buyer_email: Optional[str] = None
    amount: float
    message: Optional[str]
    status: str
    is_winner: bool = False
    created_at: Optional[datetime]

    @field_validator("id", "land_id", "buyer_id", mode="before")
    @classmethod
    def convert_id(cls, v: Any) -> str:
        return str(v)

    class Config:
        populate_by_name = True
        from_attributes = True
