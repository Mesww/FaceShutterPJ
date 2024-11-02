
import json
from typing import Dict,Any, List, Tuple, Union
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
    ) -> Tuple[User | None, bool] : 
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
            # Normalize embedding
            normalized_embedding = EmbeddingComparator.convert_embedding_to_numpy(input_embedding)
            embedding_binary = normalized_embedding.tobytes()
            
            existing_user = await FaceAuthService.authenticate_user_by_users_id(db, embedding_binary, employee_id)
            check_user = await db.execute(select(User).filter(User.employee_id == employee_id))                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
            
            if existing_user not in [None]:
                old_user = await FaceAuthService.authenticate_user(db, embedding_binary)
                return old_user,False
            
            if check_user.scalar_one_or_none() is not None:
                # if user already exists but it can't authenticate_user , update the embedding
                """
                    ===== Mark Down =====  
                    when user already exists but it can't authenticate_user , 
                    what function Mahama wanted between
                    
                    update the embedding 
                    or
                    return error to the user and scan again
                    
                    ======================
                """ 
                
                return None,False
            
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
            
            return new_user,True
        
        except Exception as e:
            await db.rollback()
            raise ValueError(f"Registration failed: {str(e)}")
    
    
    
    @staticmethod
    async def authenticate_user_by_users_id(
        db: AsyncSession, 
        input_embedding: Union[str, List[float], bytes],
        employee_id: str
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
            # print('Authenticating user')
                        
            result = await db.execute(select(User).filter(User.employee_id == employee_id))
        
            # print('Fetching all users')
            user = result.scalar_one_or_none()
            # print('User fetched',user)
            # print('Users fetched')
            # Convert user embeddings and compare
            if user:

                # Compare embeddings
                comparison = EmbeddingComparator.compare_embeddings(
                    input_embedding, 
                    user.embedding
                )
                print('Comparison:',comparison)
                # If match is found
                if comparison['match']:
                    print('User authenticated')
                    return user
            
            return None
        except Exception as e:
            raise ValueError(f"Authentication failed: {str(e)}")
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
            # print('Authenticating user')
            # Fetch all users
            result = await db.execute(select(User))
            # print('Fetching all users')
            users = result.scalars().all()
            # print('Users fetched')
            # Convert user embeddings and compare
            for user in users:
                comparison = EmbeddingComparator.compare_embeddings(
                    input_embedding, 
                    user.embedding
                )
                
                # If match is found
                if comparison['match']:
                    print('User authenticated')
                    return user
            
            return None
        except Exception as e:
            raise