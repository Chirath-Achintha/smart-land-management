from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.service_booking_model import ServiceBooking
from app.models.land_model import Land
from app.models.user_model import User
from app.schemas.service_booking_schema import (
    ServiceBookingCreate, ServiceBookingUpdate,
    ServiceBookingStatusUpdate, ServiceBookingResponse
)
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/service-bookings", tags=["Service Bookings"])

CONSTRUCTOR_ROLE = "constructor_manager"


def _build_response(b: ServiceBooking, db: Session) -> ServiceBookingResponse:
    buyer = db.query(User).filter(User.id == b.buyer_id).first()
    land  = db.query(Land).filter(Land.id == b.land_id).first() if b.land_id else None
    return ServiceBookingResponse(
        **{c.name: getattr(b, c.name) for c in b.__table__.columns},
        buyer_name=buyer.full_name if buyer else None,
        land_name=land.name if land else None,
    )


# ── Buyer: create a booking ───────────────────────────────────────────────────
@router.post("/", response_model=ServiceBookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking(
    data: ServiceBookingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Auto-assign the first available constructor_manager if any
    constructor = db.query(User).filter(User.role == CONSTRUCTOR_ROLE).first()

    booking = ServiceBooking(
        buyer_id=current_user.id,
        land_id=data.land_id,
        constructor_id=constructor.id if constructor else None,
        service_type=data.service_type,
        preferred_date=data.preferred_date,
        preferred_time=data.preferred_time,
        notes=data.notes,
        status="Scheduled",
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return _build_response(booking, db)


# ── Buyer: get my bookings ─────────────────────────────────────────────────────
@router.get("/my", response_model=List[ServiceBookingResponse])
def my_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bookings = (db.query(ServiceBooking)
                  .filter(ServiceBooking.buyer_id == current_user.id)
                  .order_by(ServiceBooking.created_at.desc())
                  .all())
    return [_build_response(b, db) for b in bookings]


# ── Buyer: edit a booking (while Scheduled) ────────────────────────────────────
@router.put("/{booking_id}", response_model=ServiceBookingResponse)
def update_booking(
    booking_id: int,
    data: ServiceBookingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(ServiceBooking).filter(
        ServiceBooking.id == booking_id,
        ServiceBooking.buyer_id == current_user.id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != "Scheduled":
        raise HTTPException(status_code=400, detail="Only Scheduled bookings can be edited")

    for field, value in data.dict(exclude_unset=True).items():
        setattr(booking, field, value)
    db.commit()
    db.refresh(booking)
    return _build_response(booking, db)


# ── Buyer: delete / cancel a booking ──────────────────────────────────────────
@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(
    booking_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    booking = db.query(ServiceBooking).filter(
        ServiceBooking.id == booking_id,
        ServiceBooking.buyer_id == current_user.id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    db.delete(booking)
    db.commit()


# ── Constructor: get all bookings assigned to me ───────────────────────────────
@router.get("/assigned", response_model=List[ServiceBookingResponse])
def assigned_bookings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != CONSTRUCTOR_ROLE:
        raise HTTPException(status_code=403, detail="Not a constructor manager")
    bookings = (db.query(ServiceBooking)
                  .filter(ServiceBooking.constructor_id == current_user.id)
                  .order_by(ServiceBooking.created_at.desc())
                  .all())
    return [_build_response(b, db) for b in bookings]


# ── Constructor: update status ─────────────────────────────────────────────────
@router.put("/{booking_id}/status", response_model=ServiceBookingResponse)
def update_status(
    booking_id: int,
    data: ServiceBookingStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != CONSTRUCTOR_ROLE:
        raise HTTPException(status_code=403, detail="Not a constructor manager")
    booking = db.query(ServiceBooking).filter(
        ServiceBooking.id == booking_id,
        ServiceBooking.constructor_id == current_user.id
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    allowed = ["Scheduled", "In Progress", "Completed", "Cancelled"]
    if data.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")

    booking.status = data.status
    db.commit()
    db.refresh(booking)
    return _build_response(booking, db)
