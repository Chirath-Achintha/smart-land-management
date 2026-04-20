from pydantic import BaseModel, Field, field_validator
from enum import Enum
from typing import Optional, List, Any
from datetime import datetime
from beanie import PydanticObjectId
import re

ROAD_ACCESS_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9\s.,/()-]{1,99}$")
MOBILE_NUMBER_PATTERN = re.compile(r"^\+?\d{10,15}$")

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
    mobile_number_1: str
    mobile_number_2: Optional[str] = None
    electricity: bool = False
    water: bool = False
    distance_to_town_km: float = 0.0
    image_url: Optional[str] = None

    @field_validator("image_url")
    @classmethod
    def validate_image_limit(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        urls = [u.strip() for u in v.split(",") if u.strip()]
        if len(urls) > 5:
            raise ValueError("A maximum of 5 images is allowed")
        return ",".join(urls)

    @field_validator("road_access")
    @classmethod
    def validate_road_access(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        trimmed = v.strip()
        if not trimmed:
            return None
        if not ROAD_ACCESS_PATTERN.fullmatch(trimmed):
            raise ValueError("Road access can only contain letters, numbers, spaces, and . , / ( ) - and must start with a letter or number")
        return trimmed

    @field_validator("distance_to_town_km")
    @classmethod
    def validate_distance_to_town(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Distance to town must be zero or greater")
        return v

    @field_validator("mobile_number_1")
    @classmethod
    def validate_mobile_1(cls, v: str) -> str:
        trimmed = (v or "").strip()
        if not trimmed:
            raise ValueError("Mobile number 1 is required")
        if not MOBILE_NUMBER_PATTERN.fullmatch(trimmed):
            raise ValueError("Mobile number must be 10 to 15 digits and may start with +")
        return trimmed

    @field_validator("mobile_number_2")
    @classmethod
    def validate_mobile_2(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        trimmed = v.strip()
        if not trimmed:
            return None
        if not MOBILE_NUMBER_PATTERN.fullmatch(trimmed):
            raise ValueError("Mobile number must be 10 to 15 digits and may start with +")
        return trimmed

class LandUpdate(BaseModel):
    name: Optional[str] = None
    district: Optional[str] = None
    village: Optional[str] = None
    perches: Optional[float] = None
    price_per_perch: Optional[float] = None
    land_type: Optional[LandType] = None
    status: Optional[LandStatus] = None
    road_access: Optional[str] = None
    mobile_number_1: Optional[str] = None
    mobile_number_2: Optional[str] = None
    electricity: Optional[bool] = None
    water: Optional[bool] = None
    distance_to_town_km: Optional[float] = None
    image_url: Optional[str] = None

    @field_validator("image_url")
    @classmethod
    def validate_image_limit(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return v
        urls = [u.strip() for u in v.split(",") if u.strip()]
        if len(urls) > 5:
            raise ValueError("A maximum of 5 images is allowed")
        return ",".join(urls)

    @field_validator("road_access")
    @classmethod
    def validate_road_access(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        trimmed = v.strip()
        if not trimmed:
            return None
        if not ROAD_ACCESS_PATTERN.fullmatch(trimmed):
            raise ValueError("Road access can only contain letters, numbers, spaces, and . , / ( ) - and must start with a letter or number")
        return trimmed

    @field_validator("distance_to_town_km")
    @classmethod
    def validate_distance_to_town(cls, v: Optional[float]) -> Optional[float]:
        if v is None:
            return v
        if v < 0:
            raise ValueError("Distance to town must be zero or greater")
        return v

    @field_validator("mobile_number_1")
    @classmethod
    def validate_mobile_1(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Mobile number 1 is required")
        if not MOBILE_NUMBER_PATTERN.fullmatch(trimmed):
            raise ValueError("Mobile number must be 10 to 15 digits and may start with +")
        return trimmed

    @field_validator("mobile_number_2")
    @classmethod
    def validate_mobile_2(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        trimmed = v.strip()
        if not trimmed:
            return None
        if not MOBILE_NUMBER_PATTERN.fullmatch(trimmed):
            raise ValueError("Mobile number must be 10 to 15 digits and may start with +")
        return trimmed


class LandVerificationUpdate(BaseModel):
    is_verified: bool
    verification_note: Optional[str] = None


class LandPricePredictionRequest(BaseModel):
    district: str
    village: str
    perches: float
    land_type: LandType = LandType.Residential
    road_access: Optional[str] = None
    electricity: bool = False
    water: bool = False
    distance_to_town_km: float = 0.0
    distance_to_city_km: float = 0.0
    random_feature: float = 0.5
    listed_price_per_perch: Optional[float] = None

    @field_validator("perches")
    @classmethod
    def validate_perches(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Perches must be greater than zero")
        return v

    @field_validator("road_access")
    @classmethod
    def validate_road_access(cls, v: Optional[str]) -> str:
        if not v or not v.strip():
            raise ValueError("Road access is required")
        trimmed = v.strip()
        if not ROAD_ACCESS_PATTERN.fullmatch(trimmed):
            raise ValueError("Road access can only contain letters, numbers, spaces, and . , / ( ) - and must start with a letter or number")
        return trimmed

    @field_validator("distance_to_town_km", "distance_to_city_km")
    @classmethod
    def validate_distances(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Distance values must be zero or greater")
        return v


class LandPricePredictionResponse(BaseModel):
    predicted_total_price: float
    predicted_price_per_perch: float
    input_perches: float
    low_total_estimate: Optional[float] = None
    high_total_estimate: Optional[float] = None
    listed_price_per_perch: Optional[float] = None
    listed_total_price: Optional[float] = None
    per_perch_difference: Optional[float] = None

# ── Response Schema ───────────────────────────────────────────────────────────

class LandResponse(BaseModel):
    id: str = Field(validation_alias="_id")
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
    mobile_number_1: Optional[str] = None
    mobile_number_2: Optional[str] = None
    electricity: bool
    water: bool
    distance_to_town_km: float
    image_url: Optional[str]
    is_verified: bool = False
    review_status: str = "pending"
    is_anomaly: Optional[bool] = None
    anomaly_score: Optional[float] = None
    price_status: Optional[str] = None
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
