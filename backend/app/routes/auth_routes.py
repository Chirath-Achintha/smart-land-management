from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta

from app.models.user_model import User

from app.schemas.user_schema import (
    UserRegister, UserLogin, UserResponse, Token,
    ForgotPasswordRequest, VerifyOtpRequest, ResetPasswordRequest
)
from app.core.config import settings
from app.utils.email_utils import send_otp_email

import random

import bcrypt
from jose import jwt, JWTError

router = APIRouter(prefix="/auth", tags=["Authentication"])
bearer_scheme = HTTPBearer()

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
) -> User:
    """Decode JWT token and return the current user from DB."""
    try:
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired or invalid")

    user = await User.find_one(User.email == email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


# ─── Register ────────────────────────────────────────────────────────────────

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    # Validate passwords match
    if user_data.password != user_data.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")

    # Check if email already in use
    if await User.find_one(User.email == user_data.email):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    # Check if NIC already in use
    if await User.find_one(User.nic_number == user_data.nic_number):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="NIC number already registered")

    # Create and save user
    new_user = User(
        full_name=user_data.full_name,
        nic_number=user_data.nic_number,
        role=user_data.role,
        address=user_data.address,
        email=user_data.email,
        hashed_password=hash_password(user_data.password)
    )
    await new_user.insert()
    return new_user


# ─── Login ───────────────────────────────────────────────────────────────────

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    user = await User.find_one(User.email == credentials.email)

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    # In Beanie, user.id is a PydanticObjectId. Convert it to string for the token payload
    token_id = str(user.id)
    token = create_access_token(data={"sub": user.email, "role": user.role, "id": token_id})
    return Token(access_token=token, token_type="bearer", user=UserResponse.model_validate(user))


# ─── Get Current User (from DB) ──────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Returns the logged-in user's full profile from the database."""
    return current_user

# ─── Password Reset Flow ─────────────────────────────────────────────────────

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
async def forgot_password(request: ForgotPasswordRequest):
    user = await User.find_one(User.email == request.email)
    if not user:
        # We don't want to leak if an email exists or not directly, just return success
        return {"message": "If that email is registered, you will receive an OTP shortly."}
    
    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    
    # Set OTP and expiry (5 minutes)
    user.reset_otp = otp
    user.reset_otp_expiry = datetime.utcnow() + timedelta(minutes=5)
    await user.save()
    
    # Send email
    send_otp_email(user.email, otp)
    
    return {"message": "OTP sent to your email."}

@router.post("/verify-otp", status_code=status.HTTP_200_OK)
async def verify_otp(request: VerifyOtpRequest):
    user = await User.find_one(User.email == request.email)
    if not user or user.reset_otp != request.otp:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")
    
    if not user.reset_otp_expiry or user.reset_otp_expiry < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP has expired")
        
    return {"message": "OTP verified successfully. You can now reset your password."}

@router.post("/reset-password", status_code=status.HTTP_200_OK)
async def reset_password(request: ResetPasswordRequest):
    if request.new_password != request.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")
        
    user = await User.find_one(User.email == request.email)
    
    # Extra check for OTP to ensure secure reset
    if not user or user.reset_otp != request.otp or not user.reset_otp_expiry or user.reset_otp_expiry < datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")
        
    # Update password and clear OTP
    user.hashed_password = hash_password(request.new_password)
    user.reset_otp = None
    user.reset_otp_expiry = None
    await user.save()
    
    return {"message": "Password reset successfully. You can now login with your new password."}
