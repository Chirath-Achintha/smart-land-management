from beanie import Document, Link, PydanticObjectId
from pydantic import Field
from datetime import datetime
from typing import Optional, List
import enum

class LandStatus(str, enum.Enum):
    Available = "Available"
    Reserved = "Reserved"
    Sold = "Sold"

class LandType(str, enum.Enum):
    Residential = "Residential"
    Agricultural = "Agricultural"
    Mixed = "Mixed"
    Commercial = "Commercial"

class Land(Document):
    seller_id: PydanticObjectId
    name: str = Field(max_length=200)
    location: Optional[str] = None
    district: str
    village: str
    perches: float = Field(alias="size")
    price_per_perch: float
    total_price: float = Field(alias="price")
    land_type: LandType = Field(default=LandType.Residential)
    status: LandStatus = Field(default=LandStatus.Available)
    road_access: Optional[str] = None
    mobile_number_1: Optional[str] = None
    mobile_number_2: Optional[str] = None
    electricity: bool = False
    water: bool = False
    description: Optional[str] = None
    id_verified: bool = False
    is_verified: bool = False
    review_status: str = "pending"  # pending | approved | rejected
    verified_by: Optional[PydanticObjectId] = None
    verified_at: Optional[datetime] = None
    verification_note: Optional[str] = None
    distance_to_town_km: float = 0.0
    image_url: Optional[str] = Field(None, alias="images")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    # Anomaly detection results
    is_anomaly: Optional[bool] = None
    anomaly_score: Optional[float] = None
    price_status: Optional[str] = None # high | low | normal

    # Transient fields for response flattening (populated in routes)
    open_for_bidding: Optional[bool] = None
    starting_bid: Optional[float] = None
    bidding_start: Optional[str] = None
    bidding_end: Optional[str] = None
    bidding_setup: Optional[dict] = None

    class Settings:
        name = "lands"

    class Config:
        populate_by_name = True
