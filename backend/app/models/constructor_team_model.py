from beanie import Document, PydanticObjectId
from pydantic import Field
from datetime import datetime
from typing import Optional


class ConstructorTeam(Document):
    user_id: PydanticObjectId
    team_name: str
    manager_name: str
    district: str
    state: str
    address: str
    phone: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Settings:
        name = "constructor_teams"

    class Config:
        populate_by_name = True
