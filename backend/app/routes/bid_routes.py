from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from beanie import PydanticObjectId

from pydantic import BaseModel, Field
from app.models.bid_model import Bid, BidStatus

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
                seller = await User.get(land.seller_id)
                
                # Check if notification already exists to avoid overlaps
                existing = await Notification.find_one({
                    "user_id": winner_bid.buyer_id,
                    "type": NotificationType.bid_won,
                    "link": f"/lands/{str(setup.land_id)}"
                })
                
                if not existing:
                    # Notify the winner with seller details
                    seller_info = f"{seller.full_name} ({seller.email})" if seller else "the seller"
                    notif = Notification(
                        user_id=winner_bid.buyer_id,
                        type=NotificationType.bid_won,
                        title="Congratulations! You Won a Bid",
                        message=f"You are the highest bidder for \"{land.name}\". Contact {seller_info} to proceed with the purchase.",
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
            
            # If auction ended, check if this is the highest bid (excluding rejected/declined)
            if end_time <= datetime.now(timezone.utc):
                highest = await Bid.find(
                    Bid.land_id == bid.land_id,
                    Bid.status != BidStatus.rejected,
                    Bid.status != BidStatus.declined
                ).sort("-amount").limit(1).to_list()
                if highest and str(highest[0].id) == str(bid.id):
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


# ── Seller manually notifies the winner ──────────────────────────────────────
@router.post("/notify-winner/{bid_id}")
async def notify_winner_manually(
    bid_id: PydanticObjectId, 
    current_user: User = Depends(get_current_user)
):
    bid = await Bid.get(bid_id)
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
        
    land = await Land.get(bid.land_id)
    if not land or land.seller_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not own this land listing")
        
    # Update bid status to Offered
    bid.status = BidStatus.offered
    await bid.save()
    
    # Send notification to Buyer
    contact_parts = [f"Name: {current_user.full_name}", f"Email: {current_user.email}"]
    if current_user.phone:
        contact_parts.append(f"Phone: {current_user.phone}")
    if current_user.address:
        contact_parts.append(f"Address: {current_user.address}")
        
    seller_info = " | ".join(contact_parts)
    
    notif = Notification(
        user_id=bid.buyer_id,
        type=NotificationType.bid_won,
        title="Official Winner Notification",
        message=f"The seller of \"{land.name}\" has officially notified you as the winner. Please accept or decline this offer in your My Biddings page. Seller contact: {seller_info}",
        link=f"/lands/{str(land.id)}"
    )
    await notif.insert()
    
    # Also mark bidding as ended/closed if it wasn't already
    bidding = await BiddingSetup.find_one(BiddingSetup.land_id == land.id)
    if bidding:
        bidding.winner_notified = True
        await bidding.save()
        
    return {"status": "winner notified successfully", "bid_status": "Offered"}


class BidResponseAction(BaseModel):
    action: str # "accept" or "decline"


async def _offer_next_highest_bidder(land: Land, excluded_bid_id: Optional[PydanticObjectId] = None):
    """Promote the next eligible highest bid to Offered and notify that buyer."""
    all_bids = await Bid.find(Bid.land_id == land.id).sort("-amount").to_list()

    next_bid = None
    for candidate in all_bids:
        if excluded_bid_id and str(candidate.id) == str(excluded_bid_id):
            continue
        if candidate.status in {BidStatus.pending, BidStatus.accepted}:
            next_bid = candidate
            break

    if not next_bid:
        return None

    next_bid.status = BidStatus.offered
    await next_bid.save()

    seller = await User.get(land.seller_id)
    contact_parts = []
    if seller:
        contact_parts = [f"Name: {seller.full_name}", f"Email: {seller.email}"]
        if seller.phone:
            contact_parts.append(f"Phone: {seller.phone}")
        if seller.address:
            contact_parts.append(f"Address: {seller.address}")
    seller_info = " | ".join(contact_parts) if contact_parts else "Seller contact will be shared after acceptance."

    notif = Notification(
        user_id=next_bid.buyer_id,
        type=NotificationType.bid_won,
        title="You Are the Next Highest Bidder",
        message=f"The previous winner declined for \"{land.name}\". You are now offered the winning position. Please accept or decline from your My Biddings page. Seller contact: {seller_info}",
        link=f"/lands/{str(land.id)}"
    )
    await notif.insert()

    return next_bid

@router.post("/{bid_id}/respond")
async def respond_to_bid(
    bid_id: PydanticObjectId,
    data: BidResponseAction,
    current_user: User = Depends(get_current_user)
):
    bid = await Bid.get(bid_id)
    if not bid or bid.buyer_id != current_user.id:
        raise HTTPException(status_code=404, detail="Bid not found or not yours")
    
    if bid.status != BidStatus.offered:
         raise HTTPException(status_code=400, detail="This bid is not currently offered to you")

    land = await Land.get(bid.land_id)
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")

    if data.action == "accept":
        bid.status = BidStatus.won
        await bid.save()

        # Mark all other active bids on this land as rejected since a final winner is confirmed.
        other_bids = await Bid.find(Bid.land_id == bid.land_id).to_list()
        for other in other_bids:
            if str(other.id) == str(bid.id):
                continue
            if other.status not in {BidStatus.rejected, BidStatus.declined, BidStatus.won}:
                other.status = BidStatus.rejected
                await other.save()

        # Close bidding on this land after a successful acceptance.
        bidding = await BiddingSetup.find_one(BiddingSetup.land_id == bid.land_id)
        if bidding:
            bidding.open_for_bidding = False
            bidding.winner_notified = True
            await bidding.save()

        if land:
            land.open_for_bidding = False
            await land.save()

        # Notify Seller
        notif = Notification(
            user_id=land.seller_id,
            type=NotificationType.general,
            title="Winning Offer Accepted!",
            message=f"The buyer for \"{land.name}\" has accepted your winning offer.",
            link=f"/dashboard/seller/bids"
        )
        await notif.insert()
        return {"status": "accepted"}

    elif data.action == "decline":
        bid.status = BidStatus.declined
        await bid.save()

        # Find land and auto-offer to the next highest eligible bidder.
        next_bid = await _offer_next_highest_bidder(land, excluded_bid_id=bid.id)

        if next_bid:
            next_buyer = await User.get(next_bid.buyer_id)
            buyer_name = next_buyer.full_name if next_buyer else "Next highest bidder"
            seller_message = (
                f"The current winner for \"{land.name}\" declined. "
                f"The offer has been automatically moved to {buyer_name} (Rs. {next_bid.amount:,.0f})."
            )
        else:
            seller_message = (
                f"The current winner for \"{land.name}\" has declined the offer. "
                "No other eligible bids remain."
            )

        notif = Notification(
            user_id=land.seller_id,
            type=NotificationType.general,
            title="Winning Offer Declined",
            message=seller_message,
            link=f"/dashboard/seller/bids"
        )
        await notif.insert()

        return {
            "status": "declined",
            "next_offered_bid_id": str(next_bid.id) if next_bid else None,
            "next_offered_buyer_id": str(next_bid.buyer_id) if next_bid else None,
        }
    
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'accept' or 'decline'.")


# ── Seller cancels an active bidding auction early ────────────────────────────
@router.post("/cancel-auction/{land_id}", status_code=200)
async def cancel_auction(
    land_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
):
    """Seller can cancel/close an active auction before the end time."""
    land = await Land.find_one(Land.id == land_id, Land.seller_id == current_user.id)
    if not land:
        raise HTTPException(status_code=404, detail="Land not found or you do not own it")

    bidding = await BiddingSetup.find_one(BiddingSetup.land_id == land_id)
    if not bidding or not bidding.open_for_bidding:
        raise HTTPException(status_code=400, detail="This land is not currently open for bidding")

    # Check auction hasn't already ended naturally
    if bidding.bidding_end:
        try:
            end_time = dateutil.parser.isoparse(bidding.bidding_end)
            if end_time.tzinfo is None:
                end_time = end_time.replace(tzinfo=timezone.utc)
            if end_time <= datetime.now(timezone.utc):
                raise HTTPException(status_code=400, detail="Auction has already ended")
        except ValueError:
            pass

    # Close the auction
    bidding.open_for_bidding = False
    bidding.bidding_end = datetime.now(timezone.utc).isoformat()
    bidding.winner_notified = True  # prevent auto-winner notification
    await bidding.save()

    # Also update the land model
    land.open_for_bidding = False
    await land.save()

    # Notify all bidders that the auction was cancelled
    bids_on_land = await Bid.find(Bid.land_id == land_id).to_list()
    notified_buyers = set()
    for bid in bids_on_land:
        if str(bid.buyer_id) not in notified_buyers:
            notif = Notification(
                user_id=bid.buyer_id,
                type=NotificationType.general,
                title="Auction Cancelled",
                message=f"The seller has cancelled the auction for \"{land.name}\". Your bid has been voided.",
                link=f"/lands/{str(land.id)}"
            )
            await notif.insert()
            notified_buyers.add(str(bid.buyer_id))

    return {"status": "auction cancelled", "land_id": str(land_id)}


# ── Buyer cancels their own bid (only while auction is still live) ─────────────
@router.delete("/{bid_id}", status_code=204)
async def delete_bid(
    bid_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
):
    bid = await Bid.find_one(Bid.id == bid_id, Bid.buyer_id == current_user.id)
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found or not yours")

    # Check if auction is still live — buyers cannot cancel after it ends
    bidding = await BiddingSetup.find_one(BiddingSetup.land_id == bid.land_id)
    if bidding and bidding.bidding_end:
        try:
            end_time = dateutil.parser.isoparse(bidding.bidding_end)
            if end_time.tzinfo is None:
                end_time = end_time.replace(tzinfo=timezone.utc)
            if end_time <= datetime.now(timezone.utc):
                raise HTTPException(status_code=400, detail="Auction has ended. You can no longer cancel this bid.")
        except ValueError:
            pass

    await bid.delete()

