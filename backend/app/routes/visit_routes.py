from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from beanie import PydanticObjectId

from app.models.visit_model import Visit, VisitStatus, VisitType

from app.models.land_model import Land
from app.models.user_model import User
from app.models.notification_model import Notification
from app.schemas.visit_schema import VisitCreate, VisitUpdateStatus, VisitResponse
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/visits", tags=["Visits"])


async def _build_response(visit: Visit) -> VisitResponse:
    buyer = await User.get(visit.buyer_id)
    land  = await Land.get(visit.land_id)
    seller = await User.get(land.seller_id) if land else None
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
        admin_message=visit.admin_message,
        status=visit.status,
        created_at=visit.created_at,
        internal_notes=visit.internal_notes,
        visit_feedback=visit.visit_feedback,
        buyer_name=buyer.full_name if buyer else None,
        buyer_phone=buyer.phone if buyer else None,
        land_name=land.name if land else None,
        land_address=f"{land.village}, {land.district}" if land else None,
        seller_name=seller.full_name if seller else None,
        seller_phone=seller.phone if seller else None,
        agent_id=str(visit.agent_id) if visit.agent_id else None,
        agent_name=agent.full_name if agent else None,
        agent_phone=agent.phone if agent else None,
        agent_nic=agent.nic_number if agent else None
    )


async def _notify_admins(title: str, message: str, link: str):
    admins = await User.find(User.role == "admin").to_list()
    for admin in admins:
        await Notification(
            user_id=admin.id,
            title=title,
            message=message,
            link=link
        ).insert()

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

    # NEW: Prevent double-booking across ALL properties
    conflict = await Visit.find_one(
        Visit.buyer_id == current_user.id,
        Visit.visit_date == data.visit_date,
        Visit.visit_time == data.visit_time,
        {"status": {"$nin": [VisitStatus.Cancelled, VisitStatus.Rejected]}}
    )
    if conflict:
        raise HTTPException(
            status_code=409, 
            detail=f"You already have a visit request for {data.visit_date} at {data.visit_time}. Please pick a different time slot."
        )

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
    
    # Notify Seller
    await Notification(
        user_id=land.seller_id,
        title="Action Required: New Visit Request",
        message=f"A buyer has requested a {data.visit_type.replace('_', ' ').title()} for your property '{land.name}' scheduled for {data.visit_date} at {data.visit_time}. Please review and respond.",
        link="/dashboard/seller/visits"
    ).insert()
    
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


