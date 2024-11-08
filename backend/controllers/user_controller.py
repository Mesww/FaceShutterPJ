import logging
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from backend.services.face_service import FaceAuthService
from backend.services.user_service import UserService
from backend.models.user_model import User
from backend.configs.db import get_async_db
from pydantic import BaseModel

# โมเดลสำหรับการลงทะเบียนผู้ใช้
class RegisterUserRequest(BaseModel):
    name: str
    email: str
    employee_id: str

# โมเดลสำหรับการอัปเดตข้อมูลผู้ใช้
class UpdateUserRequest(BaseModel):
    name: str
    email: str

router = APIRouter()

class UserController:

    @staticmethod
    @router.post("/register")
    async def register_user(
        request: RegisterUserRequest,
        db: AsyncSession = Depends(get_async_db)
    ):
        try:
            user, message = await UserService.register_user(
                db=db,
                name=request.name,
                email=request.email,
                employee_id=request.employee_id
            )
            if user is None:
                raise HTTPException(status_code=400, detail=message)
            
            return {"message": message, "user_id": user.id}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    @router.delete("/delete/{user_id}")
    async def delete_user(
        user_id: str,
        db: AsyncSession = Depends(get_async_db)
    ):
        try:
            success, message = await UserService.delete_user(db=db, user_id=user_id)
            if not success:
                raise HTTPException(status_code=400, detail=message)
            
            return {"message": message, "user_id": user_id}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    @router.get("/users/{user_id}")
    async def get_user(
        user_id: str,
        db: AsyncSession = Depends(get_async_db)
    ):
        try:
            user = await UserService.get_user(db=db, user_id=user_id)
            if user is None:
                raise HTTPException(status_code=404, detail="User not found")
            return {"user_id": user.id, "name": user.name, "email": user.email}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

    @staticmethod
    @router.put("/update/{user_id}")
    async def update_user(
        user_id: str,
        request: UpdateUserRequest,
        db: AsyncSession = Depends(get_async_db)
    ):
        try:
            user, message = await UserService.update_user(
                db=db,
                user_id=user_id,
                name=request.name,
                email=request.email
            )
            if user is None:
                raise HTTPException(status_code=400, detail=message)
            
            return {"message": message, "user_id": user.id}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))


    @router.post("/edit")   
    async def edit_user(
        employee_id: int = Form(...),
        name: Optional[str] = Form(None),
        image: Optional[UploadFile] = File(None),
        db: AsyncSession = Depends(get_async_db)
    ):
        try:
            logging.info(f"Editing user: {employee_id}")
            
            # Call service to edit user
            user = await FaceAuthService.edit_user(
                db=db,
                employee_id=employee_id,
                name=name,
                image=image
            )
            
            if user is None:
                raise HTTPException(status_code=404, detail="User not found")
                
            return {
                "message": "User updated successfully",
                "employee_id": user.employee_id,
                "name": user.name
            }
            
        except Exception as e:
            logging.error(f"Error editing user: {e}")
            raise HTTPException(status_code=400, detail=str(e))


