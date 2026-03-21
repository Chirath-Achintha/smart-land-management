from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List
from beanie import PydanticObjectId
from datetime import datetime

from app.models.service_booking_model import ServiceBooking

from app.models.land_model import Land
from app.models.user_model import User
from app.models.constructor_team_model import ConstructorTeam
from app.schemas.service_booking_schema import (
    ServiceBookingCreate, ServiceBookingUpdate,
    ServiceBookingStatusUpdate, ServiceBookingResponse,
    ServiceBookingAssignRequest, ConstructorOptionResponse
)
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/service-bookings", tags=["Service Bookings"])

CONSTRUCTOR_ROLE = "constructor_manager"


async def _build_response(b: ServiceBooking) -> ServiceBookingResponse:
    buyer = await User.get(b.buyer_id)
    land  = await Land.get(b.land_id) if b.land_id else None
    constructor = await User.get(b.constructor_id) if b.constructor_id else None
    team = await ConstructorTeam.find_one(ConstructorTeam.user_id == b.constructor_id) if b.constructor_id else None
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
        land_district=land.district if land else None,
        land_location=land.location if land else None,
        land_price=land.total_price if land else None,
        constructor_name=team.team_name if team else (constructor.full_name if constructor else None),
        constructor_phone=team.phone if team else (constructor.phone if constructor else None),
        constructor_email=constructor.email if constructor else None,
    )


def _is_admin(user: User) -> bool:
    return user.role == "admin"


def _is_constructor_manager(user: User) -> bool:
    return user.role == CONSTRUCTOR_ROLE


# ── Buyer: create a booking ───────────────────────────────────────────────────
@router.post("/", response_model=ServiceBookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: ServiceBookingCreate,
    current_user: User = Depends(get_current_user)
):
    booking = ServiceBooking(
        buyer_id=current_user.id,
        land_id=PydanticObjectId(data.land_id) if data.land_id else None,
        constructor_id=None,
        service_type=data.service_type,
        preferred_date=data.preferred_date,
        preferred_time=data.preferred_time,
        notes=data.notes,
        status="Requested",
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
    if booking.status not in ["Requested", "Scheduled"]:
        raise HTTPException(status_code=400, detail="Only Requested bookings can be edited")

    update_dict = data.dict(exclude_unset=True)
    for field, value in update_dict.items():
        setattr(booking, field, value)
    
    await booking.save()
    return await _build_response(booking)


# ── Admin: get all bookings ────────────────────────────────────────────────────
@router.get("/admin", response_model=List[ServiceBookingResponse])
async def admin_bookings(
    current_user: User = Depends(get_current_user)
):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not an admin")
    bookings = await ServiceBooking.find_all().sort("-created_at").to_list()
    return [await _build_response(b) for b in bookings]


# ── Admin: list constructor teams with availability ────────────────────────────
@router.get("/constructors", response_model=List[ConstructorOptionResponse])
async def list_constructors(
    district: str = Query(default=""),
    current_user: User = Depends(get_current_user)
):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not an admin")

    constructors = await User.find(User.role == CONSTRUCTOR_ROLE).to_list()
    teams = await ConstructorTeam.find_all().to_list()
    team_by_user = {str(t.user_id): t for t in teams}
    requested_district = district.strip().lower()
    constructor_ids = [u.id for u in constructors]

    active_bookings = await ServiceBooking.find(
        ServiceBooking.constructor_id.in_(constructor_ids),
        ServiceBooking.status.in_(["Approved", "Scheduled", "In Progress"]) 
    ).to_list() if constructor_ids else []

    active_count_by_constructor = {}
    for booking in active_bookings:
        key = str(booking.constructor_id)
        active_count_by_constructor[key] = active_count_by_constructor.get(key, 0) + 1

    result = []
    for c in constructors:
        team = team_by_user.get(str(c.id))
        district_source = (team.district if team else "") or ""
        state_source = (team.state if team else "") or ""
        address_source = (team.address if team else c.address) or ""
        normalized_region = f"{district_source} {state_source} {address_source}".lower()
        active_count = active_count_by_constructor.get(str(c.id), 0)
        district_match = requested_district in normalized_region if requested_district else True
        result.append(ConstructorOptionResponse(
            id=str(c.id),
            full_name=c.full_name,
            team_name=team.team_name if team else c.full_name,
            manager_name=team.manager_name if team else None,
            email=c.email,
            phone=team.phone if team else c.phone,
            address=address_source,
            district=team.district if team else None,
            state=team.state if team else None,
            district_match=district_match,
            is_available=active_count == 0,
            active_assignments=active_count,
        ))

    result.sort(key=lambda x: (not x.district_match, not x.is_available, x.full_name.lower()))
    return result


# ── Admin: assign a constructor team ───────────────────────────────────────────
@router.patch("/{booking_id}/assign", response_model=ServiceBookingResponse)
async def assign_constructor(
    booking_id: PydanticObjectId,
    data: ServiceBookingAssignRequest,
    current_user: User = Depends(get_current_user)
):
    if not _is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not an admin")

    booking = await ServiceBooking.get(booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    try:
        constructor_obj_id = PydanticObjectId(data.constructor_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid constructor id")

    constructor = await User.get(constructor_obj_id)
    if not constructor or constructor.role != CONSTRUCTOR_ROLE:
        raise HTTPException(status_code=404, detail="Constructor team not found")

    booking.constructor_id = constructor.id
    booking.status = "Approved"
    booking.updated_at = datetime.utcnow()
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
    if not _is_constructor_manager(current_user):
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
    if not _is_constructor_manager(current_user):
        raise HTTPException(status_code=403, detail="Not a constructor manager")
    booking = await ServiceBooking.find_one(
        ServiceBooking.id == booking_id,
        ServiceBooking.constructor_id == current_user.id
    )
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    allowed = ["Approved", "Scheduled", "In Progress", "Completed", "Cancelled"]
    if data.status not in allowed:
        raise HTTPException(status_code=400, detail=f"Status must be one of {allowed}")

    booking.status = data.status
    booking.updated_at = datetime.utcnow()
    await booking.save()
    return await _build_response(booking)
