from fastapi import APIRouter

from backend.controllers.logs_controller import LogsController
router = APIRouter(
    tags=["logs"]
)

router.add_api_route("/getlogs", LogsController.get_logs, methods=["GET"])

# For admin
router.add_api_route("/createlog", LogsController.create_log, methods=["POST"])
router.add_api_route("/editlog", LogsController.edit_log, methods=["PUT"])
