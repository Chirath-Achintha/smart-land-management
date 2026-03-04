from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from beanie import PydanticObjectId

from app.models.bid_model import Bid

from app.models.land_model import Land
from app.models.user_model import User
from app.models.bidding_setup_model import BiddingSetup
from app.schemas.bid_schema import BidCreate, BidResponse
from app.routes.auth_routes import get_current_user

router = APIRouter(prefix="/bids", tags=["Bids"])


async def _to_response(bid: Bid) -> BidResponse:
    """Map ORM bid to response schema (include buyer info)."""
    buyer = await User.get(bid.buyer_id)
    return BidResponse(
        id=str(bid.id),
        land_id=str(bid.land_id),
        buyer_id=str(bid.buyer_id),
        buyer_name=buyer.full_name if buyer else None,
        buyer_email=buyer.email if buyer else None,
        amount=bid.amount,
        message=bid.message,
        status=bid.status,
        created_at=bid.created_at,
    )


# ── Place a bid (buyer only) ──────────────────────────────────────────────────
@router.post("/", response_model=BidResponse, status_code=status.HTTP_201_CREATED)
async def place_bid(
    data: BidCreate,
    current_user: User = Depends(get_current_user)
):
    land_id = PydanticObjectId(data.land_id)
    land = await Land.get(land_id)
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
        
    bidding_setup = await BiddingSetup.find_one(BiddingSetup.land_id == land_id)
    if not bidding_setup or not bidding_setup.open_for_bidding:
        raise HTTPException(status_code=400, detail="This land is not open for bidding")
        
    if land.seller_id == current_user.id:
        raise HTTPException(status_code=400, detail="Sellers cannot bid on their own land")

    bid = Bid(
        land_id=land_id,
        buyer_id=current_user.id,
        amount=data.amount,
        message=data.message,
    )
    await bid.insert()
    return await _to_response(bid)


# ── Get all bids for a specific land (public - buyers & sellers can see) ──────
@router.get("/land/{land_id}", response_model=List[BidResponse])
async def get_bids_for_land(land_id: PydanticObjectId):
    bids = await Bid.find(Bid.land_id == land_id).sort("-amount").to_list()
    return [await _to_response(b) for b in bids]


# ── Get all bids on the current seller's lands ────────────────────────────────
@router.get("/my-listings", response_model=List[BidResponse])
async def get_bids_on_my_lands(
    current_user: User = Depends(get_current_user)
):
    # Find all lands owned by this seller
    my_lands = await Land.find(Land.seller_id == current_user.id).to_list()
    land_ids = [land.id for land in my_lands]
    
    # Find bids on those lands
    bids = await Bid.find({"land_id": {"$in": land_ids}}).sort("-created_at").to_list()
    return [await _to_response(b) for b in bids]


# ── Get all bids placed BY the current buyer ──────────────────────────────────
@router.get("/my-bids", response_model=List[BidResponse])
async def get_my_bids(
    current_user: User = Depends(get_current_user)
):
    bids = await Bid.find(Bid.buyer_id == current_user.id).sort("-created_at").to_list()
    return [await _to_response(b) for b in bids]


# ── Seller deletes a bid (optional cleanup) ───────────────────────────────────
@router.delete("/{bid_id}", status_code=204)
async def delete_bid(
    bid_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
):
    bid = await Bid.find_one(Bid.id == bid_id, Bid.buyer_id == current_user.id)
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found or not yours")
    await bid.delete()
