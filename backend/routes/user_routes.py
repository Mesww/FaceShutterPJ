from fastapi import APIRouter
from backend.controllers import user_controller



from backend.controllers.user_controller import UserController

router = APIRouter(
    tags=["users"]
)


# เส้นทางสำหรับการลงทะเบียนผู้ใช้
# router.add_api_route("/register", UserController.register_user, methods=["POST"])

# เส้นทางสำหรับการลบผู้ใช้
router.add_api_route("/delete/{user_id}", UserController.delete_user, methods=["DELETE"])

# เส้นทางสำหรับการดึงข้อมูลผู้ใช้
router.add_api_route("/users/{user_id}", UserController.get_user, methods=["GET"])

# เส้นทางสำหรับการอัปเดตข้อมูลผู้ใช้
router.add_api_route("/update", UserController.update_user, methods=["PUT"])
