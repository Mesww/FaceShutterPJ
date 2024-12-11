from fastapi import APIRouter, HTTPException
from backend.services.Log_service import Logservice
from pydantic import BaseModel

router = APIRouter()

class LogEntry(BaseModel):
    employee_id: str
    log: dict
class LogEntryEdit(BaseModel):
    employee_id: str
    log_index: int
    new_log: dict
class LogsController:
    @staticmethod
    @router.get("/getlogs")
    async def get_logs():
        try:
            logservice = Logservice()
            logs = await logservice.get_logs()
            return logs
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    @router.post("/createlog")
    async def create_log(request: LogEntry):
        try:
            logservice = Logservice()
            result = await logservice.create_log(request.employee_id, request.log)
            return result
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    @router.put("/editlog")
    async def edit_log(request: LogEntryEdit):
        try:
            logservice = Logservice()
            result = await logservice.edit_log(request.employee_id, request.log_index, request.new_log)
            return result
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))