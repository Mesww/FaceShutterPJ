from pydantic import BaseModel
from typing import List

class EmbeddingData(BaseModel):
    embedding: List[float]
