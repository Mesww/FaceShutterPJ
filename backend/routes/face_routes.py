from fastapi import APIRouter
from backend.controllers import face_controller 
from backend.models.face_model import EmbeddingData 

router = APIRouter()

# Route for comparing embeddings
@router.post("/compare-embedding")
async def compare_embedding(data: EmbeddingData):
    return await face_controller.compare_embedding(data)

