from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from beanie import PydanticObjectId

from pydantic import BaseModel, Field
from app.models.bid_model import Bid

from app.models.land_model import Land
from app.models.user_model import User
from app.models.bidding_setup_model import BiddingSetup
from app.schemas.bid_schema import BidCreate, BidResponse
from app.routes.auth_routes import get_current_user

from app.models.notification_model import Notification, NotificationType
from app.models.inquiry_model import Inquiry, InquiryType, InquiryStatus
from datetime import datetime, timezone
import dateutil.parser

router = APIRouter(prefix="/bids", tags=["Bids"])

# ── Helper: Check and notify winners for ended auctions ─────────────────────
async def check_and_notify_winners():
    now = datetime.now(timezone.utc)
    # Find active bidding setups that have reached their end time and haven't notified winner yet
    ended_setups = await BiddingSetup.find(
        {"bidding_end": {"$ne": None}, "winner_notified": False}
    ).to_list()
    
    for setup in ended_setups:
        try:
            # Parse bidding_end ISO string
            end_time = dateutil.parser.isoparse(setup.bidding_end)
            if end_time.tzinfo is None:
                end_time = end_time.replace(tzinfo=timezone.utc)
        except Exception:
            continue
            
        if end_time <= now:
            # Auction ended! Find highest bid
            highest_bid = await Bid.find(Bid.land_id == setup.land_id).sort("-amount").limit(1).to_list()
            
            if highest_bid:
                winner_bid = highest_bid[0]
                land = await Land.get(setup.land_id)
                
                # Check if notification already exists to avoid overlaps
                existing = await Notification.find_one({
                    "user_id": winner_bid.buyer_id,
                    "type": NotificationType.bid_won,
                    "link": f"/lands/{str(setup.land_id)}"
                })
                
                if not existing:
                    # Notify the winner
                    notif = Notification(
                        user_id=winner_bid.buyer_id,
                        type=NotificationType.bid_won,
                        title="Congratulations! You Won a Bid",
                        message=f"You are the highest bidder for \"{land.name}\". Contact the seller to proceed.",
                        link=f"/lands/{str(setup.land_id)}"
                    )
                    await notif.insert()
            
            # Mark as notified anyway (even if no bids) so we don't check it again
            setup.winner_notified = True
            await setup.save()

@router.get("/check-winners")
async def manual_check_winners():
    """Manually trigger winner cross-check."""
    await check_and_notify_winners()
    return {"status": "checked"}

class WinnerContactRequest(BaseModel):
    land_id: str
    message: str

@router.post("/contact-seller", status_code=201)
async def contact_seller_win(
    data: WinnerContactRequest,
    current_user: User = Depends(get_current_user)
):
    """Allow a winner to contact the seller."""
    land_id = PydanticObjectId(data.land_id)
    land = await Land.get(land_id)
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
        
    # Create Inquiry for Seller
    inquiry = Inquiry(
        buyer_id=current_user.id,
        receiver_id=land.seller_id,
        land_id=land_id,
        title=f"Winner Contact: {land.name}",
        inquiry_type=InquiryType.winner_contact,
        message=data.message
    )
    await inquiry.insert()
    
    # Notify Seller as well
    notif = Notification(
        user_id=land.seller_id,
        type=NotificationType.general,
        title="Winner Contacted You",
        message=f"The winning bidder for \"{land.name}\" has sent you a message.",
        link=f"/dashboard/seller/bids" 
    )
    await notif.insert()
    
    return {"status": "message sent"}


async def _to_response(bid: Bid) -> BidResponse:
    """Map ORM bid to response schema (include buyer info and win status)."""
    buyer = await User.get(bid.buyer_id)
    land = await Land.get(bid.land_id)
    
    # Check if this bid is a winner
    is_winner = False
    bidding_setup = await BiddingSetup.find_one(BiddingSetup.land_id == bid.land_id)
    
    if bidding_setup and bidding_setup.bidding_end:
        try:
            end_time = dateutil.parser.isoparse(bidding_setup.bidding_end)
            if end_time.tzinfo is None:
                end_time = end_time.replace(tzinfo=timezone.utc)
            
            # If auction ended, check if this is the highest bid
            if end_time <= datetime.now(timezone.utc):
                highest = await Bid.find(Bid.land_id == bid.land_id).sort("-amount").limit(1).to_list()
                if highest and highest[0].id == bid.id:
                    is_winner = True
        except Exception:
            pass

    return BidResponse(
        id=str(bid.id),
        land_id=str(bid.land_id),
        land_name=land.name if land else "Unknown Land",
        buyer_id=str(bid.buyer_id),
        buyer_name=buyer.full_name if buyer else None,
        buyer_email=buyer.email if buyer else None,
        amount=bid.amount,
        message=bid.message,
        status=bid.status,
        is_winner=is_winner,
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
    # Auto-check winners when user checks their bids
    await check_and_notify_winners()
    
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
