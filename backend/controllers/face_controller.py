import json
from typing import Union,List
from pydantic import BaseModel
from backend.services.face_service import FaceAuthService
from backend.models.face_model import FaceEmbedding 
from sqlalchemy.ext.asyncio import AsyncSession
from backend.configs.db import get_async_db
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile


# models.py
from fastapi import File, Form, UploadFile
from pydantic import BaseModel
from typing import Optional

# We need to create separate models for request validation
class RegisterUserBase(BaseModel):
    name: str
    employee_id: str

class RegisterUserRequest:
    def __init__(
        self,
        image: UploadFile = File(...),
        name: str = Form(...),
        employee_id: str = Form(...),
    ):
        self.image = image
        self.name = name
        self.employee_id = employee_id

# routes.py
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from backend.configs.db import get_async_db
from backend.services.face_service import FaceAuthService

router = APIRouter()

@router.post("/register")
async def register_user(
    image: UploadFile = File(...),
    name: str = Form(...),
    employee_id: str = Form(...),
    db: AsyncSession = Depends(get_async_db)
):
    try:
        # Create request object with the received data
        request = RegisterUserRequest(
            image=image,
            name=name,
            employee_id=employee_id
        ) 
        
        # Call the service method with corrected parameters
        user, similarity,message = await FaceAuthService.registerface_user(
            db=db,
            name=request.name,
            employee_id=request.employee_id,
            input_image=request.image
        )
        
        if user is None:
            raise HTTPException(
                status_code=400, 
                detail=message
            )
            
        return {
            "message": message,
            "user_id": user.users_id,
            "name": user.name,
            "similarity":similarity
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

