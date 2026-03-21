from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.constructor_team_model import ConstructorTeam
from app.models.user_model import User
from app.routes.auth_routes import get_current_user, hash_password
from app.schemas.constructor_team_schema import ConstructorTeamCreate, ConstructorTeamResponse

router = APIRouter(prefix="/admin/constructor-teams", tags=["Admin Constructor Teams"])


def _check_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required")
    return current_user


async def _team_response(team: ConstructorTeam) -> ConstructorTeamResponse:
    user = await User.get(team.user_id)
    return ConstructorTeamResponse(
        id=str(team.id),
        user_id=str(team.user_id),
        team_name=team.team_name,
        manager_name=team.manager_name,
        district=team.district,
        state=team.state,
        address=team.address,
        specialization=team.specialization,
        phone=team.phone,
        email=user.email if user else "",
        is_active=team.is_active,
        created_at=team.created_at,
    )


@router.post("/", response_model=ConstructorTeamResponse, status_code=status.HTTP_201_CREATED)
async def create_constructor_team(
    payload: ConstructorTeamCreate,
    _: User = Depends(_check_admin),
):
    existing = await User.find_one(User.email == payload.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    constructor_user = User(
        full_name=payload.team_name,
        nic_number=f"CT-{int(datetime.utcnow().timestamp() * 1000)}",
        role="constructor_manager",
        phone=payload.phone,
        address=payload.address,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    await constructor_user.insert()

    team = ConstructorTeam(
        user_id=constructor_user.id,
        team_name=payload.team_name,
        manager_name=payload.manager_name,
        district=payload.district,
        state=payload.state,
        address=payload.address,
        specialization=payload.specialization,
        phone=payload.phone,
        is_active=True,
    )
    await team.insert()
    return await _team_response(team)


@router.get("/", response_model=List[ConstructorTeamResponse])
async def list_constructor_teams(_: User = Depends(_check_admin)):
    teams = await ConstructorTeam.find_all().sort("-created_at").to_list()
    return [await _team_response(t) for t in teams]
