from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from beanie import PydanticObjectId

from app.models.availability_model import Availability

from app.models.land_model import Land
from app.models.user_model import User
from app.schemas.availability_schema import AvailabilityResponse, AvailabilityCreate
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/availability", tags=["Availability"])

# ── 1. Land-Specific Availability ──────────────────────────────────────────────

@router.get("/land/{land_id}", response_model=List[AvailabilityResponse])
async def get_land_availability(land_id: PydanticObjectId):
    slots = await Availability.find(Availability.land_id == land_id).to_list()
    # Explicitly convert to dict with _id if needed, but response_model usually handles it
    return slots

@router.post("/land/{land_id}", response_model=List[AvailabilityResponse])
async def save_land_availability(
    land_id: PydanticObjectId,
    slots: List[AvailabilityCreate],
    current_user: User = Depends(get_current_user)
):
    land = await Land.get(land_id)
    if not land or land.seller_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Land not found or not yours")

    # Delete existing slots for this land
    await Availability.find(Availability.land_id == land_id).delete()

    new_slots = []
    for slot_data in slots:
        a = Availability(
            land_id=land_id, 
            seller_id=current_user.id, 
            day=slot_data.day, 
            time_slot=slot_data.time_slot
        )
        await a.insert()
        new_slots.append(a)

    return new_slots

# ── 2. Delete Individual Slot ──────────────────────────────────────────────────

@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_land_slot(
    slot_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
):
    slot = await Availability.find_one(Availability.id == slot_id, Availability.seller_id == current_user.id)
    if not slot: 
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")
    await slot.delete()
