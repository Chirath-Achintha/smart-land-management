from beanie import Document, PydanticObjectId
from pydantic import Field
from typing import Optional

class BiddingSetup(Document):
    land_id: PydanticObjectId = Field(unique=True)
    open_for_bidding: bool = False
    starting_bid: Optional[float] = None
    bidding_start: Optional[str] = None
    bidding_end: Optional[str] = None

    class Settings:
        name = "bidding_setup"

    class Config:
        populate_by_name = True
