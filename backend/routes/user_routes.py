from fastapi import APIRouter
from backend.controllers import user_controller

router = APIRouter( tags=["user"] )

router.add_api_route("/edit", user_controller.edit_user, methods=["PUT"])