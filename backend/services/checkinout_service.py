from datetime import datetime
from fastapi import HTTPException
import pytz
from backend.configs.config import CHECKIN_TIME_END, CHECKIN_TIME_START, CHECKOUT_TIME_END, CHECKOUT_TIME_START, DEFAULT_TIMEZONE
from backend.configs.db import connect_to_mongodb
from backend.models.checkinout_model import CheckInOutToday
from backend.models.returnformat import Returnformat


class CheckInOut_Service:
    @staticmethod
    async def is_checkinorout_time_valid(time:str):
        if CheckInOut_Service.is_valid_checkin_time(time):
            return Returnformat(status="success", message="Time is valid", data="checkin").to_json() 
        elif CheckInOut_Service.is_valid_checkout_time(time):
            return Returnformat(status="success", message="Time is valid", data="checkout").to_json()
        return Returnformat(status="error", message="Time is invalid", data=None).to_json()        
    @staticmethod
    def is_valid_checkin_time(time:str):
        if time < CHECKIN_TIME_START or time > CHECKIN_TIME_END:
            return False
        return True
    @staticmethod
    def is_valid_checkout_time(time:str):
        if time < CHECKOUT_TIME_START or time > CHECKOUT_TIME_END:
            return False
        return True
    @staticmethod
    async def check_in(data: CheckInOutToday):
        try:
            print('Checking in...1')
            
            db= await connect_to_mongodb()
            today_collection = db['checkinouttoday']
            print('Checking in...2')
            # Check if the user already checked in today
            existing = await today_collection.find_one({"employee_id": data.employee_id, "date": data.date})
            print('Existing: ',existing)
            if existing:
                raise HTTPException(status_code=400, detail="User already checked in today.")
            print(data.model_dump())
            # Insert check-in record
            result = await today_collection.insert_one(data.model_dump())
            return {"message": "Check-in successful", "id": str(result.inserted_id)}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    @staticmethod
    async def check_out(employee_id: str):
        try:
            db= await connect_to_mongodb()
            today_collection = db['checkinouttoday']
            record = await today_collection.find_one({"employee_id": employee_id, "date": datetime.utcnow().strftime("%Y-%m-%d")})
            timezone = pytz.timezone(DEFAULT_TIMEZONE)
            if not record:
                raise HTTPException(status_code=404, detail="No check-in record found for today.")

            # Update the check-out time
            updated_time = datetime.now(tz=timezone).strftime("%H:%M:%S")
            result = await today_collection.update_one(
                {"_id": record["_id"]},
                {"$set": {"check_out_time": updated_time, "status": "Complete"}}
            )
            if result.modified_count == 0:
                raise HTTPException(status_code=500, detail="Check-out failed.")
            return {"message": "Check-out successful", "check_out_time": updated_time}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    @staticmethod
    async def is_already_checked_in(employee_id: str):
        try:
            db= await connect_to_mongodb()
            is_checked = False
            message = "User has not checked in today"
            today_collection = db['checkinouttoday']
            timezone = pytz.timezone(DEFAULT_TIMEZONE)
            print('Employee ID: ',employee_id)
            record = await today_collection.find_one({"employee_id": employee_id, "date": datetime.now(tz=timezone).strftime("%Y-%m-%d")})
            if record:
                is_checked = True
                message = "User already checked in today"
            return Returnformat(status="success", message=message, data=is_checked).to_json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    @staticmethod
    async def is_already_checked_out(employee_id: str):
        try:
            db= await connect_to_mongodb()
            is_checked = False
            message = "User has not checked out today"
            
            today_collection = db['checkinouttoday']
            timezone = pytz.timezone(DEFAULT_TIMEZONE)
            record = await today_collection.find_one({"employee_id": employee_id, "date": datetime.now(tz=timezone).strftime("%Y-%m-%d")})
            if record and record["check_out_time"]:
                is_checked = True
                message = "User already checked out today"
            return Returnformat(status="success", message=message, data=is_checked).to_json()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    @staticmethod
    async def get_today_records():
       try: 
        db= await connect_to_mongodb()
        today_collection = db['checkinouttoday']
        records = await today_collection.find().to_list(100)
        return {"data": records}
       except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))