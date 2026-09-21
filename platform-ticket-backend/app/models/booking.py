import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Numeric, Integer, ForeignKey, Enum as SAEnum, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base
from app.models.enums import BookingPurpose, BookingStatus, PaymentMethod


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    ticket_code: Mapped[str] = mapped_column(String(36), unique=True, default=lambda: str(uuid.uuid4()))

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    station_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("stations.id", ondelete="CASCADE"), nullable=False)

    purpose: Mapped[BookingPurpose] = mapped_column(SAEnum(BookingPurpose, name="booking_purpose"), nullable=False)
    duration_hours: Mapped[int] = mapped_column(Integer, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    location_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    user_latitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)
    user_longitude: Mapped[float | None] = mapped_column(Numeric(9, 6), nullable=True)

    status: Mapped[BookingStatus] = mapped_column(SAEnum(BookingStatus, name="booking_status"), default=BookingStatus.PENDING, nullable=False)
    payment_method: Mapped[PaymentMethod] = mapped_column(SAEnum(PaymentMethod, name="payment_method"), default=PaymentMethod.RAZORPAY, nullable=False)
    qr_code: Mapped[str | None] = mapped_column(Text, nullable=True)

    valid_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    razorpay_order_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(255), nullable=True)

    refund_amount: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="bookings")
    station = relationship("Station", back_populates="bookings")
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")
