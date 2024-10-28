from backend.services.face_service import compare_embeddings 
from backend.models.face_model import EmbeddingData 

# Controller function to handle embedding comparison requests
async def compare_embedding(data: EmbeddingData):
    return compare_embeddings(data.embedding)
