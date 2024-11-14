import datetime
from fastapi import APIRouter, Depends, Form, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError

from ..services.history_service import HistoryService
from ..models.history_model import History, HistoryBase
from backend.configs.db import get_async_db

router = APIRouter()

class HistoryController:
    
    @staticmethod
    @router.post("/create")
    async def create_history(
        users_id: int = Form(...),
        db: AsyncSession = Depends(get_async_db)
    ):
        try:
            return await HistoryService.create_history(db=db, users_id=users_id)
        except IntegrityError:
            raise HTTPException(status_code=400, detail="User not found")
    
    @staticmethod
    @router.get("/get/{history_id}")
    async def get_history(
        history_id: int,
        db: AsyncSession = Depends(get_async_db)
    ):
        return await HistoryService.get_history(db=db, history_id=history_id)
    
    @staticmethod
    @router.get("/getall")
    async def get_historys(
        db: AsyncSession = Depends(get_async_db),
        skip: int = 0,
        limit: int = 100
    ):
        return await HistoryService.get_historys(db=db, skip=skip, limit=limit)
    
    @staticmethod
    @router.put("/update/{history_id}")
    async def update_history(
        history_id: int,
        start_time: datetime.datetime = None,
        end_time: datetime.datetime = None,
        status_work: str = None,
        note: str = None,
        update_at: datetime.datetime = datetime.datetime.now(),
        db: AsyncSession = Depends(get_async_db),
    ):
        try:
            return await HistoryService.update_history(
                db=db,
                history_id=history_id,
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
    async def update_historybyuserid(
        users_id: str,
        start_time: datetime.datetime = Form(None),
        end_time: datetime.datetime = Form(None),
        status_work: str = Form(None),
        note: str = Form(None),
        update_at: datetime.datetime = datetime.datetime.now(),
        db: AsyncSession = Depends(get_async_db),
    ):
        try:
            print('update_historybyuserid')
            history = await HistoryService.update_historybyuserid(
                db=db,
                userid = int(users_id),
                start_time=start_time,
                end_time=end_time,
                status_work=status_work,
                note=note,
                update_at=update_at
            ) 
            return history 
        except IntegrityError:
            raise HTTPException(status_code=400, detail="User not found")
    
    @staticmethod
    @router.delete("/delete/{history_id}")
    async def delete_history(
        history_id: int,
        db: AsyncSession = Depends(get_async_db),
    ):
        return await HistoryService.delete_history(db=db, history_id=history_id)
