
import json
import os
from pathlib import Path
from typing import Dict,Any, List, Optional, Tuple, Union
from dotenv import dotenv_values, load_dotenv
from fastapi import File, Form, HTTPException, UploadFile
import numpy as np
# from pydantic import BaseModel
from sqlalchemy import func
from backend.models.user_model import User, RoleEnum
from backend.utils.embedding_utils import EmbeddingComparator, euclidean_distance 

from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.configs.config import SIMILARITY_THRESHOLD 
from backend.utils.image_utils import ImageCompairUtils
pathenv = Path('./.env')
load_dotenv(dotenv_path=pathenv)
config = dotenv_values()

# Example stored embedding
stored_embedding = np.array([0.1, -0.2, ..., 0.05])  # Replace with actual stored embedding




base_dir = Path(__file__).resolve().parent.parent
image_storage_path = os.path.join(base_dir, 'images')

    

class FaceAuthService:
    @staticmethod
    async def registerface_user(
        db: AsyncSession,
        name: str,
        employee_id: str,
        input_image: UploadFile,
        additional_metadata: Optional[Dict[str, Any]] = None
    ) -> Tuple[Optional[User], float, str]:
        """
        Register a new user or authenticate existing user.
        
        Args:
            db: Database session
            name: User's name
            employee_id: Unique employee identifier
            input_image: User's face image
            additional_metadata: Optional additional user data
            
        Returns:
            Tuple containing:
            - User object or None
            - Similarity score (0-100)
            - Status message
        """
        
        try:
            # Ensure image storage directory exists
            os.makedirs(image_storage_path, exist_ok=True)
            
            # Generate unique image name
            image_name = ImageCompairUtils.random_name_image(input_image.filename)
            image_path = os.path.join(image_storage_path, image_name)
            
            # Check for existing user with same employee_id
            stmt = select(User).filter(User.employee_id == employee_id)
            result = await db.execute(stmt)
            existing_user_by_id = result.scalar_one_or_none()
            
            # Check if face matches any existing user
            matching_user = await FaceAuthService.check_user_exists_with_images(db, input_image)
            print('Matching User:',matching_user is None)
            # Case 1: No matching face and no matching employee_id - New Registration
            if matching_user is None and existing_user_by_id is None:
                # Upload new image
                uploaded = await ImageCompairUtils.upload_image(input_image, image_path)
                if not uploaded:
                    raise ValueError("Failed to upload image")
                
                # Create new user
                new_user = User(
                    roles=RoleEnum.USER,
                    employee_id=employee_id,
                    name=name,
                    image_name=image_name,
                    metadata=json.dumps(additional_metadata) if additional_metadata else None
                )
                
                db.add(new_user)
                await db.commit()
                await db.refresh(new_user)
                return new_user, 100.0, 'User registered successfully'
            
            # Case 2: Matching face exists but employee_id doesn't match
            if matching_user is not None and matching_user.employee_id != employee_id:
                return None, 0.0, 'Face already registered with different employee ID'
            
            # Case 3: Matching face and matching employee_id - Authentication
            if matching_user is not None and matching_user.employee_id == employee_id:
                # Verify face similarity
                old_path = os.path.join(image_storage_path, matching_user.image_name)
                old_image = ImageCompairUtils.find_Image(old_path)
                if old_image is None:
                    raise ValueError(f"Could not load existing image at {old_path}")
                
                new_image = await ImageCompairUtils.convert_uploadfile_to_cv2(input_image)
                if new_image is None:
                    raise ValueError("Failed to load new image")
                
                similarity,error = await ImageCompairUtils.compare_images(old_image, new_image)
                if error is not None:
                    return None, 0.0, error
                # Handle similarity comparison properly
                if isinstance(similarity, (int, float)) and similarity >= SIMILARITY_THRESHOLD:
                    return matching_user, float(similarity), 'User authenticated successfully'
                return None, float(similarity) if isinstance(similarity, (int, float)) else 0.0, 'Face verification failed'
            
            # Case 4: No matching face but employee_id exists
            if existing_user_by_id is not None and matching_user is None:
                return None, 0.0, 'Employee ID exists but face does not match'
            
            return None, 0.0, 'Authentication failed'
            
        except Exception as e:
            await db.rollback()
            raise ValueError(f"Registration/Authentication failed: {str(e)}")
    
  

        
    @staticmethod
    async def check_user_exists_with_images(
        db: AsyncSession,
        image: UploadFile
    ) -> (User | None):
        """
        Check if user exists with image
        
        Args:
            db (AsyncSession): Database session
            image (UploadFile): Image to compare
        
        Returns:
            User or None: User if found, None otherwise
        """
        all_users = await db.execute(select(User))
        all_users = all_users.scalars().all()
        print('All Users:', all_users.__len__())
        if len(all_users) == 0:
            print('No users found')
            return None
        for user in all_users:
            old_path = os.path.join(image_storage_path, user.image_name)
            old_image = ImageCompairUtils.find_Image(old_path)
            if old_image is None:
                return None
            new_image = await ImageCompairUtils.convert_uploadfile_to_cv2(image)
            if new_image is None:
                raise ValueError("Failed to load new image")
            similarity,error = await ImageCompairUtils.compare_images(old_image, new_image)
            print('similarity:',similarity)
            if error is not None:
                continue
            if similarity >= SIMILARITY_THRESHOLD:
                return user
        return None 
    
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