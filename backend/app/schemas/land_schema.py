from pydantic import BaseModel, Field, field_validator
from enum import Enum
from typing import Optional, List, Any
from datetime import datetime
from beanie import PydanticObjectId

class LandStatus(str, Enum):
    Available = "Available"
    Reserved = "Reserved"
    Sold = "Sold"

class LandType(str, Enum):
    Residential = "Residential"
    Agricultural = "Agricultural"
    Mixed = "Mixed"
    Commercial = "Commercial"

# ── Bidding Setup Schemas ──────────────────────────────────────────────────

class BiddingSetupBase(BaseModel):
    open_for_bidding: bool = False
    starting_bid: Optional[float] = None
    bidding_start: Optional[str] = None
    bidding_end: Optional[str] = None

class BiddingSetupCreate(BiddingSetupBase):
    pass

class BiddingSetupResponse(BiddingSetupBase):
    id: str = Field(alias="_id")
    land_id: str

    @field_validator("id", "land_id", mode="before")
    @classmethod
    def convert_id(cls, v: Any) -> str:
        return str(v)

    class Config:
        populate_by_name = True
        from_attributes = True

# ── Land Request Schemas ───────────────────────────────────────────────────────────

class LandCreate(BaseModel):
    name: str
    district: str
    village: str
    perches: float
    price_per_perch: float
    land_type: LandType = LandType.Residential
    status: LandStatus = LandStatus.Available
    road_access: Optional[str] = None
    electricity: bool = False
    water: bool = False
    image_url: Optional[str] = None

class LandUpdate(BaseModel):
    name: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    perches: Optional[float] = None
    price_per_perch: Optional[float] = None
    land_type: Optional[LandType] = None
    status: Optional[LandStatus] = None
    road_access: Optional[str] = None
    electricity: Optional[bool] = None
    water: Optional[bool] = None
    image_url: Optional[str] = None


class LandVerificationUpdate(BaseModel):
    is_verified: bool
    verification_note: Optional[str] = None

# ── Response Schema ───────────────────────────────────────────────────────────

class LandResponse(BaseModel):
    id: str = Field(alias="_id")
    seller_id: str
    name: str
    district: str
    village: str
    perches: float
    price_per_perch: float
    total_price: float
    land_type: str
    status: str
    road_access: Optional[str]
    electricity: bool
    water: bool
    image_url: Optional[str]
    is_verified: bool = False
    review_status: str = "pending"
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    verification_note: Optional[str] = None
    created_at: Optional[datetime]
    
    # Bidding fields (flattened for compatibility)
    open_for_bidding: Optional[bool] = False
    starting_bid: Optional[float] = None
    bidding_start: Optional[str] = None
    bidding_end: Optional[str] = None

    # Nested bidding setup (optional)
    bidding_setup: Optional[BiddingSetupBase] = None

    @field_validator("id", "seller_id", "verified_by", mode="before")
    @classmethod
    def convert_id(cls, v: Any) -> str:
        if v is None:
            return None
        return str(v)

    class Config:
        populate_by_name = True
        from_attributes = True
