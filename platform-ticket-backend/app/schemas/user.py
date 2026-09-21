import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, ConfigDict, field_validator

from app.models.enums import UserRole


class SignupRequest(BaseModel):
    email: EmailStr
    phone: str
    password: str
    full_name: str

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        return v

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v: str) -> str:
        if not (v.isdigit() and len(v) == 10 and v[0] in "6789"):
            raise ValueError("phone must be a 10-digit number starting with 6-9")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("password must be at least 8 characters")
        return v


class OtpVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str
    purpose: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    phone: str
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class OtpSentResponse(BaseModel):
    message: str
    otp_debug: str | None = None


class MessageResponse(BaseModel):
    message: str
