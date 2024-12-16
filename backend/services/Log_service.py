import logging
from fastapi import HTTPException
from backend.configs.config import DEFAULT_TIMEZONE
from backend.configs.db import connect_to_mongodb
from datetime import datetime
import pytz

class Logservice:
    async def get_logs(self):
        db = await connect_to_mongodb()
        collection = db["logs"]
        try:
            logs = await collection.find().to_list(length=None)
            for log in logs:
                log["_id"] = str(log["_id"])
            return logs
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def create_log(self, employee_id: str, log: dict):
        db = await connect_to_mongodb()
        collection = db["logs"]
        try:
            # กำหนดเวลาไทย
            tz = pytz.timezone(DEFAULT_TIMEZONE)
            current_time = datetime.now(tz)
            
            # แปลงเวลาเป็น ISO format
            thai_time_str = current_time.isoformat()

            # Add a new log entry for the employee
            log_entry = {
                "employee_id": employee_id,
                "logs": [
                    {
                        "log": log,
                        "created_at": thai_time_str,
                    }
                ],
                "created_at": thai_time_str,
                "updated_at": thai_time_str,
            }
            result = await collection.insert_one(log_entry)
            return {"status": "success", "inserted_id": str(result.inserted_id)}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    async def edit_log(self, employee_id: str, log_index: int, new_log: dict):
        db = await connect_to_mongodb()
        collection = db["logs"]
        try:
            # Update specific log at the given index
            employee_logs = await collection.find_one({"employee_id": employee_id})
            if not employee_logs or "logs" not in employee_logs or log_index >= len(employee_logs["logs"]):
                raise HTTPException(status_code=404, detail="Log entry not found.")

            # กำหนดเวลาไทย
            tz = pytz.timezone(DEFAULT_TIMEZONE)
            current_time = datetime.now(tz)

            employee_logs["logs"][log_index]["log"] = new_log
            employee_logs["logs"][log_index]["updated_at"] = current_time

            await collection.replace_one({"employee_id": employee_id}, employee_logs)

            return {"status": "success"}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))