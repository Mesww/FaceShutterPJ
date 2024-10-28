import numpy as np
from backend.utills.embedding_utils import euclidean_distance 
from backend.configs.config import SIMILARITY_THRESHOLD 

# Example stored embedding
stored_embedding = np.array([0.1, -0.2, ..., 0.05])  # Replace with actual stored embedding

# Function to compare embeddings
def compare_embeddings(received_embedding):
    distance = euclidean_distance(stored_embedding, received_embedding)
    is_same_person = distance < SIMILARITY_THRESHOLD
    return {
        "isSamePerson": is_same_person,
        "distance": distance
    }
