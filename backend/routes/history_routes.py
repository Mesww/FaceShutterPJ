from fastapi import APIRouter
from backend.controllers.history_controller import HistoryController
router = APIRouter(
    tags=["history"]
)

"""
    for testing function in history_controller.py
"""

router.add_api_route("/create", HistoryController.create_history, methods=["POST"])
router.add_api_route("/get/{history_id}", HistoryController.get_history, methods=["GET"])
router.add_api_route("/getall", HistoryController.get_historys, methods=["GET"])
router.add_api_route("/update/{history_id}", HistoryController.update_history, methods=["PUT"])
router.add_api_route("/updatebyuserid/{users_id}", HistoryController.update_historybyuserid, methods=["PUT"])
router.add_api_route("/delete/{history_id}", HistoryController.delete_history, methods=["DELETE"])

