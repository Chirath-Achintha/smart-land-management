from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
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

@router.get("/agents", response_model=List[UserResponse])
async def list_agents(admin: User = Depends(check_admin)):
    """List all agents in the system."""
    agents = await User.find(User.role == "agent").to_list()
    return agents

@router.post("/agents", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_agent(user_data: dict, admin: User = Depends(check_admin)):
    """Admin creates a new agent user."""
    from app.routes.auth_routes import hash_password
    
    # Check if email already in use
    if await User.find_one(User.email == user_data['email']):
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create and save user
    new_user = User(
        full_name=user_data['name'],
        nic_number=user_data['nic'],
        role="agent",
        phone=user_data.get('phone'),
        address=user_data.get('address', 'Not Specified'), 
        email=user_data['email'],
        hashed_password=hash_password(user_data['password'])
    )
    await new_user.insert()
    return new_user

@router.put("/agents/{agent_id}", response_model=UserResponse)
async def update_agent(agent_id: str, user_data: dict, admin: User = Depends(check_admin)):
    """Admin updates agent details."""
    try:
        obj_id = PydanticObjectId(agent_id)
    except Exception:
         raise HTTPException(status_code=400, detail="Invalid Agent ID format")

    user = await User.get(obj_id)
    if not user:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    # Update fields mapping from frontend keys to backend attributes
    if "name" in user_data:
        user.full_name = user_data["name"]
    if "email" in user_data:
        # Check if email is already used by another user
        existing = await User.find_one(User.email == user_data["email"])
        if existing and str(existing.id) != str(user.id):
            raise HTTPException(status_code=400, detail="Email already in use by another user")
        user.email = user_data["email"]
    if "nic" in user_data:
        user.nic_number = user_data["nic"]
    if "address" in user_data:
        user.address = user_data["address"]
    if "phone" in user_data:
        user.phone = user_data["phone"]
    
    # Optional password update
    if user_data.get("password"):
        from app.routes.auth_routes import hash_password
        user.hashed_password = hash_password(user_data["password"])
        
    user.updated_at = datetime.utcnow()
    await user.save()
    return user
