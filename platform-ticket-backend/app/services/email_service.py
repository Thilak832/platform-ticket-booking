import logging
import smtplib
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)

_PLACEHOLDER_PASSWORDS = {"test", "", None}


def _email_configured() -> bool:
    return settings.SENDER_PASSWORD not in _PLACEHOLDER_PASSWORDS


def _send(to_email: str, subject: str, body: str) -> None:
    if not _email_configured():
        logger.info("Email (SMTP not configured, not sent): to=%s subject=%s body=%s", to_email, subject, body)
        return

    message = MIMEText(body)
    message["Subject"] = subject
    message["From"] = settings.SENDER_EMAIL
    message["To"] = to_email

    try:
        with smtplib.SMTP(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SENDER_EMAIL, settings.SENDER_PASSWORD)
            server.sendmail(settings.SENDER_EMAIL, [to_email], message.as_string())
        logger.info("Email sent: to=%s subject=%s", to_email, subject)
    except Exception:
        logger.exception("Failed to send email to %s", to_email)


def send_otp(to_email: str, otp_code: str, purpose: str) -> None:
    subject = "Your Platform Ticket verification code"
    body = f"Your OTP for {purpose} is {otp_code}. Valid for 10 minutes."
    _send(to_email, subject, body)


def send_booking_confirmation(to_email: str, station_name: str, quantity: int, ticket_code: str, valid_until: str) -> None:
    subject = f"Platform Ticket Confirmed: {station_name}"
    body = (
        f"Your platform ticket for {station_name} is confirmed.\n"
        f"Quantity: {quantity}\n"
        f"Ticket code: {ticket_code}\n"
        f"Valid until: {valid_until}\n"
    )
    _send(to_email, subject, body)


def send_cancellation_confirmation(to_email: str, station_name: str, refund_amount: float, ticket_code: str) -> None:
    subject = f"Ticket Cancelled: {station_name}"
    body = (
        f"Your platform ticket ({ticket_code}) for {station_name} has been cancelled.\n"
        f"Refund amount: Rs {refund_amount}\n"
        f"Refunds are processed within 24-48 hours.\n"
    )
    _send(to_email, subject, body)
