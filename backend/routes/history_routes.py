from fastapi import APIRouter
from ..controllers.history_controller import History_Controller
router = APIRouter(
    tags=["history"]
)

router.add_api_route("/migrate_to_history", History_Controller.migrate_to_history, methods=["POST"])
router.add_api_route("/get_history_records", History_Controller.get_history_records, methods=["GET"])