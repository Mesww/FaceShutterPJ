"""
    CRUD operations for history
"""

import datetime
from typing import Optional

from sqlalchemy import func, select
from ..models.history_model import History, HistoryBase

from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

class HistoryService:
    @staticmethod
    async def create_history(db: Session, users_id: int,created_at=datetime.datetime.now(),start_time=datetime.datetime.now()):
        try:
            history =  History(users_id=users_id, status_work='ABSENT', created_at=created_at,start_time=start_time)
            db.add(history)
            await db.commit()
            await db.refresh(history)
            return history
        except Exception as e:
            await db.rollback()
            raise ValueError(f"Createhistory failed: {str(e)}")
        
    @staticmethod
    def get_history(db: Session, history_id: int):
        return db.query(History).filter(History.history_id == history_id).first()

    @staticmethod
    def get_historys(db: Session, skip: int = 0, limit: int = 100):
        return db.query(History).offset(skip).limit(limit).all()

    @staticmethod
    async def get_historys_user_id(db: Session, user_id: int):
        stmt = select(History).filter(History.users_id == user_id)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        return user

    @staticmethod
    async def update_history(
        db: Session,
        history_id: int,
        start_time: Optional[datetime.datetime] = None,
        end_time: Optional[datetime.datetime] = None,
        status_work: Optional[str] = None,
        note: Optional[str] = None,
        update_at: Optional[datetime.datetime] = datetime.datetime.now()
        
        ):
        try:
            history = await db.query(History).filter(history.history_id == history_id ).first()
            history.start_time = start_time if start_time else history.start_time
            history.end_time = end_time if end_time else history.end_time
            history.status_work = status_work if status_work else history.status_work
            history.note = note if note else history.note
            history.update_at = update_at
            
            await db.commit()
            await db.refresh(history)
            
            return history
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="User not found")
        
    async def update_historybyuserid(
        db: Session,
        userid: int,
        start_time: Optional[datetime.datetime] = None,
        end_time: Optional[datetime.datetime] = None,
        status_work: Optional[str] = None,
        note: Optional[str] = None,
        update_at: Optional[datetime.datetime] = datetime.datetime.now()
        
        ):
        try:
            print('update_historybyuserid')
            
            stmt = select(History).filter(History.users_id == userid ,
            func.date(History.start_time) == datetime.datetime.now().date())
            result = await db.execute(stmt)
            history = result.scalar_one_or_none()
            print('history:',history)
            history.start_time = start_time if start_time else history.start_time
            history.end_time = end_time if end_time else history.end_time
            history.status_work = status_work if status_work else history.status_work
            history.note = note if note else history.note
            history.update_at = update_at
            
            await db.commit()
            await db.refresh(history)
            
            return history
        except IntegrityError:
            db.rollback()
            raise HTTPException(status_code=400, detail="User not found")
        
    @staticmethod
    def delete_history(db: Session, history_id: int):
        db.query(History).filter(History.history_id == history_id).delete()
        db.commit()
        return {"message": "history deleted successfully"}
