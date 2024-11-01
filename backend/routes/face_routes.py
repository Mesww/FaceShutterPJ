from fastapi import APIRouter
from backend.controllers import face_controller 
# from backend.models.face_model import FaceEmbedding 

router = APIRouter(
    tags=["face-authentication"]
)
        
router.add_api_route("/authenticate", face_controller.authenticate_user, methods=["POST"])
router.add_api_route("/register", face_controller.register_user, methods=["POST"])
