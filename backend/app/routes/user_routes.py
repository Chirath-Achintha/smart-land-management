from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from beanie import PydanticObjectId

from app.models.user_model import User
from app.models.visit_model import Visit
from app.models.service_booking_model import ServiceBooking
from app.models.inquiry_model import Inquiry
from app.schemas.user_schema import UserResponse
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin User Management"])

def check_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted. Admin role required."
        )
    return current_user

@router.get("/users", response_model=List[UserResponse])
async def list_users(admin: User = Depends(check_admin)):
    """List all registered users in the system."""
    users = await User.find_all().to_list()
    return users

@router.get("/stats")
async def get_admin_stats(admin: User = Depends(check_admin)):
    """Get summarized statistics for the admin dashboard."""
    # Count system-wide items
    total_users = await User.count()
    pending_visits = await Visit.find(Visit.status == "Pending").count()
    active_services = await ServiceBooking.find(ServiceBooking.status == "Approved").count()
    open_inquiries = await Inquiry.count() # Or filter by status if available
    
    return [
        {"label": "Pending Requests", "count": str(pending_visits), "color": "#3498db", "route": "/dashboard/admin/agents"},
        {"label": "Active Services", "count": str(active_services), "color": "#27ae60", "route": "/dashboard/admin/services"},
        {"label": "Open Complaints", "count": str(open_inquiries), "color": "#e74c3c", "route": "/dashboard/admin/complaints"},
        {"label": "Total Users", "count": str(total_users), "color": "#1A1A1A", "route": "/dashboard/users"},
    ]

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str, admin: User = Depends(check_admin)):
    """Delete a user from the system."""
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await user.delete()
    return None
