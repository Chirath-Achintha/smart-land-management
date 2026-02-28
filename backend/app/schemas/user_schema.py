from pydantic import BaseModel, EmailStr
from enum import Enum
from typing import Optional
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
    role: UserRole
    address: str
    email: EmailStr
    password: str
    confirm_password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# ---- Response Schemas ----

class UserResponse(BaseModel):
    id: int
    full_name: str
    nic_number: str
    role: UserRole
    address: str
    email: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse
