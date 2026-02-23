from pydantic import BaseModel
from enum import Enum
from typing import Optional, List
from datetime import datetime

class LandStatus(str, Enum):
    Available = "Available"
    Reserved = "Reserved"
    Sold = "Sold"

class LandType(str, Enum):
    Residential = "Residential"
    Agricultural = "Agricultural"
    Mixed = "Mixed"
    Commercial = "Commercial"

# ── Request Schemas ───────────────────────────────────────────────────────────

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
    image_url: Optional[str] = None          # URL string or comma-separated URLs
    open_for_bidding: bool = False
    starting_bid: Optional[float] = None
    bidding_end: Optional[str] = None

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
    open_for_bidding: Optional[bool] = None
    starting_bid: Optional[float] = None
    bidding_end: Optional[str] = None

# ── Response Schema ───────────────────────────────────────────────────────────

class LandResponse(BaseModel):
    id: int
    seller_id: int
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
    open_for_bidding: bool
    starting_bid: Optional[float]
    bidding_end: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True
