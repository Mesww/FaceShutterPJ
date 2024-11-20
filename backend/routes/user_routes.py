from fastapi import APIRouter

from backend.controllers.user_controller import UserController

router = APIRouter(
    tags=["users"]
)


# เส้นทางสำหรับการลงทะเบียนผู้ใช้
router.add_api_route("/register", UserController.register_user, methods=["POST"])
router.add_api_route("/get_user_by_employee_id/{employee_id}", UserController.get_user_by_employee_id, methods=["GET"])


