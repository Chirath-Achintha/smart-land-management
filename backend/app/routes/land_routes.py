from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form
import os
import uuid
import shutil
import re
from typing import List
from datetime import datetime
from urllib.parse import urlparse
from beanie import PydanticObjectId
from beanie.operators import In

from app.models.land_model import Land

from app.models.user_model import User
from app.models.bidding_setup_model import BiddingSetup
from app.models.notification_model import Notification, NotificationType
from app.schemas.land_schema import (
    LandCreate,
    LandUpdate,
    LandResponse,
    LandVerificationUpdate,
    BiddingSetupBase,
    LandPricePredictionRequest,
    LandPricePredictionResponse,
)
from app.routes.auth_routes import get_current_user
from app.services.anomaly_detection_service import anomaly_service
from app.services.price_prediction_service import price_prediction_service

router = APIRouter(prefix="/lands", tags=["Lands"])
UPLOAD_ROOT = os.path.abspath(os.path.join("static", "uploads"))


def sanitize_land_folder_name(land_name: str) -> str:
    raw_name = (land_name or "").strip().lower()
    if not raw_name:
        return "untitled-land"

    safe_name = re.sub(r"[^a-z0-9]+", "-", raw_name).strip("-")
    return (safe_name[:80] or "untitled-land")


def get_local_uploaded_image_paths(image_url_value: str) -> List[str]:
    if not image_url_value:
        return []

    resolved_paths: List[str] = []
    seen = set()

    for raw_url in [u.strip() for u in image_url_value.split(",") if u.strip()]:
        parsed = urlparse(raw_url)
        path = (parsed.path or raw_url).replace("\\", "/").strip()

        rel_path = None
        if "/static/uploads/" in path:
            rel_path = path.split("/static/uploads/", 1)[1].lstrip("/")
        elif not parsed.scheme and not parsed.netloc:
            rel_path = os.path.basename(path)

        if not rel_path:
            continue

        abs_path = os.path.abspath(os.path.join(UPLOAD_ROOT, rel_path))
        try:
            if os.path.commonpath([UPLOAD_ROOT, abs_path]) != UPLOAD_ROOT:
                continue
        except ValueError:
            continue

        if abs_path not in seen:
            seen.add(abs_path)
            resolved_paths.append(abs_path)

    return resolved_paths


def get_local_uploaded_image_dirs(image_url_value: str) -> List[str]:
    dirs: List[str] = []
    seen = set()

    for image_path in get_local_uploaded_image_paths(image_url_value):
        image_dir = os.path.dirname(image_path)
        if not image_dir:
            continue
        try:
            if os.path.commonpath([UPLOAD_ROOT, image_dir]) != UPLOAD_ROOT:
                continue
        except ValueError:
            continue

        if image_dir not in seen:
            seen.add(image_dir)
            dirs.append(image_dir)

    return dirs


async def attach_bidding_data(land: Land) -> Land:
    bidding = await BiddingSetup.find_one(BiddingSetup.land_id == land.id)
    if bidding:
        land.open_for_bidding = bidding.open_for_bidding
        land.starting_bid = bidding.starting_bid
        land.bidding_start = bidding.bidding_start
        land.bidding_end = bidding.bidding_end
        land.bidding_setup = bidding
    return land


def serialize_land_for_admin(land: Land) -> dict:
    return {
        "id": str(land.id),
        "seller_id": str(land.seller_id),
        "name": land.name,
        "district": land.district,
        "village": land.village,
        "perches": land.perches,
        "price_per_perch": land.price_per_perch,
        "total_price": land.total_price,
        "land_type": str(land.land_type),
        "status": str(land.status),
        "road_access": land.road_access,
        "mobile_number_1": land.mobile_number_1,
        "mobile_number_2": land.mobile_number_2,
        "electricity": land.electricity,
        "water": land.water,
        "image_url": land.image_url,
        "is_verified": land.is_verified,
        "review_status": land.review_status,
        "verified_by": str(land.verified_by) if land.verified_by else None,
        "verified_at": land.verified_at,
        "verification_note": land.verification_note,
        "created_at": land.created_at,
        "open_for_bidding": bool(land.open_for_bidding),
        "starting_bid": land.starting_bid,
        "bidding_start": land.bidding_start,
        "bidding_end": land.bidding_end,
        "is_anomaly": getattr(land, 'is_anomaly', False),
        "anomaly_score": getattr(land, 'anomaly_score', 0.0),
        "price_status": getattr(land, 'price_status', 'normal'),
    }


