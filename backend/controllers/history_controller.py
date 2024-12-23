from fastapi import APIRouter
from pydantic import BaseModel
from backend.services.history_service import History_Service

router = APIRouter()
class get_history_records_Request(BaseModel):
    employee_id: str
    end_date: str
    start_date: str
class History_Controller:
    @staticmethod
    @router.post("/migrate_to_history")
    async def migrate_to_history():
        return await History_Service.migrate_to_history()
    @staticmethod
    @router.get("/get_history_records/{employee_id}/{start_date}/{end_date}")
    async def get_history_records(employee_id, start_date, end_date):
        
        return await History_Service.get_history_records(start_date, end_date, employee_id)
    # For admin
    @staticmethod
    @router.get("/get_all_history_records/{start_date}/{end_date}")
    async def get_all_history_records(start_date: str, end_date: str):
        return await History_Service.get_all_history_records(start_date, end_date)