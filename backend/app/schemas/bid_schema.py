from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# ── Request Schemas ───────────────────────────────────────────────────────────

class BidCreate(BaseModel):
    land_id: int
    amount: float
    message: Optional[str] = None

class BidStatusUpdate(BaseModel):
    status: str   # "Accepted" | "Rejected"

# ── Response Schema ───────────────────────────────────────────────────────────

class BidResponse(BaseModel):
    id: int
    land_id: int
    buyer_id: int
    buyer_name: Optional[str] = None
    buyer_email: Optional[str] = None
    amount: float
    message: Optional[str]
    status: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
