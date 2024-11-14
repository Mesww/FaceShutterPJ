import datetime
import json
from typing import Union,List
from pydantic import BaseModel
from backend.models.timestamp_model import StatusEnum, Timestamp
from backend.models.history_model import StatushistoryEnum
from backend.services.face_service import FaceAuthService
from sqlalchemy.ext.asyncio import AsyncSession
from backend.configs.db import get_async_db
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from backend.services.history_service import HistoryService
from ..utils.timestamp_utils import is_start_work,is_end_work

# models.py
from fastapi import File, Form, UploadFile
from pydantic import BaseModel
from typing import Optional

from backend.services.timestamp_service import TimeStampService


# We need to create separate models for request validation
class RegisterUserBase(BaseModel):
    name: str
    employee_id: str

class RegisterUserRequest:
    def __init__(
        self,
        image: UploadFile = File(...),
        name: str = Form(...),
        email:str = Form(...),
        employee_id: str = Form(...),
    ):
        self.image = image
        self.name = name
        self.email = email
        self.employee_id = employee_id

# routes.py
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from backend.configs.db import get_async_db
from backend.services.face_service import FaceAuthService

router = APIRouter()

@router.post("/register")
async def register_user(
    image: UploadFile = File(...),
    name: str = Form(...),
    employee_id: str = Form(...),
    db: AsyncSession = Depends(get_async_db)
):
    try:
        # Create request object with the received data
        request = RegisterUserRequest(
            image=image,
            name=name,
            employee_id=employee_id
        ) 
        
        # Call the service method with corrected parameters
        user, similarity,message = await FaceAuthService.registerface_user(
            db=db,
            name=request.name,
            employee_id=request.employee_id,
            input_image=request.image
        )
        
        if user is None:
            raise HTTPException(
                status_code=400, 
                detail=message
            )
            
        print('Timestamping...')
        current_time = datetime.datetime.now()
        is_start_works =  is_start_work(current_time)
        is_end_works = is_end_work(current_time)
        if is_start_works:
            print('start work')
            timestamp = await TimeStampService.create_timestamp(
                db=db,
                users_id=user.users_id,
            )
            history = await HistoryService.create_history(
                db=db,
                users_id=user.users_id,
            )
        elif is_end_works:
            print('end work')
            timestamp = await TimeStampService.update_timestampbyuserid(
                db=db,
                userid=user.users_id,
                end_time=current_time,
                status_work=StatusEnum.NORMAL
            )
            history = await HistoryService.update_historybyuserid(
                db=db,
                userid=user.users_id,
                end_time=current_time,
                status_work=StatushistoryEnum.NORMAL
            )
        else:
            print('not start work')
            raise HTTPException(
                status_code=400, 
                detail="You can only check-in from 8:00 am to 8:30 am and check-out from 4:00 pm to 5:00 pm."
            )
        return {
            "message": message,
            "user_id": user.users_id,
            "name": user.name,
            "similarity":similarity,
            "timestamp_id": timestamp.timestamp_id if timestamp else None
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

