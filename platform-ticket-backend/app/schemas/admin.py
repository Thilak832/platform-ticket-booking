import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DashboardStats(BaseModel):
    bookings_today: int
    active_users: int
    revenue_today: float
    total_bookings: int


class ActivityLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID | None
    action: str
    status: str
    ip_address: str | None
    details: str | None
    created_at: datetime
