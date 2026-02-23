from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.availability_model import Availability
from app.models.land_model import Land
from app.models.user_model import User
from app.schemas.availability_schema import AvailabilityResponse
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/availability", tags=["Availability"])


# ── Get availability slots for a specific land (public, for buyers) ───────────
@router.get("/land/{land_id}", response_model=List[AvailabilityResponse])
def get_land_availability(land_id: int, db: Session = Depends(get_db)):
    return db.query(Availability).filter(Availability.land_id == land_id).all()


# ── Save (replace) all availability slots for a land (seller only) ────────────
@router.post("/land/{land_id}", response_model=List[AvailabilityResponse])
def save_land_availability(
    land_id: int,
    slots: List[dict],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify the seller owns this land
    land = db.query(Land).filter(Land.id == land_id, Land.seller_id == current_user.id).first()
    if not land:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Land not found or not yours")

    # Delete old slots for this land
    db.query(Availability).filter(Availability.land_id == land_id).delete()

    # Insert new slots
    new_slots = []
    for slot in slots:
        day = slot.get("day", "").strip()
        time_slot = slot.get("time_slot", "").strip()
        if day and time_slot:
            a = Availability(
                land_id=land_id,
                seller_id=current_user.id,
                day=day,
                time_slot=time_slot,
            )
            db.add(a)
            new_slots.append(a)

    db.commit()
    for a in new_slots:
        db.refresh(a)

    return new_slots


# ── Delete a single slot (seller only) ───────────────────────────────────────
@router.delete("/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    slot = db.query(Availability).filter(
        Availability.id == slot_id,
        Availability.seller_id == current_user.id
    ).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found")
    db.delete(slot)
    db.commit()
