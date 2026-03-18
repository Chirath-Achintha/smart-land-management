from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from beanie import PydanticObjectId

from app.models.visit_model import Visit, VisitStatus, VisitType

from app.models.land_model import Land
from app.models.user_model import User
from app.schemas.visit_schema import VisitCreate, VisitUpdateStatus, VisitResponse
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/visits", tags=["Visits"])


async def _build_response(visit: Visit) -> VisitResponse:
    buyer = await User.get(visit.buyer_id)
    land  = await Land.get(visit.land_id)
    agent = await User.get(visit.agent_id) if visit.agent_id else None
    
    return VisitResponse(
        id=str(visit.id),
        land_id=str(visit.land_id),
        buyer_id=str(visit.buyer_id),
        visit_type=visit.visit_type,
        visit_date=visit.visit_date,
        visit_time=visit.visit_time,
        message=visit.message,
        seller_message=visit.seller_message,
        status=visit.status,
        created_at=visit.created_at,
        buyer_name=buyer.full_name if buyer else None,
        land_name=land.name if land else None,
        land_address=f"{land.village}, {land.district}" if land else None,
        agent_id=str(visit.agent_id) if visit.agent_id else None,
        agent_name=agent.full_name if agent else None
    )


# ── Buyer: book a site visit ──────────────────────────────────────────────────
@router.post("/", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
async def book_visit(
    data: VisitCreate,
    current_user: User = Depends(get_current_user)
):
    land_id = PydanticObjectId(data.land_id)
    land = await Land.get(land_id)
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")

    # Prevent duplicate pending visit of same type for same buyer/land
    existing = await Visit.find_one(
        Visit.land_id == land_id,
        Visit.buyer_id == current_user.id,
        Visit.status == VisitStatus.Pending,
        Visit.visit_type == data.visit_type
    )
    if existing:
        raise HTTPException(status_code=409, detail=f"You already have a pending {data.visit_type.replace('_', ' ')} request for this land.")

    visit = Visit(
        land_id=land_id,
        buyer_id=current_user.id,
        visit_type=data.visit_type,
        visit_date=data.visit_date,
        visit_time=data.visit_time,
        message=data.message,
        status=VisitStatus.Pending,
    )
        
    await visit.insert()
    return await _build_response(visit)


@router.get("/my-requests", response_model=List[VisitResponse])
async def my_requests(
    current_user: User = Depends(get_current_user)
):
    visits = await Visit.find(Visit.buyer_id == current_user.id).sort("-created_at").to_list()
    return [await _build_response(v) for v in visits]


@router.get("/my-lands", response_model=List[VisitResponse])
async def my_land_visits(
    current_user: User = Depends(get_current_user)
):
    # Get all lands owned by this seller
    my_lands = await Land.find(Land.seller_id == current_user.id).to_list()
    land_ids = [land.id for land in my_lands]
    
    if not land_ids:
        return []
        
    visits = await Visit.find({"land_id": {"$in": land_ids}}).sort("-created_at").to_list()
    return [await _build_response(v) for v in visits]


# ── Admin: get all agent visits ────────────────────────────────────────────────
@router.get("/all-agent-visits", response_model=List[VisitResponse])
async def get_all_agent_visits(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view all agent visits")
    
    visits = await Visit.find(Visit.visit_type == VisitType.AgentVisit).sort("-created_at").to_list()
    return [await _build_response(v) for v in visits]


# ── Seller: accept or reject a visit ─────────────────────────────────────────
@router.put("/{visit_id}/status", response_model=VisitResponse)
async def update_visit_status(
    visit_id: PydanticObjectId,
    data: VisitUpdateStatus,
    current_user: User = Depends(get_current_user)
):
    visit = await Visit.get(visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    # Verify ownership OR admin role
    if current_user.role != "admin":
        land = await Land.find_one(Land.id == visit.land_id, Land.seller_id == current_user.id)
        if not land:
            raise HTTPException(status_code=403, detail="You don't own this land")

    visit.status = data.status
    if data.seller_message:
        visit.seller_message = data.seller_message
    if data.agent_id:
        try:
            visit.agent_id = PydanticObjectId(data.agent_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid Agent ID")
            
    await visit.save()
    return await _build_response(visit)
