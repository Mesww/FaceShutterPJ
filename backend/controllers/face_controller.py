import json
from typing import Union,List
from pydantic import BaseModel
from backend.services.face_service import FaceAuthService
from backend.models.face_model import FaceEmbedding 
from sqlalchemy.ext.asyncio import AsyncSession
from backend.configs.db import get_async_db
from fastapi import APIRouter, Depends, HTTPException


class RegisterUserRequest(BaseModel):
    embedding: List[List[float]]  # 2D list for embeddings
    name: str
    employee_id: str

# async def register_user(request: RegisterUserRequest):
#     print('Received payload:', request)  # Log the received payload
#     try:
#         # Your logic here
#         return {"message": "User registered successfully"}
#     except Exception as e:
#         print(f"Error processing request: {e}")  # Log any error
#         raise HTTPException(status_code=422, detail=str(e))

async def register_user(
    request: RegisterUserRequest,
    db: AsyncSession = Depends(get_async_db)
):
    try:
        # print("Raw request data:", json.dumps(request.dict()))
        # Convert embeddings to binary
        # Register user with embedding
        user, is_new = await FaceAuthService.register_user(db, request.employee_id, request.name, request.embedding)
        if not is_new:
            return {
                "message": "Authenticate successfully",
                "user_id": user.users_id,
                "name": user.name
            }
        elif user is None:
            raise HTTPException(status_code=400, detail="User already exists, Please scan again")
        return {
            "message": "User registered successfully",
            "user_id": user.users_id,
            "name": user.name
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


async def authenticate_user(
    embedding: str,  # JSON string or list of floats
    db: AsyncSession = Depends(get_async_db)
):
    try:
        # Authenticate using embedding
        user = await FaceAuthService.authenticate_user(db, embedding)
        
        if user:
            return {
                "message": "Authentication successful",
                "user_id": user.id,
                "username": user.username
            }
        else:
            raise HTTPException(status_code=401, detail="Authentication failed")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))