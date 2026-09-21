import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import PaymentStatus, WalletTransactionType


class WalletBalanceOut(BaseModel):
    balance: Decimal


class WalletTopupCreate(BaseModel):
    amount: Decimal = Field(gt=0, le=50000)


class WalletTopupOrderOut(BaseModel):
    order_id: str
    amount: int
    currency: str = "INR"
    key_id: str


class WalletTopupVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class WalletTransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: WalletTransactionType
    amount: Decimal
    balance_after: Decimal
    status: PaymentStatus
    booking_id: uuid.UUID | None
    created_at: datetime
