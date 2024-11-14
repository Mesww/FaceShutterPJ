from fastapi import APIRouter
from backend.controllers.timestamp_controller import TimeStampController
router = APIRouter(
    tags=["timestamps"]
)

"""
    for testing function in timestamp_controller.py
"""

router.add_api_route("/create", TimeStampController.create_timestamp, methods=["POST"])
router.add_api_route("/get/{timestamp_id}", TimeStampController.get_timestamp, methods=["GET"])
router.add_api_route("/getall", TimeStampController.get_timestamps, methods=["GET"])
router.add_api_route("/update/{timestamp_id}", TimeStampController.update_timestamp, methods=["PUT"])
router.add_api_route("/updatebyuserid/{users_id}", TimeStampController.update_timestampbyuserid, methods=["PUT"])
router.add_api_route("/delete/{timestamp_id}", TimeStampController.delete_timestamp, methods=["DELETE"])
router.add_api_route("/deleteAll", TimeStampController.deleteAllTimestamp, methods=["DELETE"])