def ensure_admin(user: User):
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    land_name: str = Form(...)
):
    if not (land_name or "").strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="land_name is required"
        )

    # Create /static/uploads/{land-name} and keep each land's files grouped.
    land_folder = sanitize_land_folder_name(land_name)
    land_upload_root = os.path.join(UPLOAD_ROOT, land_folder)
    os.makedirs(land_upload_root, exist_ok=True)

    # Generate unique filename inside that land folder
    file_extension = os.path.splitext(file.filename or "")[1]
    filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(land_upload_root, filename)
    
    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Return absolute URL (assuming backend runs on localhost:8000)
    # In production, this should be the actual server URL
    url = f"http://localhost:8000/static/uploads/{land_folder}/{filename}"
    return {"url": url}


# ── Create a new land listing (seller only) ───────────────────────────────────
@router.post("/", response_model=LandResponse, status_code=status.HTTP_201_CREATED)
async def create_land(
    data: LandCreate,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "seller":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only sellers can create land listings")

    # Run AI Anomaly Detection
    anomaly_result = anomaly_service.detect_anomaly(
        district=data.district,
        land_type=data.land_type,
        road_access=data.road_access or "no",
        electricity="available" if data.electricity else "not available",
        water="available" if data.water else "not available",
        distance_to_town=data.distance_to_town_km,
        price_per_perch=data.price_per_perch
    )

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
        mobile_number_1=data.mobile_number_1,
        mobile_number_2=data.mobile_number_2,
        electricity=data.electricity,
        water=data.water,
        distance_to_town_km=data.distance_to_town_km,
        image_url=data.image_url,
        is_verified=False,
        review_status="pending",
        is_anomaly=anomaly_result.get("is_anomaly"),
        anomaly_score=anomaly_result.get("anomaly_score"),
        price_status=anomaly_result.get("price_status")
    )
    await land.insert()
    
    # Initialize empty bidding setup for the land
    bidding = BiddingSetup(land_id=land.id)
    await bidding.insert()
    
    return land


@router.post("/analyze")
async def analyze_land_price(
    data: LandCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Returns AI anomaly detection results without saving the land listing.
    Used for live feedback in the frontend.
    """
    if current_user.role != "seller":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only sellers can use the AI analysis tool")

    anomaly_result = anomaly_service.detect_anomaly(
        district=data.district,
        land_type=data.land_type,
        road_access=data.road_access or "no",
        electricity="available" if data.electricity else "not available",
        water="available" if data.water else "not available",
        distance_to_town=data.distance_to_town_km,
        price_per_perch=data.price_per_perch
    )

    return anomaly_result


@router.post("/predict-price", response_model=LandPricePredictionResponse)
async def predict_land_price(
    data: LandPricePredictionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Predicts an estimated market value based on the trained price model.
    Sellers can use this before creating or updating a listing.
    """
    if current_user.role != "seller":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only sellers can use the AI price predictor")

    prediction = price_prediction_service.predict_price(
        district=data.district,
        village=data.village,
        perches=data.perches,
        land_type=data.land_type,
        road_access=data.road_access or "",
        electricity=data.electricity,
        water=data.water,
        distance_to_town_km=data.distance_to_town_km,
        distance_to_city_km=data.distance_to_city_km,
        days_since_published=0,
        random_feature=data.random_feature,
        listed_price_per_perch=data.listed_price_per_perch,
    )

    if prediction.get("error"):
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=prediction["error"])

    return prediction


