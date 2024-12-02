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
    @router.get("/get_history_records")
    async def get_history_records(data:get_history_records_Request):
        # print(data)
        return await History_Service.get_history_records(data.start_date, data.end_date, data.employee_id)