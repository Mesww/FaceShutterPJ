from datetime import datetime
from fastapi import APIRouter, Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from backend.configs.config import CHECKIN_TIME_END, CHECKIN_TIME_START, DEFAULT_TIMEZONE
from backend.models.checkinout_model import CheckInOutToday
from backend.models.returnformat import Returnformat
from backend.services.checkinout_service import CheckInOut_Service
import pytz

from backend.services.user_service import UserService

router = APIRouter()
# Define request body model
class CheckInRequest(BaseModel):
    employee_id: str
class CheckOutRequest(BaseModel):
    employee_id: str

class Checkinout_controller:
    security = HTTPBearer()
    @staticmethod
    @router.post("/checkin")
    async def check_in(data:CheckInRequest):
        check_in_time = datetime.now(tz=pytz.timezone(DEFAULT_TIMEZONE)).strftime("%H:%M:%S")
        if check_in_time < CHECKIN_TIME_START:
            return {"message": "Cannot check-in before 08:00:00"}
        elif check_in_time > CHECKIN_TIME_END:
            return {"message": "Cannot check-in after 09:00:00"}
        data = CheckInOutToday(employee_id=data.employee_id, check_in_time=datetime.now(tz=pytz.timezone(DEFAULT_TIMEZONE)).strftime("%H:%M:%S"), date=datetime.now(tz=pytz.timezone(DEFAULT_TIMEZONE)).strftime("%Y-%m-%d"))
        print(data)
        
        return await CheckInOut_Service.check_in(data)
    @staticmethod
    @router.put("/checkout")
    async def check_out(data:CheckOutRequest):
        return await CheckInOut_Service.check_out(data.employee_id)
    
    @staticmethod
    @router.get("/is_checkinorout_time_valid/{time}")
    async def is_checkinorout_time_valid(time:str):
        return await CheckInOut_Service.is_checkinorout_time_valid(time)
    
    @staticmethod
    @router.get("/is_already_checked_in_today")
    async def is_already_checked_in_today( credentials: HTTPAuthorizationCredentials = Depends(security)):
        userservice = UserService()
        employee_id = userservice.extract_token( token=credentials.credentials)
        print(employee_id.get('sub'))
        return await CheckInOut_Service.is_already_checked_in(employee_id=employee_id.get('sub'))
    @staticmethod
    @router.get("/is_already_checked_out_today")
    async def is_already_checked_out_today( credentials: HTTPAuthorizationCredentials = Depends(security)):
        userservice = UserService()
        employee_id = userservice.extract_token( token=credentials.credentials)
        return await CheckInOut_Service.is_already_checked_out(employee_id=employee_id.get('sub'))
    @staticmethod
    @router.get("/get_today_records")
    async def get_today_records():
        return await CheckInOut_Service.get_today_records()