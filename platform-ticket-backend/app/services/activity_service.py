import uuid

from sqlalchemy.orm import Session

from app.models.activity_log import ActivityLog


def log_activity(
    db: Session,
    action: str,
    user_id: uuid.UUID | None = None,
    status: str = "success",
    ip_address: str | None = None,
    details: str | None = None,
) -> None:
    entry = ActivityLog(
        user_id=user_id,
        action=action,
        status=status,
        ip_address=ip_address,
        details=details,
    )
    db.add(entry)
    db.commit()
