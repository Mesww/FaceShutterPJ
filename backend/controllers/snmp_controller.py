from pathlib import Path

from dotenv import dotenv_values, load_dotenv
from fastapi import APIRouter
from backend.configs.config import PATHENV, SNMP_OIDS
from backend.services.snmp_service import SnmpService

router = APIRouter()
class SnmpController:

    def __init__(self, snmp_service: SnmpService):
        load_dotenv(dotenv_path=PATHENV)
        config = dotenv_values()
        self.snmp_service = snmp_service
        self.community = config.get("SNMP_COMMUNITY", "public")
        self.host = config.get("SNMP_HOST", "localhost")

    @router.get("/findId/{search_term}")
    async def findId(self, search_term: str) :
        return True if await self.snmp_service.finder_snmp(self.host, self.community, SNMP_OIDS['id'], search_term) else False 