import hmac
import hashlib
import uuid

import razorpay

from app.config import settings

_client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

# Local dev has no real Razorpay sandbox account (RAZORPAY_KEY_ID/SECRET are placeholders),
# so mock the gateway locally and only call the real API outside development.
_MOCK_MODE = settings.ENVIRONMENT == "development"


def create_order(amount_rupees: float, receipt: str) -> dict:
    amount_paise = int(round(amount_rupees * 100))

    if _MOCK_MODE:
        return {
            "id": f"order_dev_{uuid.uuid4().hex[:16]}",
            "amount": amount_paise,
            "currency": "INR",
            "receipt": receipt,
            "status": "created",
        }

    return _client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": receipt,
        "payment_capture": 1,
    })


def create_refund(payment_id: str, amount_rupees: float) -> dict:
    amount_paise = int(round(amount_rupees * 100))

    if _MOCK_MODE:
        return {"id": f"rfnd_dev_{uuid.uuid4().hex[:16]}", "amount": amount_paise, "status": "processed"}

    return _client.payment.refund(payment_id, {"amount": amount_paise})


def verify_payment_signature(order_id: str, payment_id: str, signature: str) -> bool:
    if _MOCK_MODE:
        return signature == f"dev_signature_{order_id}_{payment_id}"

    body = f"{order_id}|{payment_id}"
    expected_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        body.encode(),
        hashlib.sha256,
    ).hexdigest()
    return hmac.compare_digest(expected_signature, signature)
