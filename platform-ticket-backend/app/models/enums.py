import enum


class UserRole(str, enum.Enum):
    USER = "user"
    ADMIN = "admin"


class BookingPurpose(str, enum.Enum):
    DROP_OFF = "drop_off"
    PICK_UP = "pick_up"
    VIEW_WAIT = "view_wait"


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    ACTIVE = "active"
    USED = "used"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    FAILED = "failed"


class PaymentStatus(str, enum.Enum):
    CREATED = "created"
    SUCCESS = "success"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, enum.Enum):
    WALLET = "wallet"
    RAZORPAY = "razorpay"


class WalletTransactionType(str, enum.Enum):
    TOPUP = "topup"
    BOOKING_PAYMENT = "booking_payment"
    BOOKING_REFUND = "booking_refund"
