import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.deps import get_client_ip, get_current_user, require_admin
from app.core.geo import distance_meters
from app.database import get_db
from app.config import settings
from app.models.booking import Booking
from app.models.enums import BookingStatus, PaymentMethod, PaymentStatus, WalletTransactionType
from app.models.payment import Payment
from app.models.station import Station
from app.models.user import User
from app.schemas.booking import (
    DURATION_PRICING,
    BookingCreate,
    BookingCreateResponse,
    BookingOut,
    CancelResponse,
    PaymentVerify,
    RazorpayOrderOut,
)
from app.services.activity_service import log_activity
from app.services.email_service import send_booking_confirmation, send_cancellation_confirmation
from app.services.payment_service import create_order, create_refund, verify_payment_signature
from app.services.qr_service import generate_qr_base64
from app.services.wallet_service import credit_wallet, debit_wallet

router = APIRouter(prefix="/api/bookings", tags=["bookings"])

REQUIRED_METERS = 100.0
CANCELLATION_CHARGE_PCT = Decimal("0.10")


def _refresh_expiry(booking: Booking, db: Session) -> Booking:
    if booking.status == BookingStatus.ACTIVE and booking.valid_until and booking.valid_until < datetime.now(timezone.utc):
        booking.status = BookingStatus.EXPIRED
        db.commit()
        db.refresh(booking)
    return booking


def _activate_booking(booking: Booking, db: Session) -> Booking:
    now = datetime.now(timezone.utc)
    booking.status = BookingStatus.ACTIVE
    booking.valid_from = now
    booking.valid_until = now + timedelta(hours=booking.duration_hours)
    booking.qr_code = generate_qr_base64(f"PT:{booking.id}:{booking.ticket_code}")
    db.commit()
    db.refresh(booking)
    return booking


@router.post("", response_model=BookingCreateResponse, status_code=status.HTTP_201_CREATED)
def create_booking(payload: BookingCreate, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    station = db.get(Station, payload.station_id)
    if not station or not station.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Station not found")

    ip = get_client_ip(request)
    dist = distance_meters(payload.latitude, payload.longitude, float(station.latitude), float(station.longitude))
    location_verified = dist <= REQUIRED_METERS

    if not location_verified:
        log_activity(db, "LOCATION_VERIFY", user_id=current_user.id, status="failed", ip_address=ip, details=f"distance={dist:.0f}m")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You are {dist:.0f}m away from the station. Required: within {REQUIRED_METERS:.0f}m",
        )

    log_activity(db, "LOCATION_VERIFY", user_id=current_user.id, ip_address=ip, details=f"distance={dist:.0f}m")

    unit_price = DURATION_PRICING[payload.duration_hours]
    total_amount = unit_price * payload.quantity

    booking = Booking(
        user_id=current_user.id,
        station_id=station.id,
        purpose=payload.purpose,
        duration_hours=payload.duration_hours,
        quantity=payload.quantity,
        total_amount=total_amount,
        location_verified=True,
        user_latitude=payload.latitude,
        user_longitude=payload.longitude,
        status=BookingStatus.PENDING,
        payment_method=payload.payment_method,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)

    if payload.payment_method == PaymentMethod.WALLET:
        try:
            debit_wallet(db, current_user, total_amount, WalletTransactionType.BOOKING_PAYMENT, booking_id=booking.id)
        except ValueError:
            booking.status = BookingStatus.FAILED
            db.commit()
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient wallet balance")

        booking = _activate_booking(booking, db)

        log_activity(db, "PAYMENT_SUCCESS", user_id=current_user.id, ip_address=ip, details=f"amount={total_amount} method=wallet")
        log_activity(db, "TICKET_ISSUED", user_id=current_user.id, ip_address=ip, details=str(booking.ticket_code))

        send_booking_confirmation(
            current_user.email, station.name, booking.quantity, booking.ticket_code, booking.valid_until.isoformat()
        )

        return BookingCreateResponse(booking=booking)

    order = create_order(amount_rupees=float(total_amount), receipt=str(booking.id))
    booking.razorpay_order_id = order["id"]
    db.commit()
    db.refresh(booking)

    db.add(Payment(booking_id=booking.id, razorpay_order_id=order["id"], amount=total_amount, status=PaymentStatus.CREATED))
    db.commit()

    log_activity(db, "PAYMENT_ATTEMPT", user_id=current_user.id, ip_address=ip, details=f"amount={total_amount}")

    return BookingCreateResponse(
        booking=booking,
        razorpay=RazorpayOrderOut(
            booking_id=booking.id,
            order_id=order["id"],
            amount=order["amount"],
            currency=order["currency"],
            key_id=settings.RAZORPAY_KEY_ID,
        ),
    )


