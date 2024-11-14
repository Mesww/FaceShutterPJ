import datetime
from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from ..services.timestamp_service import TimeStampService
from ..models.timestamp_model import Timestamp, TimestampBase
from backend.configs.db import get_async_db

router = APIRouter()

class TimeStampController:
    
    @staticmethod
    @router.post("/create")
    async def create_timestamp(
        users_id: int = Form(...),
        db: AsyncSession = Depends(get_async_db)
    ):
        try:
            return await TimeStampService.create_timestamp(db=db, users_id=users_id)
        except IntegrityError:
            raise HTTPException(status_code=400, detail="User not found")
    
    @staticmethod
    @router.get("/get/{timestamp_id}")
    async def get_timestamp(
        timestamp_id: int,
        db: AsyncSession = Depends(get_async_db)
    ):
        return await TimeStampService.get_timestamp(db=db, timestamp_id=timestamp_id)
    
    @staticmethod
    @router.get("/getall")
    async def get_timestamps(
        db: AsyncSession = Depends(get_async_db),
        skip: int = 0,
        limit: int = 100
    ):
        return await TimeStampService.get_timestamps(db=db, skip=skip, limit=limit)
    
    @staticmethod
    @router.put("/update/{timestamp_id}")
    async def update_timestamp(
        timestamp_id: int,
        start_time: datetime.datetime = None,
        end_time: datetime.datetime = None,
        status_work: str = None,
        note: str = None,
        update_at: datetime.datetime = datetime.datetime.now(),
        db: AsyncSession = Depends(get_async_db),
    ):
        try:
            return await TimeStampService.update_timestamp(
                db=db,
                timestamp_id=timestamp_id,
                start_time=start_time,
                end_time=end_time,
                status_work=status_work,
                note=note,
                update_at=update_at
            )
        except IntegrityError:
            raise HTTPException(status_code=400, detail="User not found")
    @staticmethod
    @router.put("/update/{users_id}")
    async def update_timestampbyuserid(
        users_id: str,
        start_time: datetime.datetime = Form(None),
        end_time: datetime.datetime = Form(None),
        status_work: str = Form(None),
        note: str = Form(None),
        update_at: datetime.datetime = datetime.datetime.now(),
        db: AsyncSession = Depends(get_async_db),
    ):
        try:
            print('update_timestampbyuserid')
            timestamp = await TimeStampService.update_timestampbyuserid(
                db=db,
                userid = int(users_id),
                start_time=start_time,
                end_time=end_time,
                status_work=status_work,
                note=note,
                update_at=update_at
            ) 
            return timestamp 
        except IntegrityError:
            raise HTTPException(status_code=400, detail="User not found")
    
    @staticmethod
    @router.delete("/delete/{timestamp_id}")
    async def delete_timestamp(
        timestamp_id: int,
        db: AsyncSession = Depends(get_async_db),
    ):
        return await TimeStampService.delete_timestamp(db=db, timestamp_id=timestamp_id)

    @staticmethod
    @router.delete("/deleteall")
    async def deleteAllTimestamp(db: AsyncSession = Depends(get_async_db)):
        return await TimeStampService.deleteAllTimestamp(db=db)