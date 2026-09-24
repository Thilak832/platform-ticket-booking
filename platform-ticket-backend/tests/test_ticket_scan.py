"""
Unit tests for app/routers/bookings.py: scan_decision() - the pure decision
logic behind the QR ticket scanner (gate verification). Isolated from the
database/FastAPI request cycle with a lightweight fake Booking object.
"""
from datetime import datetime, timezone

import pytest

from app.models.enums import BookingStatus
from app.routers.bookings import scan_decision


class FakeBooking:
    def __init__(self, status, used_at=None):
        self.status = status
        self.used_at = used_at


def test_active_booking_scans_successfully():
    booking = FakeBooking(BookingStatus.ACTIVE)
    valid, message = scan_decision(booking)
    assert valid is True
    assert "granted" in message.lower()


def test_used_booking_is_rejected_with_used_at_time():
    used_at = datetime(2026, 9, 24, 11, 16, tzinfo=timezone.utc)
    booking = FakeBooking(BookingStatus.USED, used_at=used_at)
    valid, message = scan_decision(booking)
    assert valid is False
    assert "already used" in message.lower()
    assert "11:16 AM" in message
    assert "24 Sep 2026" in message


def test_used_booking_without_used_at_falls_back_gracefully():
    booking = FakeBooking(BookingStatus.USED, used_at=None)
    valid, message = scan_decision(booking)
    assert valid is False
    assert "already used" in message.lower()
    assert "an earlier time" in message


def test_expired_booking_is_rejected():
    booking = FakeBooking(BookingStatus.EXPIRED)
    valid, message = scan_decision(booking)
    assert valid is False
    assert "expired" in message.lower()


def test_cancelled_booking_is_rejected():
    booking = FakeBooking(BookingStatus.CANCELLED)
    valid, message = scan_decision(booking)
    assert valid is False
    assert "cancelled" in message.lower()


def test_pending_booking_is_rejected():
    # A booking that hasn't completed payment yet should never scan as valid.
    booking = FakeBooking(BookingStatus.PENDING)
    valid, message = scan_decision(booking)
    assert valid is False
    assert "pending" in message.lower()


def test_failed_booking_is_rejected():
    booking = FakeBooking(BookingStatus.FAILED)
    valid, message = scan_decision(booking)
    assert valid is False
    assert "failed" in message.lower()


@pytest.mark.parametrize("status", [
    BookingStatus.USED, BookingStatus.EXPIRED, BookingStatus.CANCELLED,
    BookingStatus.PENDING, BookingStatus.FAILED,
])
def test_only_active_status_is_ever_valid(status):
    valid, _ = scan_decision(FakeBooking(status))
    assert valid is False
