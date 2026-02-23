from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.bid_model import Bid
from app.models.land_model import Land
from app.models.user_model import User
from app.schemas.bid_schema import BidCreate, BidStatusUpdate, BidResponse
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/bids", tags=["Bids"])


def _to_response(bid: Bid) -> BidResponse:
    """Map ORM bid to response schema (include buyer info)."""
    return BidResponse(
        id=bid.id,
        land_id=bid.land_id,
        buyer_id=bid.buyer_id,
        buyer_name=bid.buyer.full_name if bid.buyer else None,
        buyer_email=bid.buyer.email if bid.buyer else None,
        amount=bid.amount,
        message=bid.message,
        status=bid.status,
        created_at=bid.created_at,
    )


# ── Place a bid (buyer only) ──────────────────────────────────────────────────
@router.post("/", response_model=BidResponse, status_code=status.HTTP_201_CREATED)
def place_bid(
    data: BidCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    land = db.query(Land).filter(Land.id == data.land_id).first()
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    if not land.open_for_bidding:
        raise HTTPException(status_code=400, detail="This land is not open for bidding")
    if land.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="Sellers cannot bid on their own land")

    bid = Bid(
        land_id=data.land_id,
        buyer_id=current_user.id,
        amount=data.amount,
        message=data.message,
    )
    db.add(bid)
    db.commit()
    db.refresh(bid)
    # Refresh relationship so buyer info is available
    db.refresh(bid.buyer if bid.buyer else bid)
    return _to_response(bid)


# ── Get all bids for a specific land (public - buyers & sellers can see) ──────
@router.get("/land/{land_id}", response_model=List[BidResponse])
def get_bids_for_land(land_id: int, db: Session = Depends(get_db)):
    bids = (
        db.query(Bid)
        .filter(Bid.land_id == land_id)
        .order_by(Bid.amount.desc())
        .all()
    )
    return [_to_response(b) for b in bids]


# ── Get all bids on the current seller's lands ────────────────────────────────
@router.get("/my-listings", response_model=List[BidResponse])
def get_bids_on_my_lands(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Find all lands owned by this seller, then join bids
    bids = (
        db.query(Bid)
        .join(Land, Bid.land_id == Land.id)
        .filter(Land.seller_id == current_user.id)
        .order_by(Bid.created_at.desc())
        .all()
    )
    return [_to_response(b) for b in bids]


# ── Get all bids placed BY the current buyer ──────────────────────────────────
@router.get("/my-bids", response_model=List[BidResponse])
def get_my_bids(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bids = (
        db.query(Bid)
        .filter(Bid.buyer_id == current_user.id)
        .order_by(Bid.created_at.desc())
        .all()
    )
    return [_to_response(b) for b in bids]


# ── Seller updates bid status (Accept / Reject) ───────────────────────────────
@router.put("/{bid_id}/status", response_model=BidResponse)
def update_bid_status(
    bid_id: int,
    data: BidStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bid = db.query(Bid).filter(Bid.id == bid_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    # Only the seller of the corresponding land can update status
    land = db.query(Land).filter(Land.id == bid.land_id).first()
    if not land or land.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorised to update this bid")

    if data.status not in ("Accepted", "Rejected", "Pending"):
        raise HTTPException(status_code=400, detail="Invalid status value")

    bid.status = data.status
    db.commit()
    db.refresh(bid)
    return _to_response(bid)


# ── Seller deletes a bid (optional cleanup) ───────────────────────────────────
@router.delete("/{bid_id}", status_code=204)
def delete_bid(
    bid_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    bid = db.query(Bid).filter(Bid.id == bid_id, Bid.buyer_id == current_user.id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found or not yours")
    db.delete(bid)
    db.commit()
