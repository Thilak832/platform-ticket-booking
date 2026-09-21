from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.deps import get_client_ip, get_current_user
from app.core.security import OTP_VALID_MINUTES, create_access_token, generate_otp, hash_password, verify_password
from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    OtpSentResponse,
    OtpVerifyRequest,
    ResetPasswordRequest,
    SignupRequest,
    Token,
    UserOut,
)
from app.services.activity_service import log_activity
from app.services.email_service import send_otp

router = APIRouter(prefix="/api/auth", tags=["auth"])

MAX_FAILED_ATTEMPTS = 5
LOCKOUT_MINUTES = 30


def _otp_debug(code: str) -> str | None:
    return code if settings.ENVIRONMENT == "development" else None


@router.post("/signup", response_model=OtpSentResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        log_activity(db, "SIGNUP_ATTEMPT", status="failed", ip_address=get_client_ip(request), details="email already exists")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    otp_code = generate_otp()
    user = User(
        email=payload.email,
        phone=payload.phone,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        is_verified=False,
        otp_code=otp_code,
        otp_expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_VALID_MINUTES),
        otp_purpose="signup",
    )
    db.add(user)
    db.commit()

    send_otp(user.email, otp_code, "signup")
    log_activity(db, "SIGNUP_ATTEMPT", user_id=user.id, ip_address=get_client_ip(request))

    return OtpSentResponse(message="OTP sent to your email. Valid for 10 minutes.", otp_debug=_otp_debug(otp_code))


@router.post("/verify-otp", response_model=Token)
def verify_otp(payload: OtpVerifyRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    ip = get_client_ip(request)

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    invalid = (
        not user.otp_code
        or user.otp_code != payload.otp_code
        or user.otp_purpose != payload.purpose
        or not user.otp_expires_at
        or user.otp_expires_at < datetime.now(timezone.utc)
    )

    if invalid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")

    user.otp_code = None
    user.otp_expires_at = None
    user.otp_purpose = None
    user.is_verified = True
    db.commit()

    log_activity(db, "SIGNUP_SUCCESS", user_id=user.id, ip_address=ip)

    token = create_access_token(subject=str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    ip = get_client_ip(request)

    if not user:
        log_activity(db, "LOGIN_ATTEMPT", status="failed", ip_address=ip, details="user not found")
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found. Sign up instead?")

    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        log_activity(db, "LOGIN_ATTEMPT", user_id=user.id, status="failed", ip_address=ip, details="account locked")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account locked due to too many failed attempts. Try again later.")

    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Please verify your email before logging in.")

    if not verify_password(payload.password, user.hashed_password):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=LOCKOUT_MINUTES)
            log_activity(db, "ACCOUNT_LOCKED_BRUTE_FORCE", user_id=user.id, status="failed", ip_address=ip)
            log_activity(db, "SUSPICIOUS_ACTIVITY", user_id=user.id, status="failed", ip_address=ip, details="brute force login")
        else:
            log_activity(db, "LOGIN_FAILED", user_id=user.id, status="failed", ip_address=ip, details=f"attempt {user.failed_login_attempts}")
        db.commit()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    log_activity(db, "LOGIN_SUCCESS", user_id=user.id, ip_address=ip)

    token = create_access_token(subject=str(user.id))
    return Token(access_token=token, user=UserOut.model_validate(user))


@router.post("/forgot-password", response_model=OtpSentResponse)
def forgot_password(payload: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    ip = get_client_ip(request)

    if not user:
        # Do not reveal whether the email is registered.
        log_activity(db, "FORGOT_PASSWORD_ATTEMPT", status="failed", ip_address=ip, details="user not found")
        return OtpSentResponse(message="If that email is registered, an OTP has been sent.")

    otp_code = generate_otp()
    user.otp_code = otp_code
    user.otp_expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_VALID_MINUTES)
    user.otp_purpose = "reset_password"
    db.commit()

    send_otp(user.email, otp_code, "password reset")
    log_activity(db, "FORGOT_PASSWORD_OTP_SENT", user_id=user.id, ip_address=ip)

    return OtpSentResponse(message="If that email is registered, an OTP has been sent.", otp_debug=_otp_debug(otp_code))


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    ip = get_client_ip(request)

    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")

    invalid = (
        not user.otp_code
        or user.otp_code != payload.otp_code
        or user.otp_purpose != "reset_password"
        or not user.otp_expires_at
        or user.otp_expires_at < datetime.now(timezone.utc)
    )

    if invalid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired OTP")

    user.hashed_password = hash_password(payload.new_password)
    user.otp_code = None
    user.otp_expires_at = None
    user.otp_purpose = None
    user.failed_login_attempts = 0
    user.locked_until = None
    db.commit()

    log_activity(db, "PASSWORD_RESET", user_id=user.id, ip_address=ip)

    return MessageResponse(message="Password reset successfully. You can now log in.")


@router.get("/me", response_model=UserOut)
def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
