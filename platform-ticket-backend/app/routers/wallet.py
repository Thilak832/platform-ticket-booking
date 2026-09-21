from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.config import settings
from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.wallet_transaction import WalletTransaction
from app.models.enums import PaymentStatus
from app.schemas.wallet import (
    WalletBalanceOut,
    WalletTopupCreate,
    WalletTopupOrderOut,
    WalletTopupVerify,
    WalletTransactionOut,
)
from app.services.activity_service import log_activity
from app.services.payment_service import create_order, verify_payment_signature
from app.services.wallet_service import complete_topup, create_pending_topup

router = APIRouter(prefix="/api/wallet", tags=["wallet"])


@router.get("/balance", response_model=WalletBalanceOut)
def get_balance(current_user: User = Depends(get_current_user)):
    return WalletBalanceOut(balance=current_user.wallet_balance)


@router.get("/transactions", response_model=list[WalletTransactionOut])
def list_transactions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return (
        db.query(WalletTransaction)
        .filter(WalletTransaction.user_id == current_user.id)
        .order_by(WalletTransaction.created_at.desc())
        .all()
    )


@router.post("/topup", response_model=WalletTopupOrderOut, status_code=status.HTTP_201_CREATED)
def create_topup(payload: WalletTopupCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    order = create_order(amount_rupees=float(payload.amount), receipt=f"topup-{current_user.id}")
    create_pending_topup(db, current_user, payload.amount, order["id"])
    db.commit()

    return WalletTopupOrderOut(order_id=order["id"], amount=order["amount"], currency=order["currency"], key_id=settings.RAZORPAY_KEY_ID)


@router.post("/topup/verify", response_model=WalletBalanceOut)
def verify_topup(payload: WalletTopupVerify, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    txn = (
        db.query(WalletTransaction)
        .filter(
            WalletTransaction.razorpay_order_id == payload.razorpay_order_id,
            WalletTransaction.user_id == current_user.id,
            WalletTransaction.status == PaymentStatus.CREATED,
        )
        .first()
    )
    if not txn:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Top-up order not found")

    if not verify_payment_signature(payload.razorpay_order_id, payload.razorpay_payment_id, payload.razorpay_signature):
        txn.status = PaymentStatus.FAILED
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment signature verification failed")

    complete_topup(db, txn, current_user, payload.razorpay_payment_id)
    db.commit()

    log_activity(db, "WALLET_TOPUP", user_id=current_user.id, details=f"amount={txn.amount}")

    return WalletBalanceOut(balance=current_user.wallet_balance)
