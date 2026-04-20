from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from beanie import PydanticObjectId

from app.models.inquiry_model import Inquiry, InquiryStatus, InquiryType
from app.models.land_model import Land

from app.models.user_model import User
from app.schemas.inquiry_schema import InquiryCreate, InquiryResponse, InquiryAdminReply
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/inquiries", tags=["Inquiries"])


def _to_response(inq: Inquiry) -> dict:
    return {
        "id": str(inq.id),
        "buyer_id": str(inq.buyer_id),
        "receiver_id": str(inq.receiver_id) if inq.receiver_id else None,
        "land_id": str(inq.land_id) if inq.land_id else None,
        "title": inq.title,
        "inquiry_type": inq.inquiry_type.value if hasattr(inq.inquiry_type, "value") else str(inq.inquiry_type),
        "message": inq.message,
        "admin_reply": inq.admin_reply,
        "status": inq.status.value if hasattr(inq.status, "value") else str(inq.status),
        "created_at": inq.created_at,
        "updated_at": inq.updated_at,
    }


async def _to_response_full(inq: Inquiry) -> dict:
    buyer = await User.get(inq.buyer_id)
    land = await Land.get(inq.land_id) if inq.land_id else None
    return {
        "id": str(inq.id),
        "buyer_id": str(inq.buyer_id),
        "buyer_name": buyer.full_name if buyer else "Unknown User",
        "buyer_email": buyer.email if buyer else "",
        "buyer_role": buyer.role if buyer else "unknown",
        "receiver_id": str(inq.receiver_id) if inq.receiver_id else None,
        "land_id": str(inq.land_id) if inq.land_id else None,
        "land_name": land.name if land else None,
        "land_district": land.district if land else None,
        "land_village": land.village if land else None,
        "title": inq.title,
        "inquiry_type": inq.inquiry_type.value if hasattr(inq.inquiry_type, 'value') else str(inq.inquiry_type),
        "message": inq.message,
        "admin_reply": inq.admin_reply,
        "status": inq.status.value if hasattr(inq.status, 'value') else str(inq.status),
        "created_at": inq.created_at,
        "updated_at": inq.updated_at,
    }

# ── Buyer : Submit a new inquiry ───────────────────────────────────────────────
@router.post("/", response_model=InquiryResponse, status_code=status.HTTP_201_CREATED)
async def submit_inquiry(
    data: InquiryCreate,
    current_user: User = Depends(get_current_user)
):
    # Validate inquiry_type
    try:
        inq_type = InquiryType(data.inquiry_type)
    except ValueError:
        inq_type = InquiryType.general

    selected_land_id = None
    selected_receiver_id = None
    if inq_type == InquiryType.listing:
        if not data.land_id:
            raise HTTPException(status_code=400, detail="Please select a land for listing inquiries")

        try:
            selected_land_id = PydanticObjectId(data.land_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid land ID")

        land = await Land.get(selected_land_id)
        if not land:
            raise HTTPException(status_code=404, detail="Selected land not found")

        selected_receiver_id = land.seller_id

    inquiry = Inquiry(
        buyer_id=current_user.id,
        receiver_id=selected_receiver_id,
        land_id=selected_land_id,
        title=data.title,
        inquiry_type=inq_type,
        message=data.message,
    )
    await inquiry.insert()
    return _to_response(inquiry)


# ── Buyer: Get only MY inquiries (with admin replies) ─────────────────────────
@router.get("/my", response_model=List[InquiryResponse])
async def get_my_inquiries(
    current_user: User = Depends(get_current_user)
):
    # Filter out WinnerContact inquiries for the main inquiry page
    inquiries = await Inquiry.find(
        Inquiry.buyer_id == current_user.id,
        Inquiry.inquiry_type != InquiryType.winner_contact
    ).sort("-created_at").to_list()
    return [_to_response(i) for i in inquiries]


# ── Seller: Get inquiries RECEIVED by me ──────────────────────────────────────
@router.get("/received")
async def get_received_inquiries(
    current_user: User = Depends(get_current_user)
):
    inquiries = await Inquiry.find(Inquiry.receiver_id == current_user.id).sort("-created_at").to_list()
    return [await _to_response_full(i) for i in inquiries]


# ── Admin: Get ALL inquiries ──────────────────────────────────────────────────
@router.get("/all", response_model=List[InquiryResponse])
async def get_all_inquiries(
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ("admin",):
        raise HTTPException(status_code=403, detail="Admin access required")
    inquiries = await Inquiry.find(Inquiry.inquiry_type != InquiryType.winner_contact).sort("-created_at").to_list()
    return [await _to_response_full(i) for i in inquiries]


# ── Admin: Reply to an inquiry ────────────────────────────────────────────────
@router.put("/{inquiry_id}/reply", response_model=InquiryResponse)
async def reply_to_inquiry(
    inquiry_id: PydanticObjectId,
    data: InquiryAdminReply,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ("admin",):
        raise HTTPException(status_code=403, detail="Admin access required")

    inquiry = await Inquiry.get(inquiry_id)
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    if data.admin_reply is not None:
        inquiry.admin_reply = data.admin_reply

    # Update status
    try:
        inquiry.status = InquiryStatus(data.status)
    except ValueError:
        inquiry.status = InquiryStatus.in_progress

    await inquiry.save()
    return _to_response(inquiry)


# ── Buyer: Update an inquiry ──────────────────────────────────────────────────
@router.put("/{inquiry_id}", response_model=InquiryResponse)
async def update_inquiry(
    inquiry_id: PydanticObjectId,
    data: InquiryCreate,
    current_user: User = Depends(get_current_user)
):
    inquiry = await Inquiry.get(inquiry_id)
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    if inquiry.buyer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Permission denied")

    if inquiry.admin_reply:
        raise HTTPException(status_code=400, detail="Cannot edit inquiry after admin has replied")

    # Update fields
    try:
        inq_type = InquiryType(data.inquiry_type)
    except ValueError:
        inq_type = InquiryType.general

    selected_land_id = None
    selected_receiver_id = None
    if inq_type == InquiryType.listing:
        if not data.land_id:
            raise HTTPException(status_code=400, detail="Please select a land for listing inquiries")

        try:
            selected_land_id = PydanticObjectId(data.land_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid land ID")

        land = await Land.get(selected_land_id)
        if not land:
            raise HTTPException(status_code=404, detail="Selected land not found")

        selected_receiver_id = land.seller_id

    inquiry.title = data.title
    inquiry.inquiry_type = inq_type
    inquiry.land_id = selected_land_id
    inquiry.receiver_id = selected_receiver_id
    inquiry.message = data.message

    await inquiry.save()
    return _to_response(inquiry)


# ── Delete an inquiry (Admin or Owner before reply) ───────────────────────────
@router.delete("/{inquiry_id}", status_code=204)
async def delete_inquiry(
    inquiry_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
):
    inquiry = await Inquiry.get(inquiry_id)
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")

    # Check if admin OR owner
    if current_user.role == "admin":
        pass # Admin can always delete
    elif inquiry.buyer_id == current_user.id:
        # Owner can delete only if no admin reply
        if inquiry.admin_reply:
             raise HTTPException(status_code=400, detail="Cannot delete inquiry after admin has replied")
    else:
        raise HTTPException(status_code=403, detail="Permission denied")

    await inquiry.delete()
