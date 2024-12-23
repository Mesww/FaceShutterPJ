from fastapi import APIRouter
from backend.controllers.auth_controller import AdminAuthController
router = APIRouter(
    tags=["auth"]
)
adminAuth = AdminAuthController()
router.add_api_route("/login", adminAuth.login, methods=["POST"])

router.add_api_route("/generate_password/{password}", adminAuth.generate_password, methods=["GET"])
