from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.visit_model import Visit, VisitStatus, SelfVisit, VisitType
from app.models.land_model import Land
from app.models.user_model import User
from app.schemas.visit_schema import VisitCreate, VisitUpdateStatus, VisitResponse
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/visits", tags=["Visits"])


def _build_response(visit: any, db: Session) -> VisitResponse:
    buyer = db.query(User).filter(User.id == visit.buyer_id).first()
    land  = db.query(Land).filter(Land.id == visit.land_id).first()
    
    # Extract columns dynamically
    data = {c.name: getattr(visit, c.name) for c in visit.__table__.columns}
    
    # Ensure visit_type is present for SelfVisit (which doesn't have the column)
    if not hasattr(visit, 'visit_type'):
        data['visit_type'] = VisitType.Self

    return VisitResponse(
        **data,
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

    # Prevent duplicate pending visit for same buyer/land
    existing = db.query(Visit).filter(
        Visit.land_id == data.land_id,
        Visit.buyer_id == current_user.id,
        Visit.status == VisitStatus.Pending
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="You already have a pending visit request for this land.")

    if data.visit_type == VisitType.Self:
        # Save to self_visits table
        visit = SelfVisit(
            land_id=data.land_id,
            buyer_id=current_user.id,
            visit_date=data.visit_date,
            visit_time=data.visit_time,
            message=data.message,
            status=VisitStatus.Pending,
        )
    else:
        # Save to standard visits table
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
    # Fetch from standard visits
    v1 = db.query(Visit).filter(Visit.buyer_id == current_user.id).all()
    
    # Fetch from self visits
    v2 = db.query(SelfVisit).filter(SelfVisit.buyer_id == current_user.id).all()
    
    combined = [_build_response(v, db) for v in v1] + [_build_response(v, db) for v in v2]
    combined.sort(key=lambda x: x.created_at, reverse=True)
    return combined


@router.get("/my-lands", response_model=List[VisitResponse])
def my_land_visits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get all lands owned by this seller
    land_ids = [l.id for l in db.query(Land).filter(Land.seller_id == current_user.id).all()]
    if not land_ids:
        return []
        
    v1 = db.query(Visit).filter(Visit.land_id.in_(land_ids)).all()
    v2 = db.query(SelfVisit).filter(SelfVisit.land_id.in_(land_ids)).all()
    
    combined = [_build_response(v, db) for v in v1] + [_build_response(v, db) for v in v2]
    combined.sort(key=lambda x: x.created_at, reverse=True)
    return combined


# ── Seller: accept or reject a visit ─────────────────────────────────────────
@router.put("/{visit_id}/status", response_model=VisitResponse)
def update_visit_status(
    visit_id: int,
    data: VisitUpdateStatus,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check Visits table first
    visit = db.query(Visit).filter(Visit.id == visit_id).first()
    
    # If not found, check SelfVisits table
    if not visit:
        visit = db.query(SelfVisit).filter(SelfVisit.id == visit_id).first()

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
