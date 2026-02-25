from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.visit_model import Visit, VisitStatus, VisitType
from app.models.land_model import Land
from app.models.user_model import User
from app.schemas.visit_schema import VisitCreate, VisitUpdateStatus, VisitResponse
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/visits", tags=["Visits"])


def _build_response(visit: Visit, db: Session) -> VisitResponse:
    buyer = db.query(User).filter(User.id == visit.buyer_id).first()
    land  = db.query(Land).filter(Land.id == visit.land_id).first()
    
    return VisitResponse(
        id=visit.id,
        land_id=visit.land_id,
        buyer_id=visit.buyer_id,
        visit_type=visit.visit_type,
        visit_date=visit.visit_date,
        visit_time=visit.visit_time,
        message=visit.message,
        status=visit.status,
        created_at=visit.created_at,
        buyer_name=buyer.full_name if buyer else None,
        land_name=land.name if land else None,
    )


# ── Buyer: book a site visit ──────────────────────────────────────────────────
@router.post("/", response_model=VisitResponse, status_code=status.HTTP_201_CREATED)
def book_visit(
    data: VisitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    land = db.query(Land).filter(Land.id == data.land_id).first()
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")

    # Prevent duplicate pending visit of same type for same buyer/land
    existing = db.query(Visit).filter(
        Visit.land_id == data.land_id,
        Visit.buyer_id == current_user.id,
        Visit.status == VisitStatus.Pending,
        Visit.visit_type == data.visit_type
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail=f"You already have a pending {data.visit_type.replace('_', ' ')} request for this land.")

    visit = Visit(
        land_id=data.land_id,
        buyer_id=current_user.id,
        visit_type=data.visit_type,
        visit_date=data.visit_date,
        visit_time=data.visit_time,
        message=data.message,
        status=VisitStatus.Pending,
    )
        
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return _build_response(visit, db)


@router.get("/my-requests", response_model=List[VisitResponse])
def my_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    visits = db.query(Visit).filter(Visit.buyer_id == current_user.id).order_by(Visit.created_at.desc()).all()
    return [_build_response(v, db) for v in visits]


@router.get("/my-lands", response_model=List[VisitResponse])
def my_land_visits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get all lands owned by this seller
    land_ids = [l.id for l in db.query(Land).filter(Land.seller_id == current_user.id).all()]
    if not land_ids:
        return []
        
    visits = db.query(Visit).filter(Visit.land_id.in_(land_ids)).order_by(Visit.created_at.desc()).all()
    return [_build_response(v, db) for v in visits]


# ── Seller: accept or reject a visit ─────────────────────────────────────────
@router.put("/{visit_id}/status", response_model=VisitResponse)
def update_visit_status(
    visit_id: int,
    data: VisitUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    visit = db.query(Visit).filter(Visit.id == visit_id).first()

    if not visit:
        raise HTTPException(status_code=404, detail="Visit not found")

    # Verify ownership
    land = db.query(Land).filter(Land.id == visit.land_id, Land.seller_id == current_user.id).first()
    if not land:
        raise HTTPException(status_code=403, detail="You don't own this land")

    visit.status = data.status
    db.commit()
    db.refresh(visit)
    return _build_response(visit, db)
