from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database.connection import get_db
from app.models.land_model import Land
from app.models.user_model import User
from app.models.bidding_setup_model import BiddingSetup
from app.schemas.land_schema import LandCreate, LandUpdate, LandResponse, BiddingSetupBase
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/lands", tags=["Lands"])


# ── Create a new land listing (seller only) ───────────────────────────────────
@router.post("/", response_model=LandResponse, status_code=status.HTTP_201_CREATED)
def create_land(
    data: LandCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total = data.perches * data.price_per_perch
    land = Land(
        seller_id=current_user.id,
        name=data.name,
        district=data.district,
        village=data.village,
        perches=data.perches,
        price_per_perch=data.price_per_perch,
        total_price=total,
        land_type=data.land_type,
        status=data.status,
        road_access=data.road_access,
        electricity=data.electricity,
        water=data.water,
        image_url=data.image_url,
    )
    db.add(land)
    db.commit()
    db.refresh(land)
    
    # Initialize empty bidding setup for the land
    bidding = BiddingSetup(land_id=land.id)
    db.add(bidding)
    db.commit()
    db.refresh(land)
    
    return land


# ── Get all Available lands (public, for buyers) ──────────────────────────────
@router.get("/", response_model=List[LandResponse])
def get_all_lands(db: Session = Depends(get_db)):
    return db.query(Land).filter(Land.status == "Available").order_by(Land.created_at.desc()).all()


# ── Get the current seller's own listings ─────────────────────────────────────
@router.get("/my", response_model=List[LandResponse])
def get_my_lands(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Land).filter(Land.seller_id == current_user.id).order_by(Land.created_at.desc()).all()


# ── Get a single land by ID ───────────────────────────────────────────────────
@router.get("/{land_id}", response_model=LandResponse)
def get_land(land_id: int, db: Session = Depends(get_db)):
    land = db.query(Land).filter(Land.id == land_id).first()
    if not land:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Land not found")
    return land


# ── Update a land listing (seller only, must own it) ─────────────────────────
@router.put("/{land_id}", response_model=LandResponse)
def update_land(
    land_id: int,
    data: dict, # Using dict to handle mixed fields flexibly during transition
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    land = db.query(Land).filter(Land.id == land_id, Land.seller_id == current_user.id).first()
    if not land:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Land not found or not yours")

    # Split fields into Land and BiddingSetup
    bidding_fields = ['open_for_bidding', 'starting_bid', 'bidding_end']
    
    for field, value in data.items():
        if field in bidding_fields:
            if land.bidding_setup:
                setattr(land.bidding_setup, field, value)
            else:
                # Fallback if somehow missing
                new_bidding = BiddingSetup(land_id=land.id, **{field: value})
                db.add(new_bidding)
        elif hasattr(land, field):
            setattr(land, field, value)

    # Recalculate total price if perches/price_per_perch changed
    if 'perches' in data or 'price_per_perch' in data:
        p = data.get('perches', land.perches)
        ppp = data.get('price_per_perch', land.price_per_perch)
        land.total_price = p * ppp

    db.commit()
    db.refresh(land)
    return land


# ── Delete a land listing (seller only, must own it) ─────────────────────────
@router.delete("/{land_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_land(
    land_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    land = db.query(Land).filter(Land.id == land_id, Land.seller_id == current_user.id).first()
    if not land:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Land not found or not yours")
    db.delete(land)
    db.commit()
