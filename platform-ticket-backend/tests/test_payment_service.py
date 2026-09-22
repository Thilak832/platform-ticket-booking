"""
app/services/payment_service.py runs in mock mode whenever ENVIRONMENT=development
(set in .env for local dev, since there's no real Razorpay sandbox account).
These tests exercise that mock path.
"""
from app.services.payment_service import create_order, create_refund, verify_payment_signature


def test_create_order_converts_rupees_to_paise():
    order = create_order(amount_rupees=149.50, receipt="booking-123")
    assert order["amount"] == 14950
    assert order["currency"] == "INR"
    assert order["receipt"] == "booking-123"
    assert order["id"].startswith("order_dev_")


def test_create_order_rounds_fractional_paise():
    order = create_order(amount_rupees=99.999, receipt="r1")
    assert order["amount"] == 10000


def test_create_refund_converts_rupees_to_paise():
    refund = create_refund("pay_dev_abc", amount_rupees=45.00)
    assert refund["amount"] == 4500
    assert refund["status"] == "processed"
    assert refund["id"].startswith("rfnd_dev_")


def test_verify_payment_signature_accepts_matching_dev_signature():
    order_id, payment_id = "order_dev_abc123", "pay_dev_xyz789"
    signature = f"dev_signature_{order_id}_{payment_id}"
    assert verify_payment_signature(order_id, payment_id, signature) is True


def test_verify_payment_signature_rejects_mismatched_signature():
    assert verify_payment_signature("order_dev_abc123", "pay_dev_xyz789", "dev_signature_wrong") is False


def test_verify_payment_signature_rejects_signature_for_different_order():
    order_id, payment_id = "order_dev_abc123", "pay_dev_xyz789"
    signature = f"dev_signature_order_dev_OTHER_{payment_id}"
    assert verify_payment_signature(order_id, payment_id, signature) is False
