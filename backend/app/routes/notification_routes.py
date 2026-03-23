from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from beanie import PydanticObjectId
from datetime import datetime

from app.models.notification_model import Notification, NotificationType
from app.models.user_model import User
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])

# ── Get current user's notifications ──────────────────────────────────────────
@router.get("/", response_model=List[Notification])
async def get_my_notifications(
    current_user: User = Depends(get_current_user)
):
    return await Notification.find(Notification.user_id == current_user.id).sort("-created_at").to_list()

# ── Mark a notification as read ───────────────────────────────────────────────
@router.put("/{notif_id}/read", status_code=200)
async def mark_as_read(
    notif_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
):
    notif = await Notification.find_one(Notification.id == notif_id, Notification.user_id == current_user.id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    await notif.save()
    return {"status": "read"}

# ── Mark all as read ──────────────────────────────────────────────────────────
@router.put("/read-all", status_code=200)
async def mark_all_as_read(
    current_user: User = Depends(get_current_user)
):
    await Notification.find(Notification.user_id == current_user.id, Notification.is_read == False).update({"$set": {"is_read": True}})
    return {"status": "all marked as read"}
