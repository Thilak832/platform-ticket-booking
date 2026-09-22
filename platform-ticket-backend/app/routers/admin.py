from datetime import date as date_type, datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import require_admin
from app.database import get_db
from app.models.activity_log import ActivityLog
from app.models.booking import Booking
from app.models.enums import BookingStatus
from app.models.user import User
from app.schemas.admin import ActivityLogOut, DashboardStats
from app.schemas.booking import BookingOut

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.get("/stats", response_model=DashboardStats)
def dashboard_stats(db: Session = Depends(get_db)):
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)

    bookings_today = db.query(func.count(Booking.id)).filter(Booking.created_at >= today_start).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active.is_(True), User.is_verified.is_(True)).scalar() or 0
    revenue_today = (
        db.query(func.coalesce(func.sum(Booking.total_amount), 0))
        .filter(Booking.created_at >= today_start, Booking.status.in_([BookingStatus.ACTIVE, BookingStatus.USED]))
        .scalar()
        or 0
    )
    total_bookings = db.query(func.count(Booking.id)).scalar() or 0

    return DashboardStats(
        bookings_today=bookings_today,
        active_users=active_users,
        revenue_today=float(revenue_today),
        total_bookings=total_bookings,
    )


@router.get("/bookings", response_model=list[BookingOut])
def list_all_bookings(
    status_filter: BookingStatus | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(Booking)
    if status_filter:
        query = query.filter(Booking.status == status_filter)
    return query.order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/activity-logs", response_model=list[ActivityLogOut])
def list_activity_logs(
    action: str | None = None,
    date: date_type | None = None,
    all_time: bool = False,
    search: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(ActivityLog, User.full_name, User.email).outerjoin(User, ActivityLog.user_id == User.id)

    if action:
        query = query.filter(ActivityLog.action == action)

    if not all_time:
        target_day = date or datetime.now(timezone.utc).date()
        day_start = datetime.combine(target_day, datetime.min.time(), tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)
        query = query.filter(ActivityLog.created_at >= day_start, ActivityLog.created_at < day_end)

    if search:
        pattern = f"%{search.strip()}%"
        query = query.filter((User.full_name.ilike(pattern)) | (User.email.ilike(pattern)))

    rows = query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit).all()

    return [
        ActivityLogOut(
            id=log.id,
            user_id=log.user_id,
            user_name=full_name,
            user_email=email,
            action=log.action,
            status=log.status,
            ip_address=log.ip_address,
            details=log.details,
            created_at=log.created_at,
        )
        for log, full_name, email in rows
    ]
