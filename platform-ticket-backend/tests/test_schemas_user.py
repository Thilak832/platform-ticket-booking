import pytest
from pydantic import ValidationError

from app.schemas.user import ResetPasswordRequest, SignupRequest


def make_signup(**overrides):
    payload = dict(
        email="user@example.com",
        phone="9876543210",
        password="StrongPass1",
        full_name="Test User",
    )
    payload.update(overrides)
    return SignupRequest(**payload)


def test_signup_accepts_valid_payload():
    req = make_signup()
    assert req.phone == "9876543210"


@pytest.mark.parametrize("password", ["short1", "1234567", ""])
def test_signup_rejects_short_password(password):
    with pytest.raises(ValidationError):
        make_signup(password=password)


def test_signup_accepts_exactly_eight_char_password():
    req = make_signup(password="Abcdefg1")
    assert len(req.password) == 8


@pytest.mark.parametrize(
    "phone",
    [
        "12345",  # too short
        "12345678901",  # too long
        "1234567890",  # starts with 1, not 6-9
        "98765abcde",  # non-digit
    ],
)
def test_signup_rejects_invalid_phone(phone):
    with pytest.raises(ValidationError):
        make_signup(phone=phone)


@pytest.mark.parametrize("leading_digit", ["6", "7", "8", "9"])
def test_signup_accepts_phone_starting_with_6_to_9(leading_digit):
    req = make_signup(phone=f"{leading_digit}123456789")
    assert req.phone[0] == leading_digit


def test_reset_password_rejects_short_new_password():
    with pytest.raises(ValidationError):
        ResetPasswordRequest(email="user@example.com", otp_code="123456", new_password="short")


def test_reset_password_accepts_valid_new_password():
    req = ResetPasswordRequest(email="user@example.com", otp_code="123456", new_password="NewPass123")
    assert req.new_password == "NewPass123"
