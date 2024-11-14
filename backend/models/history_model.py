from datetime import datetime
import enum
from typing import Optional

from pydantic import BaseModel
from backend.configs.db import Base
from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import validates

class StatushistoryEnum(enum.Enum):
    NORMAL = "NORMAL"
    ABSENT = "ABSENT"
    LEAVE = "LEAVE"
    EXTRA = "EXTRA"
    LATE = "LATE"

class History(Base):
    
    """
        Timestamp model for saving coming to work
    """  
    
    __tablename__ = 'history'
    
    history_id = Column(Integer, primary_key=True, index=True)
    # users_id in history table is not unique
    users_id = Column(Integer,  ForeignKey('users.users_id'))
    start_time = Column(DateTime, server_default=func.now(), nullable=False)
    end_time = Column(DateTime, nullable=True)
    status_work = Column(Enum(StatushistoryEnum), nullable=False, default=StatushistoryEnum.ABSENT)
    note = Column(String(256), nullable=True)
    created_at = Column(DateTime, unique=True, server_default=func.now(), nullable=False)
    update_at = Column(DateTime, onupdate=func.now(), nullable=True)
    date = Column(DateTime, server_default=func.now(), nullable=False)
    __table_args__ = {'extend_existing': True}

    def __repr__(self):
        return f"<History(history_id={self.history_id}, status_work='{self.status_work}')>"
class HistoryBase(BaseModel):
    users_id: int
    start_time: datetime
    end_time: Optional[datetime] = None
    status_work: StatushistoryEnum
    note: Optional[str] = None
    created_at: datetime
    update_at: Optional[datetime] = None
    

    @validates('users_id')
    def validate_users_id(self, key, users_id):
        existing_timestamp = self.query.filter_by(users_id=users_id).first()
        if existing_timestamp:
            raise ValueError("A timestamp with the same users_id already exists.")
        return users_id