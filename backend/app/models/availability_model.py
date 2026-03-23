from beanie import Document, PydanticObjectId
from pydantic import Field
from typing import Optional

class Availability(Document):
    land_id: PydanticObjectId
    seller_id: PydanticObjectId
    day: str
    time_slot: str

    class Settings:
        name = "availability"

    class Config:
        populate_by_name = True
