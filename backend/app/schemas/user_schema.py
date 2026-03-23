from pydantic import BaseModel, EmailStr, Field, field_validator
from enum import Enum
from typing import Optional, Any
from datetime import datetime

class UserRole(str, Enum):
    buyer = "buyer"
    seller = "seller"
    constructor_manager = "constructor_manager"
    admin = "admin"
    agent = "agent"

# ---- Request Schemas ----

class UserRegister(BaseModel):
    full_name: str
    nic_number: str
    phone: str
    role: UserRole
    address: str
    email: EmailStr
    password: str
    confirm_password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str
    confirm_password: str


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    nic_number: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None

# ---- Response Schemas ----

class UserResponse(BaseModel):
    id: str = Field(validation_alias="_id")
    full_name: str
    nic_number: str
    role: UserRole
    address: str
    email: str
    phone: Optional[str] = None
    is_active: bool = True
    created_at: Optional[datetime]

    @field_validator("id", mode="before")
    @classmethod
    def convert_id(cls, v: Any) -> str:
        return str(v)

    class Config:
        populate_by_name = True
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
