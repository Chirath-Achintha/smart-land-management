from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from beanie import PydanticObjectId

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


async def _build_response(b: ServiceBooking) -> ServiceBookingResponse:
    buyer = await User.get(b.buyer_id)
    land  = await Land.get(b.land_id) if b.land_id else None
    return ServiceBookingResponse(
        id=str(b.id),
        buyer_id=str(b.buyer_id),
        land_id=str(b.land_id) if b.land_id else None,
        constructor_id=str(b.constructor_id) if b.constructor_id else None,
        service_type=b.service_type,
        preferred_date=b.preferred_date,
        preferred_time=b.preferred_time,
        notes=b.notes,
        status=b.status,
        created_at=b.created_at,
        buyer_name=buyer.full_name if buyer else None,
        land_name=land.name if land else None,
    )


# ── Buyer: create a booking ───────────────────────────────────────────────────
@router.post("/", response_model=ServiceBookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: ServiceBookingCreate,
    current_user: User = Depends(get_current_user)
):
    # Auto-assign the first available constructor_manager if any
    constructor = await User.find_one(User.role == CONSTRUCTOR_ROLE)

    booking = ServiceBooking(
        buyer_id=current_user.id,
        land_id=PydanticObjectId(data.land_id) if data.land_id else None,
        constructor_id=constructor.id if constructor else None,
        service_type=data.service_type,
        preferred_date=data.preferred_date,
        preferred_time=data.preferred_time,
        notes=data.notes,
        status="Scheduled",
    )
    await booking.insert()
    return await _build_response(booking)


# ── Buyer: get my bookings ─────────────────────────────────────────────────────
@router.get("/my", response_model=List[ServiceBookingResponse])
async def my_bookings(
    current_user: User = Depends(get_current_user)
):
    bookings = await ServiceBooking.find(ServiceBooking.buyer_id == current_user.id).sort("-created_at").to_list()
    return [await _build_response(b) for b in bookings]


# ── Buyer: edit a booking (while Scheduled) ────────────────────────────────────
@router.put("/{booking_id}", response_model=ServiceBookingResponse)
async def update_booking(
    booking_id: PydanticObjectId,
    data: ServiceBookingUpdate,
    current_user: User = Depends(get_current_user)
):
    booking = await ServiceBooking.find_one(
        ServiceBooking.id == booking_id,
        ServiceBooking.buyer_id == current_user.id
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.status != "Scheduled":
        raise HTTPException(status_code=400, detail="Only Scheduled bookings can be edited")

    update_dict = data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(booking, field, value)
    
    await booking.save()
    return await _build_response(booking)


# ── Buyer: delete / cancel a booking ──────────────────────────────────────────
@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_booking(
    booking_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
):
    booking = await ServiceBooking.find_one(
        ServiceBooking.id == booking_id,
        ServiceBooking.buyer_id == current_user.id
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    await booking.delete()


# ── Constructor: get all bookings assigned to me ───────────────────────────────
@router.get("/assigned", response_model=List[ServiceBookingResponse])
async def assigned_bookings(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != CONSTRUCTOR_ROLE:
        raise HTTPException(status_code=403, detail="Not a constructor manager")
    bookings = await ServiceBooking.find(ServiceBooking.constructor_id == current_user.id).sort("-created_at").to_list()
    return [await _build_response(b) for b in bookings]


# ── Constructor: update status ─────────────────────────────────────────────────
@router.put("/{booking_id}/status", response_model=ServiceBookingResponse)
async def update_status(
    booking_id: PydanticObjectId,
    data: ServiceBookingStatusUpdate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != CONSTRUCTOR_ROLE:
        raise HTTPException(status_code=403, detail="Not a constructor manager")
    booking = await ServiceBooking.find_one(
        ServiceBooking.id == booking_id,
        ServiceBooking.constructor_id == current_user.id
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    allowed = ["Scheduled", "In Progress", "Completed", "Cancelled"]
    if data.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")

    booking.status = data.status
    await booking.save()
    return await _build_response(booking)
