
import json
from typing import Dict,Any, List, Union
import numpy as np
from sqlalchemy import func
from backend.models.face_model import User, RoleEnum
from backend.utills.embedding_utils import EmbeddingComparator, euclidean_distance 
from backend.configs.config import SIMILARITY_THRESHOLD 
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession

# Example stored embedding
stored_embedding = np.array([0.1, -0.2, ..., 0.05])  # Replace with actual stored embedding

# Function to compare embeddings
# def compare_embeddings(received_embedding):
#     distance = euclidean_distance(stored_embedding, received_embedding)
#     is_same_person = distance < SIMILARITY_THRESHOLD
#     return {
#         "isSamePerson": is_same_person,
#         "distance": distance
#     }


class FaceAuthService:
    @staticmethod
    async def register_user(
        db: AsyncSession, 
        employee_id: str,
        name: str,
        input_embedding: Union[str, List[float], bytes],
        additional_metadata: Dict[str, Any] = None
    ) -> User:
        """
        Register a new user with face embedding
        
        Args:
            db (AsyncSession): Database session
            username (str): User's username
            email (str): User's email
            input_embedding (Union[str, List[float], bytes]): Face embedding
            additional_metadata (Dict[str, Any], optional): Additional user metadata
        
        Returns:
            User: Newly created user
        """
        try:
           
            # Validate if user already exists
            existing_user = await db.execute(
                select(User).filter(
                    (User.employee_id == employee_id) 
                )
            )
            # Normalize embedding
            normalized_embedding = EmbeddingComparator.convert_embedding_to_numpy(input_embedding)
            embedding_binary = normalized_embedding.tobytes()
            if existing_user.scalar_one_or_none():
                print('User already exists')
                old_user = await FaceAuthService.authenticate_user(db, embedding_binary)
                return old_user
            
            # Convert embedding to storable format (JSON string)
            # embedding_json = json.dumps(normalized_embedding.tolist())
            # print(RoleEnum.USER.value)
            # Create new user
            new_user = User(
                roles=RoleEnum["USER"],
                employee_id=employee_id,
                name=name,
                embedding=embedding_binary,
                metadata=json.dumps(additional_metadata) if additional_metadata else None
            )
            
            # Add and commit
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            
            return new_user
        
        except Exception as e:
            await db.rollback()
            raise ValueError(f"Registration failed: {str(e)}")
    
    @staticmethod
    async def authenticate_user(
        db: AsyncSession, 
        input_embedding: Union[str, List[float], bytes]
    ):
        """
        Authenticate user by comparing embeddings
        
        Args:
            db (AsyncSession): Database session
            input_embedding (Union[str, List[float], bytes]): Embedding to compare
        
        Returns:
            User or None: Authenticated user or None
        """
        try:
            # Fetch all users
            result = await db.execute(select(User))
            users = result.scalars().all()
            
            # Convert user embeddings and compare
            for user in users:
                comparison = EmbeddingComparator.compare_embeddings(
                    input_embedding, 
                    user.embedding
                )
                
                # If match is found
                if comparison['match']:
                    return user
            
            return None
        except Exception as e:
            raise