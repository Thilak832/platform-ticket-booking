"""
Pricing and refund-calculation rules used by app/routers/bookings.py:
create_booking (DURATION_PRICING) and cancel_booking (10% cancellation charge).
"""
from decimal import Decimal

from app.routers.bookings import CANCELLATION_CHARGE_PCT
from app.schemas.booking import DURATION_PRICING


def test_duration_pricing_covers_all_three_options():
    assert DURATION_PRICING == {1: Decimal("50"), 2: Decimal("75"), 3: Decimal("100")}


def test_cancellation_charge_is_ten_percent():
    assert CANCELLATION_CHARGE_PCT == Decimal("0.10")


def refund_for(total_amount: Decimal) -> Decimal:
    return (total_amount * (Decimal("1") - CANCELLATION_CHARGE_PCT)).quantize(Decimal("0.01"))


def test_refund_deducts_ten_percent_cancellation_charge():
    assert refund_for(Decimal("100.00")) == Decimal("90.00")


def test_refund_for_multi_ticket_booking():
    # duration=2hr (₹75) x quantity=3
    total = DURATION_PRICING[2] * 3
    assert refund_for(total) == Decimal("202.50")


def test_refund_rounds_to_two_decimal_places():
    total = DURATION_PRICING[1] * 3  # ₹150
    refund = refund_for(total)
    assert refund == Decimal("135.00")
    assert refund.as_tuple().exponent == -2
