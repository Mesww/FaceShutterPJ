import json
import os
from pathlib import Path
from typing import Any, Dict, Optional, Tuple
from numpy import ndarray
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
        employee_id: str
    ) -> dict:
        try:
            print(f'Fetching user with employee_id: {employee_id}')
            stmt = select(User).filter(User.employee_id == employee_id)
            result = await db.execute(stmt)
            user = result.scalar_one_or_none()
            if user is None:
                raise ValueError("User not found")
            # get image
            image_path = os.path.join(image_storage_path, user.image_name)
            image = ImageCompairUtils.find_Image(image_path)
            convert_image = ImageCompairUtils.convert_cv2_to_base64(image=image)
            return {
            "user": {
                "employee_id": user.employee_id,
                "name": user.name,
                "email": user.email,
                "tel": user.tel,
                # Add other user fields you need
            },
            "image": {
                "filename": user.image_name,
                "data": convert_image
            }
        }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch user: {str(e)}")
    # async def uploadanddelete():
        

    @staticmethod
    async def edit_user(
        db: AsyncSession,
        employee_id: int,
        name: Optional[str] = None,
        image: Optional[UploadFile] = None,
        email: Optional[str] = None,
        tel: Optional[str] = None,
        additional_metadata: Optional[Dict[str, Any]] = None
    ) -> User:
        try:
            # Fetch user
            stmt = select(User).filter(User.employee_id == employee_id)
            result = await db.execute(stmt)
            results = result.scalars().all()
            if len(results) > 1:
                raise ValueError("Multiple users found with same employee_id")
            if not results:
                raise ValueError("User not found")
            
            user = results[0]
            
            # Update basic fields if provided
            if name is not None:
                user.name = name
            if email is not None:
                user.email = email
            if tel is not None:
                user.tel = tel

            # Handle image upload if provided
            if image:
                try:
                    # Generate new image name
                    new_image_name = ImageCompairUtils.random_name_image(image.filename)
                    new_image_path = os.path.join(image_storage_path, new_image_name)
                    
                    # Delete old image if exists
                    if user.image_name:
                        old_image_path = os.path.join(image_storage_path, user.image_name)
                        ImageCompairUtils.delete_Image(old_image_path)
                    
                    # Upload new image
                    upload_success = await ImageCompairUtils.upload_image(image, new_image_path)
                    if not upload_success:
                        raise ValueError("Failed to upload image")
                    
                    user.image_name = new_image_name
                except Exception as e:
                    raise ValueError(f"Image processing failed: {str(e)}")

            # Update additional metadata if provided
            if additional_metadata is not None:
                user.metadata = json.dumps(additional_metadata)

            await db.commit()
            await db.refresh(user)
            return user
            
        except Exception as e:
            await db.rollback()
            raise ValueError(f"Failed to edit user: {str(e)}")
 
