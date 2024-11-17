"""
    CRUD operations for timestamp
"""

import datetime
from typing import Optional

from sqlalchemy import delete, select, update

from backend.models.history_model import History, StatushistoryEnum
from ..models.timestamp_model import Timestamp, TimestampBase

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

class TimeStampService:
    @staticmethod
    async def create_timestamp(db: Session, users_id: int):
        try:
            timestamp =  Timestamp(users_id=users_id, status_work='ABSENT', created_at=datetime.datetime.now(),start_time=datetime.datetime.now())
            db.add(timestamp)
            await db.commit()
            await db.refresh(timestamp)
            return timestamp
        except Exception as e:
            await db.rollback()
            raise ValueError(f"CreateTimestamp failed: {str(e)}")
        
    @staticmethod
    def get_timestamp(db: Session, timestamp_id: int):
        return db.query(Timestamp).filter(Timestamp.timestamp_id == timestamp_id).first()
    @staticmethod
    async def get_timestamp_user_id(db: Session, user_id: int):
        stmt = select(Timestamp).filter(Timestamp.users_id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        return user

    @staticmethod
    def get_timestamps(db: Session, skip: int = 0, limit: int = 100):
        return db.query(Timestamp).offset(skip).limit(limit).all()

    @staticmethod
    async def update_timestamp(
        db: Session,
        timestamp_id: int,
        start_time: Optional[datetime.datetime] = None,
        end_time: Optional[datetime.datetime] = None,
        status_work: Optional[str] = None,
        note: Optional[str] = None,
        update_at: Optional[datetime.datetime] = datetime.datetime.now()
        
        ):
        try:
            timestamp = await db.query(Timestamp).filter(Timestamp.timestamp_id == timestamp_id).first()
            timestamp.start_time = start_time if start_time else timestamp.start_time
            timestamp.end_time = end_time if end_time else timestamp.end_time
            timestamp.status_work = status_work if status_work else timestamp.status_work
            timestamp.note = note if note else timestamp.note
            timestamp.update_at = update_at
            
            await db.commit()
            await db.refresh(timestamp)
            
            return timestamp
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="User not found")
        
    async def update_timestampbyuserid(
        db: Session,
        userid: int,
        start_time: Optional[datetime.datetime] = None,
        end_time: Optional[datetime.datetime] = None,
        status_work: Optional[str] = None,
        note: Optional[str] = None,
        update_at: Optional[datetime.datetime] = datetime.datetime.now()
        
        ):
        try:
            
            print('update_timestampbyuserid')
            stmt = select(Timestamp).filter(Timestamp.users_id == userid)
            result = await db.execute(stmt)
            timestamp = result.scalar_one_or_none()
            print('timestamp:',timestamp)
            timestamp.start_time = start_time if start_time else timestamp.start_time
            timestamp.end_time = end_time if end_time else timestamp.end_time
            timestamp.status_work = status_work if status_work else timestamp.status_work
            timestamp.note = note if note else timestamp.note
            timestamp.update_at = update_at
            
            await db.commit()
            await db.refresh(timestamp)
            
            return timestamp
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="User not found")
        
    @staticmethod
    def delete_timestamp(db: Session, timestamp_id: int):
        db.query(Timestamp).filter(Timestamp.timestamp_id == timestamp_id).delete()
        db.commit()
        return {"message": "Timestamp deleted successfully"}
    
    @staticmethod
    async def deleteAllTimestamp(db: Session):
      try:
        await db.execute(delete(Timestamp))
        # change all status in history that not have end_time to ABSENT
        await db.execute(
            update(History).where(History.end_time == None).values(end_time=None, status_work=StatushistoryEnum.ABSENT, update_at=datetime.datetime.now())
        )
        await db.commit()
        return {"message": "All Timestamp deleted successfully"}
      except Exception as e:
        await db.rollback()
        raise ValueError(f"DeleteAllTimestamp failed: {str(e)}")