import json
from typing import List, Union
import numpy as np

import face_recognition
from fastapi import UploadFile
import io

# Calculate Euclidean distance between two embeddings
def euclidean_distance(embedding1, embedding2):
    return np.linalg.norm(np.array(embedding1) - np.array(embedding2))

class EmbeddingComparator:
    @staticmethod
    def convert_embedding_to_numpy(embedding: Union[str, List[float], bytes]) -> np.ndarray:
        """
        Convert various embedding formats to numpy array
        
        Args:
            embedding (Union[str, List[float], bytes]): Embedding in different formats
        
        Returns:
            np.ndarray: Numpy array of embedding
        """
        # If it's a string (potentially JSON), parse it
        if isinstance(embedding, str):
            try:
                # Try parsing as JSON
                embedding = json.loads(embedding)
            except json.JSONDecodeError:
                # If not JSON, try converting from string of numbers
                embedding = [float(x) for x in embedding.strip('[]').split(',')]
        
        # If it's a list, convert to numpy array
        if isinstance(embedding, list):
            return np.array(embedding, dtype=np.float32)
        
        # If it's bytes, convert to numpy array
        if isinstance(embedding, bytes):
            return np.frombuffer(embedding, dtype=np.float32)
        
        raise ValueError("Invalid embedding format")

    @staticmethod
    def compare_embeddings(
        embedding1: Union[str, List[float], bytes], 
        embedding2: Union[str, List[float], bytes], 
        tolerance: float = 0.6
    ) -> dict:
        """
        Compare two face embeddings
        
        Args:
            embedding1 (Union[str, List[float], bytes]): First embedding
            embedding2 (Union[str, List[float], bytes]): Second embedding
            tolerance (float): Similarity threshold
        
        Returns:
            dict: Comparison results
        """
        try:
            # Convert embeddings to numpy arrays
            vec1 = EmbeddingComparator.convert_embedding_to_numpy(embedding1)
            vec2 = EmbeddingComparator.convert_embedding_to_numpy(embedding2)
            
            # Validate embedding dimensions
            if vec1.shape != vec2.shape:
                return {
                    "match": False,
                    "error": "Embedding dimensions do not match",
                    "distance": None
                }
            
            # Calculate Euclidean distance
            distance = np.linalg.norm(vec1 - vec2)
            
            # Determine match based on tolerance
            is_match = distance <= tolerance
            
            return {
                "match": is_match,
                "distance": float(distance),
                "tolerance": tolerance
            }
        
        except Exception as e:
            return {
                "match": False,
                "error": str(e),
                "distance": None
            }

    @staticmethod
    def batch_compare_embeddings(
        source_embedding: Union[str, List[float], bytes], 
        embedding_list: List[Union[str, List[float], bytes]], 
        tolerance: float = 0.6
    ) -> List[dict]:
        """
        Compare a source embedding against multiple embeddings
        
        Args:
            source_embedding (Union[str, List[float], bytes]): Source embedding to compare
            embedding_list (List[Union[str, List[float], bytes]]): List of embeddings to compare against
            tolerance (float): Similarity threshold
        
        Returns:
            List[dict]: Comparison results for each embedding
        """
        results = []
        for idx, embedding in enumerate(embedding_list):
            comparison = EmbeddingComparator.compare_embeddings(
                source_embedding, 
                embedding, 
                tolerance
            )
            comparison['index'] = idx
            results.append(comparison)
        
        return results