@router.get("/my-assignments", response_model=List[VisitResponse])
async def my_assignments(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "agent":
        return []
    
    visits = await Visit.find(Visit.agent_id == current_user.id).sort("-created_at").to_list()
    return [await _build_response(v) for v in visits]


# ── Seller/Agent/Admin: accept or reject a visit ──────────────────────────────
@router.put("/{visit_id}/status", response_model=VisitResponse)
async def update_visit_status(
    visit_id: PydanticObjectId,
    data: VisitUpdateStatus,
    current_user: User = Depends(get_current_user)
):
    visit = await Visit.get(visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    # Verify ownership OR assigned agent OR admin role
    is_owner = False
    if current_user.role == "seller":
        land = await Land.find_one(Land.id == visit.land_id, Land.seller_id == current_user.id)
        if land: is_owner = True

    is_assigned_agent = (visit.agent_id == current_user.id)
    is_admin = (current_user.role == "admin")

    if not (is_owner or is_assigned_agent or is_admin):
        raise HTTPException(status_code=403, detail="Not authorized to update this visit")

    old_status = visit.status
    visit.status = data.status
    if data.seller_message:
        if current_user.role == "admin":
            visit.admin_message = data.seller_message
        elif current_user.role == "agent":
            # Agents can also leave message
            visit.admin_message = f"(Agent) {data.seller_message}"
        else:
            visit.seller_message = data.seller_message
    if data.agent_id:
        try:
            visit.agent_id = PydanticObjectId(data.agent_id)
        except:
            raise HTTPException(status_code=400, detail="Invalid Agent ID")

    if data.internal_notes:
        visit.internal_notes = data.internal_notes
    if data.visit_feedback:
        visit.visit_feedback = data.visit_feedback
            
    await visit.save()
    
    # Notify Buyer when Seller changes status
    if current_user.role == "seller":
        land = await Land.get(visit.land_id)
        # Only notify if transitioning TO an approved state from Pending
        if old_status == VisitStatus.Pending and data.status in [VisitStatus.SellerAccepted, VisitStatus.Accepted]:
            await Notification(
                user_id=visit.buyer_id,
                title="Visit Request Approved",
                message=f"The owner has officially approved your visit request for '{land.name}' on {visit.visit_date} at {visit.visit_time}.",
                link="/dashboard/visits"
            ).insert()
            
            # If it's an Agent Visit, notify Admin to assign an agent
            if visit.visit_type == VisitType.AgentVisit:
                await _notify_admins(
                    title="Action Required: Agent Assignment",
                    message=f"An Agent Visit for '{land.name}' on {visit.visit_date} has been approved by the seller. Please assign an available agent to this visit.",
                    link="/dashboard/admin/agent-visits"
                )
        elif data.status == VisitStatus.Rejected and old_status != VisitStatus.Rejected:
            await Notification(
                user_id=visit.buyer_id,
                title="Visit Request Declined",
                message=f"Your visit request for '{land.name}' on {visit.visit_date} has been declined by the owner. Please check the dashboard for any messages or suggest a new time.",
                link="/dashboard/visits"
            ).insert()

    # Admin Assigns Agent
    if current_user.role == "admin" and data.status == VisitStatus.Assigned:
        buyer = await User.get(visit.buyer_id)
        agent = await User.get(visit.agent_id)
        land = await Land.get(visit.land_id)
        if agent and buyer and land:
            await Notification(
                user_id=agent.id,
                title="Action Required: New Agent Assignment",
                message=f"You have been officially assigned to facilitate a site visit at '{land.name}' with buyer {buyer.full_name} on {visit.visit_date} at {visit.visit_time}. Please officially accept to confirm.",
                link="/dashboard/agent/assignments"
            ).insert()

    # Admin Reject 
    if current_user.role == "admin" and data.status == VisitStatus.Rejected:
        land = await Land.get(visit.land_id)
        # Notify Buyer
        await Notification(
            user_id=visit.buyer_id,
            title="Update: Visit Request Cancelled by Admin",
            message=f"The administrative team has proactively declined your agent-facilitated visit request for '{land.name}' if one was pending. Reason: {visit.admin_message or 'No specific reason given.'}. Please check your dashboard for details.",
            link="/dashboard/visits"
        ).insert()
        # Notify Seller
        if land:
            await Notification(
                user_id=land.seller_id,
                title="Notice: Professional Assignment Terminated",
                message=f"Admin has declined/cancelled the agent facilitator request for your land '{land.name}' scheduled for {visit.visit_date}. The visit state has been set to Rejected.",
                link="/dashboard/seller/visits"
            ).insert()

    # Agent Confirms Slot
    if current_user.role == "agent" and data.status == VisitStatus.Accepted:
        land = await Land.get(visit.land_id)
        buyer = await User.get(visit.buyer_id)
        await Notification(
            user_id=visit.buyer_id,
            title="Agent Visit Confirmed",
            message=f"Your assigned agent has successfully confirmed their schedule for the '{land.name}' visit on {visit.visit_date} at {visit.visit_time}. Their contact details are now available on your dashboard.",
            link="/dashboard/visits"
        ).insert()
        if land:
            await Notification(
                user_id=land.seller_id,
                title="Agent Assignment Confirmed",
                message=f"An official agent has been assigned and has confirmed their attendance for your '{land.name}' visit on {visit.visit_date} at {visit.visit_time}. Their contact details are now available on your dashboard.",
                link="/dashboard/seller/visits"
            ).insert()
            
            # Notify Admin
            await _notify_admins(
                title="Assignment Finalized: Agent Accepted",
                message=f"Agent {current_user.full_name} has officially accepted the 'facilitator' assignment for '{land.name}' scheduled with buyer {buyer.full_name if buyer else 'Buyer'} on {visit.visit_date}.",
                link="/dashboard/admin/agent-visits"
            )

    # Agent Declines Assignment
    if current_user.role == "agent" and data.status == VisitStatus.AgentDeclined:
        land = await Land.get(visit.land_id)
        buyer = await User.get(visit.buyer_id)
        
        # Notify Admin
        await _notify_admins(
            title="Action Required: Agent Declined Assignment",
            message=f"Agent {current_user.full_name} has declined the assignment for '{land.name}' (Buyer: {buyer.full_name if buyer else 'N/A'}) on {visit.visit_date}. Reason: {data.seller_message or 'No reason provided.'}. Please re-assign or cancel.",
            link="/dashboard/admin/agent-visits"
        )

    return await _build_response(visit)


# ── Buyer: Cancel or Update my own visit ──────────────────────────────────────
@router.put("/{visit_id}/cancel", response_model=VisitResponse)
async def cancel_visit(
    visit_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
):
    visit = await Visit.get(visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit request not found")
    
    if visit.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to cancel this visit")
    
    if visit.status in [VisitStatus.Completed, VisitStatus.Cancelled]:
        raise HTTPException(status_code=400, detail=f"Cannot cancel a visit that is already {visit.status.lower()}")

    visit.status = VisitStatus.Cancelled
    await visit.save()
    
    # Notify Seller
    land = await Land.get(visit.land_id)
    if land:
        await Notification(
            user_id=land.seller_id,
            title="Notice: Visit Cancelled",
            message=f"The buyer has officially cancelled their scheduled visit for '{land.name}' previously set for {visit.visit_date} at {visit.visit_time}.",
            link="/dashboard/seller/visits"
        ).insert()
        
        if visit.visit_type == VisitType.AgentVisit:
            msg_admin = f"The scheduled Agent Visit for '{land.name}' on {visit.visit_date} has been cancelled by the buyer. No further action is required."
            await _notify_admins("Notice: Agent Visit Cancelled", msg_admin, "/dashboard/admin/agent-visits")
            
            if visit.agent_id:
                msg_agent = f"Your scheduled visit for '{land.name}' on {visit.visit_date} at {visit.visit_time} has been proactively cancelled by the buyer. You have been unassigned from this task."
                await Notification(
                    user_id=visit.agent_id,
                    title="Notice: Assignment Cancelled",
                    message=msg_agent,
                    link="/dashboard/agent/assignments"
                ).insert()
    
    return await _build_response(visit)


@router.put("/{visit_id}/update", response_model=VisitResponse)
async def update_visit(
    visit_id: PydanticObjectId,
    data: VisitCreate,
    current_user: User = Depends(get_current_user)
):
    visit = await Visit.get(visit_id)
    if not visit:
        raise HTTPException(status_code=404, detail="Visit request not found")
    
    if visit.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this visit")
    
    # NEW: Prevent double-booking when updating
    conflict = await Visit.find_one(
        Visit.buyer_id == current_user.id,
        Visit.visit_date == data.visit_date,
        Visit.visit_time == data.visit_time,
        Visit.id != visit_id, # Don't check against self
        {"status": {"$nin": [VisitStatus.Cancelled, VisitStatus.Rejected]}}
    )
    if conflict:
        raise HTTPException(
            status_code=409, 
            detail=f"You already have a visit scheduled for {data.visit_date} at {data.visit_time}. Please pick another slot."
        )

    # Logic: Only allow updates if still Pending (Seller hasn't seen it) or SellerAccepted (Admin hasn't assigned agent yet)
    # If it's already 'Assigned' or 'Accepted', the Buyer should cancel and re-book to avoid schedule conflicts.
    if visit.status not in [VisitStatus.Pending, VisitStatus.SellerAccepted]:
        raise HTTPException(
            status_code=400, 
            detail="Cannot update details once an agent is assigned or visit is accepted. Please cancel and re-book if needed."
        )

    visit.visit_date = data.visit_date
    visit.visit_time = data.visit_time
    visit.message = data.message if data.message else visit.message
    
    # Reset status so Seller has to re-approve
    visit.status = VisitStatus.Pending
    
    await visit.save()
    
    # Notify Seller
    land = await Land.get(visit.land_id)
    if land:
        await Notification(
            user_id=land.seller_id,
            title="Action Required: Visit Rescheduled",
            message=f"The buyer has requested a schedule change for '{land.name}'. The new proposed time is {data.visit_date} at {data.visit_time}. Please review and officially re-approve this request.",
            link="/dashboard/seller/visits"
        ).insert()

    return await _build_response(visit)