# ── Get all Available lands (public, for buyers) ──────────────────────────────
@router.get("/", response_model=List[LandResponse])
async def get_all_lands():
    # Public view: Fetch all lands from DB with status Available or Reserved.
    # Only real DB records are returned — no hardcoded or fake data.
    lands = await Land.find(
        In(Land.status, ["Available", "Reserved"]),
        Land.review_status == "approved"
    ).sort("-created_at").to_list()
    # Attach bidding setup to each land for the response
    for land in lands:
        await attach_bidding_data(land)
    return lands


# ── Get the current seller's own listings ─────────────────────────────────────
@router.get("/my", response_model=List[LandResponse])
async def get_my_lands(
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "seller":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only sellers can view seller listings")

    lands = await Land.find(Land.seller_id == current_user.id).sort("-created_at").to_list()
    for land in lands:
        await attach_bidding_data(land)
    return lands


# ── Admin: Get all lands (verified and unverified) ──────────────────────────
@router.get("/admin/all", response_model=List[LandResponse])
async def admin_get_all_lands(
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)
    lands = await Land.find_all().sort("-created_at").to_list()
    for land in lands:
        await attach_bidding_data(land)
    return lands


# ── Admin: Get lands grouped by seller ───────────────────────────────────────
@router.get("/admin/by-seller")
async def admin_get_lands_by_seller(
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    sellers = await User.find(User.role == "seller").to_list()
    grouped = []

    for seller in sellers:
        # Queue should only include pending (not yet verified) lands.
        lands = await Land.find(
            Land.seller_id == seller.id,
            Land.review_status == "pending"
        ).sort("-created_at").to_list()
        for land in lands:
            await attach_bidding_data(land)

        if not lands:
            continue

        grouped.append({
            "seller_id": str(seller.id),
            "seller_name": seller.full_name,
            "seller_email": str(seller.email),
            "total_lands": len(lands),
            "verified_lands": 0,
            "pending_lands": len(lands),
            "lands": [serialize_land_for_admin(land) for land in lands]
        })

    return grouped


# ── Admin: Verify/Reject a land ──────────────────────────────────────────────
@router.patch("/{land_id}/verify")
async def admin_verify_land(
    land_id: PydanticObjectId,
    data: LandVerificationUpdate,
    current_user: User = Depends(get_current_user)
):
    ensure_admin(current_user)

    land = await Land.get(land_id)
    if not land:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Land not found")

    if not data.is_verified and not (data.verification_note and data.verification_note.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Rejection message is required"
        )

    land.is_verified = data.is_verified
    land.review_status = "approved" if data.is_verified else "rejected"
    land.verification_note = data.verification_note.strip() if data.verification_note else None
    land.verified_at = datetime.utcnow() if data.is_verified else None
    land.verified_by = current_user.id if data.is_verified else None
    land.updated_at = datetime.utcnow()
    await land.save()

    if not data.is_verified:
        await Notification(
            user_id=land.seller_id,
            type=NotificationType.general,
            title="Land Verification Rejected",
            message=f"Your listing '{land.name}' was rejected by admin. Reason: {land.verification_note}",
            link="/dashboard/seller/listings"
        ).insert()

        return {"status": "rejected", "land_id": str(land_id)}

    await attach_bidding_data(land)
    return {"status": "approved", "land_id": str(land.id)}


# ── Get a single land by ID ───────────────────────────────────────────────────
@router.get("/{land_id}", response_model=LandResponse)
async def get_land(land_id: PydanticObjectId):
    # Fetch any land from DB by ID — no verification filter so all real DB lands are accessible.
    land = await Land.find_one(
        Land.id == land_id,
        In(Land.status, ["Available", "Reserved"]),
        Land.review_status == "approved"
    )
    if not land:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Land not found")

    await attach_bidding_data(land)
        
    return land


# ── Update a land listing (seller only, must own it) ─────────────────────────
@router.put("/{land_id}", response_model=LandResponse)
async def update_land(
    land_id: PydanticObjectId,
    data: dict, # Using dict to handle mixed fields flexibly durante transition
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["seller", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only sellers or admins can update land listings")

    if current_user.role == "seller":
        land = await Land.find_one(Land.id == land_id, Land.seller_id == current_user.id)
        if not land:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Land not found or not yours")
    else:
        land = await Land.find_one(Land.id == land_id)
        if not land:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Land not found")

    bidding = await BiddingSetup.find_one(BiddingSetup.land_id == land_id)

    if "image_url" in data and data["image_url"]:
        image_urls = [u.strip() for u in str(data["image_url"]).split(",") if u.strip()]
        if len(image_urls) > 5:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A maximum of 5 images is allowed")
        data["image_url"] = ",".join(image_urls)

    # Split fields into Land and BiddingSetup
    bidding_fields = ['open_for_bidding', 'starting_bid', 'bidding_start', 'bidding_end']
    
    land_fields_updated = False
    bidding_fields_updated = False

    for field, value in data.items():
        if field in bidding_fields:
            if bidding:
                setattr(bidding, field, value)
            else:
                bidding = BiddingSetup(land_id=land.id, **{field: value})
                await bidding.insert()
            bidding_fields_updated = True
        elif hasattr(land, field):
            setattr(land, field, value)
            land_fields_updated = True

    if bidding:
        await bidding.save()

    # Recalculate total price if perches/price_per_perch changed
    if 'perches' in data or 'price_per_perch' in data:
        p = data.get('perches', land.perches)
        ppp = data.get('price_per_perch', land.price_per_perch)
        land.total_price = p * ppp

    if land_fields_updated or bidding_fields_updated:
        # Only seller-side edits require re-verification. Admin edits keep current review state.
        if current_user.role == "seller":
            land.is_verified = False
            land.review_status = "pending"
            land.verified_by = None
            land.verified_at = None
            land.verification_note = None

    land.updated_at = datetime.utcnow()

    # Update AI Anomaly Detection if relevant fields changed
    trigger_fields = ['district', 'land_type', 'road_access', 'electricity', 'water', 'distance_to_town_km', 'price_per_perch']
    if any(field in data for field in trigger_fields):
        # Run AI Anomaly Detection
        anomaly_result = anomaly_service.detect_anomaly(
            district=land.district,
            land_type=land.land_type,
            road_access=land.road_access or "no",
            electricity="available" if land.electricity else "not available",
            water="available" if land.water else "not available",
            distance_to_town=land.distance_to_town_km,
            price_per_perch=land.price_per_perch
        )
        land.is_anomaly = anomaly_result.get("is_anomaly")
        land.anomaly_score = anomaly_result.get("anomaly_score")
        land.price_status = anomaly_result.get("price_status")

    await land.save()
    
    # Attach bidding to response
    if bidding:
        await attach_bidding_data(land)
        
    return land


# ── Delete a land listing (seller only, must own it) ─────────────────────────
@router.delete("/{land_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_land(
    land_id: PydanticObjectId,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["seller", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only sellers or admins can delete land listings")

    if current_user.role == "seller":
        land = await Land.find_one(Land.id == land_id, Land.seller_id == current_user.id)
        if not land:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Land not found or not yours")
    else:
        land = await Land.find_one(Land.id == land_id)
        if not land:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Land not found")

    image_paths = get_local_uploaded_image_paths(land.image_url or "")
    image_dirs = get_local_uploaded_image_dirs(land.image_url or "")
    
    # Also delete associated bidding setup
    bidding = await BiddingSetup.find_one(BiddingSetup.land_id == land_id)
    if bidding:
        await bidding.delete()
        
    await land.delete()

    for image_path in image_paths:
        if os.path.isfile(image_path):
            try:
                os.remove(image_path)
            except OSError:
                # Ignore filesystem errors so land deletion is not blocked.
                pass

    # Remove land image folders that are no longer referenced by any other listing.
    if image_dirs:
        remaining_lands = await Land.find(Land.image_url != None).to_list()
        used_dirs = set()
        for remaining_land in remaining_lands:
            for folder_path in get_local_uploaded_image_dirs(remaining_land.image_url or ""):
                used_dirs.add(folder_path)

        for folder_path in image_dirs:
            if folder_path in used_dirs:
                continue
            if os.path.isdir(folder_path):
                try:
                    shutil.rmtree(folder_path)
                except OSError:
                    # Ignore filesystem errors so land deletion is not blocked.
                    pass
