from fastapi import APIRouter

from backend.controllers.snmp_controller import SnmpController

from backend.services.snmp_service import SnmpService

router = APIRouter(
    tags=["snmp"]
)

snmpController = SnmpController(SnmpService())

router.add_api_route("/findId/{search_term}", snmpController.findId, methods=["GET"])