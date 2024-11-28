from fastapi import APIRouter
from backend.services.history_service import History_Service

router = APIRouter()

class History_Controller:
    @staticmethod
    @router.post("/migrate_to_history")
    async def migrate_to_history():
        return await History_Service.migrate_to_history()
    @staticmethod
    @router.get("/get_history_records")
    async def get_history_records(start_date: str, end_date: str):
        return await History_Service.get_history_records(start_date, end_date)