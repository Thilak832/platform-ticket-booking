"""
Unit tests for app/services/wallet_service.py business rules, isolated from
the database with a lightweight fake Session (only .add/.flush are used by
the service functions, so a real SQLAlchemy Session/engine isn't needed).
"""
from decimal import Decimal

import pytest

from app.models.enums import PaymentStatus, WalletTransactionType
from app.services.wallet_service import complete_topup, create_pending_topup, credit_wallet, debit_wallet


class FakeUser:
    def __init__(self, wallet_balance="0.00"):
        self.id = "user-1"
        self.wallet_balance = Decimal(wallet_balance)


class FakeSession:
    def __init__(self):
        self.added = []

    def add(self, obj):
        self.added.append(obj)

    def flush(self):
        pass


def test_credit_wallet_increases_balance():
    db = FakeSession()
    user = FakeUser("100.00")

    txn = credit_wallet(db, user, Decimal("50.00"), WalletTransactionType.TOPUP)

    assert user.wallet_balance == Decimal("150.00")
    assert txn.balance_after == Decimal("150.00")
    assert txn.status == PaymentStatus.SUCCESS
    assert txn in db.added


def test_debit_wallet_decreases_balance():
    db = FakeSession()
    user = FakeUser("100.00")

    txn = debit_wallet(db, user, Decimal("30.00"), WalletTransactionType.BOOKING_PAYMENT)

    assert user.wallet_balance == Decimal("70.00")
    assert txn.amount == Decimal("-30.00")
    assert txn.balance_after == Decimal("70.00")


def test_debit_wallet_rejects_insufficient_balance():
    db = FakeSession()
    user = FakeUser("20.00")

    with pytest.raises(ValueError, match="Insufficient wallet balance"):
        debit_wallet(db, user, Decimal("50.00"), WalletTransactionType.BOOKING_PAYMENT)

    # Balance must be unchanged after a rejected debit.
    assert user.wallet_balance == Decimal("20.00")


def test_debit_wallet_allows_exact_balance():
    db = FakeSession()
    user = FakeUser("50.00")

    debit_wallet(db, user, Decimal("50.00"), WalletTransactionType.BOOKING_PAYMENT)

    assert user.wallet_balance == Decimal("0.00")


def test_create_pending_topup_snapshots_balance_before_credit():
    db = FakeSession()
    user = FakeUser("100.00")

    txn = create_pending_topup(db, user, Decimal("200.00"), "order_dev_abc123")

    assert txn.status == PaymentStatus.CREATED
    assert txn.balance_after == Decimal("100.00")  # not credited yet
    assert user.wallet_balance == Decimal("100.00")


def test_complete_topup_credits_balance_and_marks_success():
    db = FakeSession()
    user = FakeUser("100.00")
    pending = create_pending_topup(db, user, Decimal("200.00"), "order_dev_abc123")

    completed = complete_topup(db, pending, user, "pay_dev_xyz789")

    assert user.wallet_balance == Decimal("300.00")
    assert completed.status == PaymentStatus.SUCCESS
    assert completed.balance_after == Decimal("300.00")
    assert completed.razorpay_payment_id == "pay_dev_xyz789"
