from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from beanie import PydanticObjectId

from app.database.connection import get_db
from app.models.inquiry_model import Inquiry, InquiryStatus, InquiryType
from app.models.user_model import User
from app.schemas.inquiry_schema import InquiryCreate, InquiryResponse, InquiryAdminReply
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/inquiries", tags=["Inquiries"])


def _to_response(inq: Inquiry) -> InquiryResponse:
    return InquiryResponse(
        id=str(inq.id),
        buyer_id=str(inq.buyer_id),
        title=inq.title,
        inquiry_type=inq.inquiry_type.value if hasattr(inq.inquiry_type, 'value') else str(inq.inquiry_type),
        message=inq.message,
        admin_reply=inq.admin_reply,
        status=inq.status.value if hasattr(inq.status, 'value') else str(inq.status),
        created_at=inq.created_at,
        updated_at=inq.updated_at,
    )


# ── Buyer: Submit a new inquiry ───────────────────────────────────────────────
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

    inquiry = Inquiry(
        buyer_id=current_user.id,
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
    inquiries = await Inquiry.find(Inquiry.buyer_id == current_user.id).sort("-created_at").to_list()
    return [_to_response(i) for i in inquiries]


# ── Admin: Get ALL inquiries ──────────────────────────────────────────────────
@router.get("/all", response_model=List[InquiryResponse])
async def get_all_inquiries(
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ("admin",):
        raise HTTPException(status_code=403, detail="Admin access required")
    inquiries = await Inquiry.find_all().sort("-created_at").to_list()
    return [_to_response(i) for i in inquiries]


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

    inquiry.admin_reply = data.admin_reply

    # Update status
    try:
        inquiry.status = InquiryStatus(data.status)
    except ValueError:
        inquiry.status = InquiryStatus.in_progress

    await inquiry.save()
    return _to_response(inquiry)


# ── Admin: Delete an inquiry ──────────────────────────────────────────────────
@router.delete("/{inquiry_id}", status_code=204)
async def delete_inquiry(
    inquiry_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ("admin",):
        raise HTTPException(status_code=403, detail="Admin access required")
    inquiry = await Inquiry.get(inquiry_id)
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    await inquiry.delete()