@router.post("/verify-payment", response_model=BookingOut)
def verify_payment(payload: PaymentVerify, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.get(Booking, payload.booking_id)
    ip = get_client_ip(request)

    if not booking or booking.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Booking is not pending")
    if booking.razorpay_order_id != payload.razorpay_order_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order mismatch")

    payment = db.query(Payment).filter(Payment.booking_id == booking.id).order_by(Payment.created_at.desc()).first()

    if not verify_payment_signature(payload.razorpay_order_id, payload.razorpay_payment_id, payload.razorpay_signature):
        booking.status = BookingStatus.FAILED
        if payment:
            payment.status = PaymentStatus.FAILED
            payment.error_code = "SIGNATURE_MISMATCH"
        db.commit()
        log_activity(db, "PAYMENT_SUCCESS", user_id=current_user.id, status="failed", ip_address=ip, details="signature mismatch")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment signature verification failed")

    booking.razorpay_payment_id = payload.razorpay_payment_id
    if payment:
        payment.razorpay_payment_id = payload.razorpay_payment_id
        payment.status = PaymentStatus.SUCCESS

    booking = _activate_booking(booking, db)

    log_activity(db, "PAYMENT_SUCCESS", user_id=current_user.id, ip_address=ip, details=f"amount={booking.total_amount} method=razorpay")
    log_activity(db, "TICKET_ISSUED", user_id=current_user.id, ip_address=ip, details=str(booking.ticket_code))

    send_booking_confirmation(
        current_user.email, booking.station.name, booking.quantity, booking.ticket_code, booking.valid_until.isoformat()
    )

    return booking


@router.get("/me", response_model=list[BookingOut])
def list_my_bookings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return [_refresh_expiry(b, db) for b in bookings]


@router.post("/{booking_id}/cancel", response_model=CancelResponse)
def cancel_booking(booking_id: uuid.UUID, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    ip = get_client_ip(request)

    if not booking or booking.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    booking = _refresh_expiry(booking, db)

    if booking.status == BookingStatus.USED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ticket already used. No refund available.")
    if booking.status == BookingStatus.EXPIRED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Ticket expired. Cancellation period over.")
    if booking.status != BookingStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only active bookings can be cancelled")

    refund_amount = (booking.total_amount * (Decimal("1") - CANCELLATION_CHARGE_PCT)).quantize(Decimal("0.01"))

    if booking.payment_method == PaymentMethod.WALLET:
        credit_wallet(db, current_user, refund_amount, WalletTransactionType.BOOKING_REFUND, booking_id=booking.id)
    else:
        try:
            if booking.razorpay_payment_id:
                create_refund(booking.razorpay_payment_id, float(refund_amount))
        except Exception:
            pass

    booking.status = BookingStatus.CANCELLED
    booking.cancelled_at = datetime.now(timezone.utc)
    booking.refund_amount = refund_amount
    db.commit()
    db.refresh(booking)

    log_activity(db, "TICKET_CANCELLED", user_id=current_user.id, ip_address=ip, details=f"refund={refund_amount}")

    send_cancellation_confirmation(current_user.email, booking.station.name, float(refund_amount), booking.ticket_code)

    return CancelResponse(booking=booking, refund_amount=refund_amount)


@router.post("/{booking_id}/scan", response_model=BookingOut)
def scan_ticket(booking_id: uuid.UUID, _admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    booking = db.get(Booking, booking_id)
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    booking = _refresh_expiry(booking, db)

    if booking.status != BookingStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Ticket is {booking.status.value}, cannot be scanned")

    booking.status = BookingStatus.USED
    booking.used_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(booking)

    log_activity(db, "TICKET_USED", user_id=booking.user_id, details=str(booking.station_id))

    return booking
