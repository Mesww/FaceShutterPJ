from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import pytz

from backend.configs.config import DEFAULT_TIMEZONE

timezone = pytz.timezone(DEFAULT_TIMEZONE)
class CheckInOutToday(BaseModel):
    employee_id: str
    date: str = Field(default_factory=lambda: datetime.now(tz=timezone).strftime("%Y-%m-%d"))
    check_in_time: Optional[str] = None
    check_out_time: Optional[str] = None
    status: Optional[str] = "Incomplete"
    location: Optional[str] = None

class CheckInOutHistory(CheckInOutToday):
    created_at: datetime
    updated_at: Optional[datetime]
