from fastapi import APIRouter
from ..controllers.history_controller import History_Controller
router = APIRouter(
    tags=["history"]
)
# For user
router.add_api_route("/get_history_records/{employee_id}/{start_date}/{end_date}", History_Controller.get_history_records, methods=["GET"])

# For admin
router.add_api_route("/migrate_to_history", History_Controller.migrate_to_history, methods=["POST"])
router.add_api_route("/get_all_history_records/{start_date}/{end_date}", 
                     History_Controller.get_all_history_records, 
                     methods=["GET"])