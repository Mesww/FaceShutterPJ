from fastapi import APIRouter
from ..controllers.checkinout_controller import Checkinout_controller
router = APIRouter(
    tags=["checkinout"]
)
router.add_api_route("/checkin", Checkinout_controller.check_in, methods=["POST"])
router.add_api_route("/checkout", Checkinout_controller.check_out, methods=["PUT"])
router.add_api_route("/get_today_records", Checkinout_controller.get_today_records, methods=["GET"])
router.add_api_route("/is_checkinorout_time_valid/{time}", Checkinout_controller.is_checkinorout_time_valid, methods=["GET"])
router.add_api_route("/is_already_checked_in_today", Checkinout_controller.is_already_checked_in_today, methods=["GET"])
router.add_api_route("/is_already_checked_out_today", Checkinout_controller.is_already_checked_out_today, methods=["GET"])
router.add_api_route("/is_already_checked_in_out_today", Checkinout_controller.is_already_checked_in_out_today, methods=["GET"])