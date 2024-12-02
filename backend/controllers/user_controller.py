import logging
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, Depends, Header, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from backend.services.user_service import UserService
from backend.models.user_model import  User, Userupdate
import json

# โมเดลสำหรับการลงทะเบียนผู้ใช้


router = APIRouter()

class UserController:
    security = HTTPBearer()
    @staticmethod
    @router.post("/register")
    async def register_user(
        request: User,
    ):
        try:
            print('Registing...')
            res = await UserService.register_user(
             request
            )
            print(res.status)
            if res.status >= 400:
                raise HTTPException(status_code=400, detail=res.message)
            if res.to_json() is None:
                raise HTTPException(status_code=400, detail=res.message)
            print('Register complete')
            
            return res
        
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    @staticmethod
    @router.put("/update")
    async def update_user_by_employee_id(
        employee_id: str,
        request: Userupdate,
    ):
        try:
            res = await UserService.update_user_by_employee_id(
                employee_id,
                request
            )
            if res.status >= 400:
                raise HTTPException(status_code=400, detail=res.message)
            return res
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    @staticmethod
    @router.get("/get_user_by_employee_id")
    async def get_user_by_employee_id(
        credentials: HTTPAuthorizationCredentials = Depends(security)
    ):
        try:
            print(f'Getting user... {credentials.credentials}')
            userservice = UserService()
            employee_id = userservice.extract_token( token=credentials.credentials)
            print(employee_id.get('sub'))
           
            # print(employee_id)
            # employee_id = int(employee_id["sub"])
            # print(employee_id)
            res = await userservice.get_user_by_employee_id(employee_id.get('sub'))
            return res
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    @staticmethod
    @router.get("/get_is_user_by_employee_id/{employee_id}")
    async def get_is_user_by_employee_id(
        employee_id: str,
    ):
        try:
            res = await UserService.get_is_user_by_employee_id(employee_id)
            return res
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
        
    @staticmethod
    @router.put("/update_user")
    async def update_user(
        request: Userupdate,
        credentials: HTTPAuthorizationCredentials = Depends(security),
    ):
        try:
            userservice = UserService()
            employee_id = userservice.extract_token( token=credentials.credentials)
            res = await UserService.update_user_by_employee_id(
                employee_id.get('sub'),
                request
            )
            print(res.status)
            if res.status >= 400:
                raise HTTPException(status_code=400, detail=res.message)
            return res.to_json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))