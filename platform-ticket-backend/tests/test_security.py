from datetime import datetime, timedelta, timezone

from jose import jwt

from app.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_otp,
    hash_password,
    verify_password,
)


def test_hash_password_does_not_store_plaintext():
    hashed = hash_password("Sup3rSecret!")
    assert hashed != "Sup3rSecret!"
    assert hashed.startswith("$2b$")  # bcrypt hash prefix


def test_verify_password_accepts_correct_password():
    hashed = hash_password("Sup3rSecret!")
    assert verify_password("Sup3rSecret!", hashed) is True


def test_verify_password_rejects_wrong_password():
    hashed = hash_password("Sup3rSecret!")
    assert verify_password("WrongPassword", hashed) is False


def test_generate_otp_is_six_numeric_digits():
    for _ in range(20):
        otp = generate_otp()
        assert len(otp) == 6
        assert otp.isdigit()


def test_generate_otp_produces_varied_values():
    otps = {generate_otp() for _ in range(50)}
    assert len(otps) > 1  # not hardcoded / degenerate


def test_access_token_round_trip():
    token = create_access_token("user@example.com")
    subject = decode_access_token(token)
    assert subject == "user@example.com"


def test_decode_rejects_malformed_token():
    assert decode_access_token("not-a-real-token") is None


def test_decode_rejects_token_signed_with_wrong_key():
    bad_token = jwt.encode(
        {"sub": "user@example.com", "exp": datetime.now(timezone.utc) + timedelta(hours=1)},
        "a-completely-different-secret",
        algorithm=settings.ALGORITHM,
    )
    assert decode_access_token(bad_token) is None


def test_decode_rejects_expired_token():
    expired_token = jwt.encode(
        {"sub": "user@example.com", "exp": datetime.now(timezone.utc) - timedelta(hours=1)},
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM,
    )
    assert decode_access_token(expired_token) is None
