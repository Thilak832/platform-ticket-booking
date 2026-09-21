import uuid
from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.enums import PaymentStatus, WalletTransactionType
from app.models.user import User
from app.models.wallet_transaction import WalletTransaction


def create_pending_topup(db: Session, user: User, amount: Decimal, razorpay_order_id: str) -> WalletTransaction:
    txn = WalletTransaction(
        user_id=user.id,
        type=WalletTransactionType.TOPUP,
        amount=amount,
        balance_after=user.wallet_balance,
        status=PaymentStatus.CREATED,
        razorpay_order_id=razorpay_order_id,
    )
    db.add(txn)
    db.flush()
    return txn


def complete_topup(db: Session, txn: WalletTransaction, user: User, razorpay_payment_id: str) -> WalletTransaction:
    user.wallet_balance = Decimal(user.wallet_balance) + Decimal(txn.amount)
    txn.status = PaymentStatus.SUCCESS
    txn.razorpay_payment_id = razorpay_payment_id
    txn.balance_after = user.wallet_balance
    db.flush()
    return txn


def credit_wallet(
    db: Session,
    user: User,
    amount: Decimal,
    txn_type: WalletTransactionType,
    booking_id: uuid.UUID | None = None,
    razorpay_order_id: str | None = None,
    razorpay_payment_id: str | None = None,
) -> WalletTransaction:
    user.wallet_balance = Decimal(user.wallet_balance) + amount
    txn = WalletTransaction(
        user_id=user.id,
        booking_id=booking_id,
        type=txn_type,
        amount=amount,
        balance_after=user.wallet_balance,
        status=PaymentStatus.SUCCESS,
        razorpay_order_id=razorpay_order_id,
        razorpay_payment_id=razorpay_payment_id,
    )
    db.add(txn)
    db.flush()
    return txn


def debit_wallet(
    db: Session,
    user: User,
    amount: Decimal,
    txn_type: WalletTransactionType,
    booking_id: uuid.UUID | None = None,
) -> WalletTransaction:
    if Decimal(user.wallet_balance) < amount:
        raise ValueError("Insufficient wallet balance")

    user.wallet_balance = Decimal(user.wallet_balance) - amount
    txn = WalletTransaction(
        user_id=user.id,
        booking_id=booking_id,
        type=txn_type,
        amount=-amount,
        balance_after=user.wallet_balance,
        status=PaymentStatus.SUCCESS,
    )
    db.add(txn)
    db.flush()
    return txn
