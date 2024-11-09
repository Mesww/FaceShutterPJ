import json
import os
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.user_model import User
from sqlalchemy.future import select
from fastapi import File, HTTPException, UploadFile

from backend.utils.image_utils import ImageCompairUtils
base_dir = Path(__file__).resolve().parent.parent
image_storage_path = os.path.join(base_dir, 'images')
class UserService:
    
    @staticmethod
    async def register_user(
        db: AsyncSession,
        name: str,
        email: str,
        employee_id: str
    ) -> Tuple[Optional[User], str]:
        try:
            # ตรวจสอบว่าอีเมลหรือรหัสพนักงานนี้มีผู้ใช้แล้ว
            stmt = select(User).filter(User.email == email)
            result = await db.execute(stmt)
            existing_user = result.scalar_one_or_none()
            if existing_user:
                return None, "Email already registered"
            
            # สร้างผู้ใช้ใหม่
            new_user = User(
                name=name,
                email=email,
                employee_id=employee_id
            )
            
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            return new_user, "User registered successfully"
        except Exception as e:
            await db.rollback()
            raise HTTPException(status_code=400, detail=f"Registration failed: {str(e)}")

    @staticmethod
    async def delete_user(
        db: AsyncSession,
        user_id: str
    ) -> Tuple[bool, str]:
        try:
            stmt = select(User).filter(User.users_id == user_id)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            
            if user is None:
                return False, "User not found"
            
            await db.delete(user)
            await db.commit()
            return True, "User deleted successfully"
        except Exception as e:
            await db.rollback()
            return False, f"Failed to delete user: {str(e)}"

    @staticmethod
    async def get_user(
        db: AsyncSession,
        user_id: str
    ) -> Optional[User]:
        try:
            stmt = select(User).filter(User.id == user_id)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            return user
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch user: {str(e)}")

    @staticmethod
    async def edit_user(
        db: AsyncSession,
        employee_id: int,
        name: str | None,
        image: UploadFile | None = File(...),
        additional_metadata: Optional[Dict[str, Any]] = None
    ) -> User:
        """
        Edit user details
        
        Args:
            db: Database session
            employee_id: Employee_id unique identifier
            name: User's name
            additional_metadata: Optional additional user data
            
        Returns:
            User object
        """
        try:
            print('Editing user')
            # Fetch user
            stmt = select(User).filter(User.employee_id == employee_id)
            result = await db.execute(stmt)
            results = result.scalars().all()
            if len(results) > 1:
                raise ValueError("Multiple users found with same employee_id")
            user = results[0]
            
            print('User:',user.name)
            if user is None:
                raise ValueError("User not found")
            
            # Update user details
            if name and image:
                
                user.name = name
                image_name = await ImageCompairUtils.random_name_image(image.filename)
                """
                    Delete old image and upload new image 
                """ 
                delete_success = await ImageCompairUtils.delete_Image(os.path.join(image_storage_path, user.image_name))
                if not delete_success:
                    raise ValueError("Failed to delete old image")
                upload_success = await ImageCompairUtils.upload_image(image, os.path.join(image_storage_path, image_name))
                if not upload_success:
                    raise ValueError("Failed to upload image")
                user.image_name = image_name
                
            elif name and not image:
                user.name = name
                
            elif image and not name:
                image_name = await ImageCompairUtils.random_name_image(image.filename)
                """ Delete old image and upload new image """ 
                delete_success = await ImageCompairUtils.delete_Image(os.path.join(image_storage_path, user.image_name))
                if not delete_success:
                    raise ValueError("Failed to delete old image")
                upload_success = await ImageCompairUtils.upload_image(image, os.path.join(image_storage_path, image_name))
                if not upload_success:
                    raise ValueError("Failed to upload image")
                user.image_name = image_name
            
            user.metadata = json.dumps(additional_metadata) if additional_metadata else None
            await db.commit()
            await db.refresh(user)
            return user
        
        except Exception as e:
            await db.rollback()
            raise ValueError(f"Failed to edit user: {str(e)}")
