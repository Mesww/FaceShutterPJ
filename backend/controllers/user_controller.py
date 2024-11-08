import logging
from fastapi import File, UploadFile
from fastapi import File, Form, UploadFile
from pydantic import BaseModel
from typing import Optional
import json
from typing import Union,List
from pydantic import BaseModel
from backend.services.face_service import FaceAuthService
from backend.models.face_model import FaceEmbedding, User 
from sqlalchemy.ext.asyncio import AsyncSession
from backend.configs.db import get_async_db
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
# routes.py
from sqlalchemy.ext.asyncio import AsyncSession
from backend.configs.db import get_async_db
from backend.services.face_service import FaceAuthService
router = APIRouter()

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


async def get_user( employee_id: int = Form(...), db: AsyncSession = Depends(get_async_db))-> User:
    try:
        return
    except Exception as e :
        logging.error(f"Error get user: {e}")
        raise HTTPException(status_code=400,detail=str(e))