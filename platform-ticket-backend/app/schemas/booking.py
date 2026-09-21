import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import BookingPurpose, BookingStatus, PaymentMethod

DURATION_PRICING = {1: Decimal("50"), 2: Decimal("75"), 3: Decimal("100")}


class LocationVerifyRequest(BaseModel):
    station_id: uuid.UUID
    latitude: float
    longitude: float


class LocationVerifyResponse(BaseModel):
    verified: bool
    distance_meters: float
    required_meters: float = 100.0


class BookingCreate(BaseModel):
    station_id: uuid.UUID
    purpose: BookingPurpose
    duration_hours: Literal[1, 2, 3]
    quantity: int = Field(ge=1, le=5)
    latitude: float
    longitude: float
    payment_method: PaymentMethod = PaymentMethod.RAZORPAY


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    ticket_code: str
    station_id: uuid.UUID
    purpose: BookingPurpose
    duration_hours: int
    quantity: int
    total_amount: Decimal
    status: BookingStatus
    payment_method: PaymentMethod
    location_verified: bool
    qr_code: str | None
    valid_from: datetime | None
    valid_until: datetime | None
    used_at: datetime | None
    cancelled_at: datetime | None
    refund_amount: Decimal | None
    created_at: datetime


class RazorpayOrderOut(BaseModel):
    booking_id: uuid.UUID
    order_id: str
    amount: int
    currency: str = "INR"
    key_id: str


class BookingCreateResponse(BaseModel):
    booking: BookingOut
    razorpay: RazorpayOrderOut | None = None


class PaymentVerify(BaseModel):
    booking_id: uuid.UUID
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class CancelResponse(BaseModel):
    booking: BookingOut
    refund_amount: Decimal
