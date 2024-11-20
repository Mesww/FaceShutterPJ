from fastapi import APIRouter

from ..controllers.face_controller import Face_controller
router = APIRouter(
    tags=["face"]
)
router.add_api_route("/save_landmarks", Face_controller.save_landmarks, methods=["POST"])

