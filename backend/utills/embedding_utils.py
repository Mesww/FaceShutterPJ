import numpy as np

# Calculate Euclidean distance between two embeddings
def euclidean_distance(embedding1, embedding2):
    return np.linalg.norm(np.array(embedding1) - np.array(embedding2))
