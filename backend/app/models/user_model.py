from beanie import Document, Indexed
from pydantic import Field, EmailStr
from datetime import datetime
from typing import Optional, List
import enum

class UserRole(str, enum.Enum):
    buyer = "buyer"
    seller = "seller"
    constructor_manager = "constructor_manager"
    admin = "admin"
    agent = "agent"

class User(Document):
    full_name: str = Field(alias="name")
    nic_number: str = Field(alias="nic")
    role: UserRole = Field(default=UserRole.buyer, alias="type")
    phone: Optional[str] = None
    address: str = Field(alias="Address")
    email: EmailStr = Field(unique=True)
    hashed_password: str = Field(alias="password")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None
    reset_otp: Optional[str] = None
    reset_otp_expiry: Optional[datetime] = None

    class Settings:
        name = "users"

    class Config:
        populate_by_name = True
