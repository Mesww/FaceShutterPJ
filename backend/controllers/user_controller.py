import logging
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from backend.services.user_service import UserService
from backend.models.user_model import  User, Userupdate

# โมเดลสำหรับการลงทะเบียนผู้ใช้


router = APIRouter()

class UserController:
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
    @router.get("/get_user_by_employee_id/{employee_id}")
    async def get_user_by_employee_id(
        employee_id: str,
    ):
        try:
            res = await UserService.get_user_by_employee_id(employee_id)
            return res
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    @staticmethod
    @router.get("/get_user_by_employee_id/{employee_id}")
    async def get_is_user_by_employee_id(
        employee_id: str,
    ):
        try:
            res = await UserService.get_is_user_by_employee_id(employee_id)
            return res
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
        
    # @staticmethod
    # @router.post("/auth")
    # async def authenticate_user(
    #     employee_id: str = Form(...),
    # ):
    #     try:
    #         res = await UserService.authenticate_user(employee_id)
    #         if res.status >= 400:
    #             raise HTTPException(status_code=400, detail=res.message)
    #         return res
    #     except Exception as e:
    #         raise HTTPException(status_code=400, detail=str(e))
        






 