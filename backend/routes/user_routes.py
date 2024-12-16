from fastapi import APIRouter

from backend.controllers.user_controller import UserController

router = APIRouter(
    tags=["users"]
)


# เส้นทางสำหรับการลงทะเบียนผู้ใช้
router.add_api_route("/register", UserController.register_user, methods=["POST"])
router.add_api_route("/get_user_by_employee_id", UserController.get_user_by_employee_id, methods=["GET"])
router.add_api_route("/get_is_user_by_employee_id/{employee_id}", UserController.get_is_user_by_employee_id, methods=["GET"])
router.add_api_route("/update_user", UserController.update_user, methods=["PUT"])
router.add_api_route("/update_user_by_employee_id/{employee_id}", UserController.update_user_by_employee_id, methods=["PUT"])
router.add_api_route("/get_all_user", UserController.getAllUser, methods=["GET"])
router.add_api_route("/delete_user/{employee_id}", UserController.delete_user, methods=["DELETE"])
router.add_api_route("/add_admin", UserController.add_admin, methods=["POST"])
