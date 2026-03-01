from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
import os
import uuid
import shutil
from typing import List
from beanie import PydanticObjectId

from app.database.connection import get_db
from app.models.land_model import Land
from app.models.user_model import User
from app.models.bidding_setup_model import BiddingSetup
from app.schemas.land_schema import LandCreate, LandUpdate, LandResponse, BiddingSetupBase
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/lands", tags=["Lands"])

@router.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    # Create static directory if not exists
    os.makedirs("static/uploads", exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join("static/uploads", filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Return absolute URL (assuming backend runs on localhost:8000)
    # In production, this should be the actual server URL
    url = f"http://localhost:8000/static/uploads/{filename}"
    return {"url": url}


# ── Create a new land listing (seller only) ───────────────────────────────────
@router.post("/", response_model=LandResponse, status_code=status.HTTP_201_CREATED)
async def create_land(
    data: LandCreate,
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
    await land.insert()
    
    # Initialize empty bidding setup for the land
    bidding = BiddingSetup(land_id=land.id)
    await bidding.insert()
    
    return land


# ── Get all Available lands (public, for buyers) ──────────────────────────────
@router.get("/", response_model=List[LandResponse])
async def get_all_lands():
    lands = await Land.find(Land.status == "Available").sort("-created_at").to_list()
    # Attach bidding setup to each land for the response
    for land in lands:
        bidding = await BiddingSetup.find_one(BiddingSetup.land_id == land.id)
        if bidding:
            land.open_for_bidding = bidding.open_for_bidding
            land.starting_bid = bidding.starting_bid
            land.bidding_start = bidding.bidding_start
            land.bidding_end = bidding.bidding_end
            land.bidding_setup = bidding
    return lands


# ── Get the current seller's own listings ─────────────────────────────────────
@router.get("/my", response_model=List[LandResponse])
async def get_my_lands(
    current_user: User = Depends(get_current_user)
):
    lands = await Land.find(Land.seller_id == current_user.id).sort("-created_at").to_list()
    for land in lands:
        bidding = await BiddingSetup.find_one(BiddingSetup.land_id == land.id)
        if bidding:
            land.open_for_bidding = bidding.open_for_bidding
            land.starting_bid = bidding.starting_bid
            land.bidding_start = bidding.bidding_start
            land.bidding_end = bidding.bidding_end
            land.bidding_setup = bidding
    return lands


# ── Get a single land by ID ───────────────────────────────────────────────────
@router.get("/{land_id}", response_model=LandResponse)
async def get_land(land_id: PydanticObjectId):
    land = await Land.get(land_id)
    if not land:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Land not found")
    
    bidding = await BiddingSetup.find_one(BiddingSetup.land_id == land.id)
    if bidding:
        land.open_for_bidding = bidding.open_for_bidding
        land.starting_bid = bidding.starting_bid
        land.bidding_start = bidding.bidding_start
        land.bidding_end = bidding.bidding_end
        land.bidding_setup = bidding
        
    return land


# ── Update a land listing (seller only, must own it) ─────────────────────────
@router.put("/{land_id}", response_model=LandResponse)
async def update_land(
    land_id: PydanticObjectId,
    data: dict, # Using dict to handle mixed fields flexibly durante transition
    current_user: User = Depends(get_current_user)
):
    land = await Land.find_one(Land.id == land_id, Land.seller_id == current_user.id)
    if not land:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Land not found or not yours")

    bidding = await BiddingSetup.find_one(BiddingSetup.land_id == land_id)

    # Split fields into Land and BiddingSetup
    bidding_fields = ['open_for_bidding', 'starting_bid', 'bidding_start', 'bidding_end']
    
    for field, value in data.items():
        if field in bidding_fields:
            if bidding:
                setattr(bidding, field, value)
            else:
                bidding = BiddingSetup(land_id=land.id, **{field: value})
                await bidding.insert()
        elif hasattr(land, field):
            setattr(land, field, value)

    if bidding:
        await bidding.save()

    # Recalculate total price if perches/price_per_perch changed
    if 'perches' in data or 'price_per_perch' in data:
        p = data.get('perches', land.perches)
        ppp = data.get('price_per_perch', land.price_per_perch)
        land.total_price = p * ppp

    await land.save()
    
    # Attach bidding to response
    if bidding:
        land.open_for_bidding = bidding.open_for_bidding
        land.starting_bid = bidding.starting_bid
        land.bidding_start = bidding.bidding_start
        land.bidding_end = bidding.bidding_end
        land.bidding_setup = bidding
        
    return land


# ── Delete a land listing (seller only, must own it) ─────────────────────────
@router.delete("/{land_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_land(
    land_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
):
    land = await Land.find_one(Land.id == land_id, Land.seller_id == current_user.id)
    if not land:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Land not found or not yours")
    
    # Also delete associated bidding setup
    bidding = await BiddingSetup.find_one(BiddingSetup.land_id == land_id)
    if bidding:
        await bidding.delete()
        
    await land.delete()
