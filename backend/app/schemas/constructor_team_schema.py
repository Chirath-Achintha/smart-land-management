from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, Any, Literal
from datetime import datetime


class ConstructorTeamCreate(BaseModel):
    team_name: str
    manager_name: str
    district: str
    state: str
    address: str
    specialization: Literal["Full Construction", "Land Development", "Both"] = "Both"
    phone: Optional[str] = None
    email: EmailStr
    password: str


class ConstructorTeamUpdate(BaseModel):
    team_name: Optional[str] = None
    manager_name: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    address: Optional[str] = None
    specialization: Optional[Literal["Full Construction", "Land Development", "Both"]] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

class ConstructorTeamResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    team_name: str
    manager_name: str
    district: str
    state: str
    address: str
    specialization: str
    phone: Optional[str] = None
    email: str
    is_active: bool
    created_at: Optional[datetime] = None

    @field_validator("id", "user_id", mode="before")
    @classmethod
    def convert_id(cls, v: Any) -> str:
        if v is None:
            return None
        return str(v)

    class Config:
        populate_by_name = True
        from_attributes = True
