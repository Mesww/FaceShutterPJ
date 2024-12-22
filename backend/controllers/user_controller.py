import logging
from typing import Optional
from fastapi import APIRouter, File, Form, HTTPException, Depends, Header, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from backend.services.auth_service import AdminAuthenticationService
from backend.services.user_service import UserService
from backend.models.user_model import  RoleEnum, User, Userupdate
import json
from backend.configs.config import private_key
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
# โมเดลสำหรับการลงทะเบียนผู้ใช้


router = APIRouter()

class UserController:
    security = HTTPBearer()
    
    @staticmethod
    @router.post("/add_admin")
    async def add_admin(
        request: User,
    ):
        try:
            data = request.model_dump()
            adminAuthenserive = AdminAuthenticationService()
            # encrypted employee_id and password
            encrypted_employee_id = bytes.fromhex(data['employee_id'])
            encrypted_password = bytes.fromhex(data['password'])
            employee_id = private_key.decrypt(
            encrypted_employee_id,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )).decode('utf-8')
            password = private_key.decrypt(
            encrypted_password,
            padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )).decode('utf-8')
            
            # hash password
            password = adminAuthenserive.hash_password(password)
            
            request.employee_id = employee_id
            request.password = password
            request.roles = RoleEnum.ADMIN
            
            res = await UserService.add_admin(
                request
            )   
            if res.status >= 400:
                raise HTTPException(status_code=400, detail=res.message)
            return res
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
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
    @router.put("/update_user_by_employee_id/{employee_id}")
    async def update_user_by_employee_id(
        employee_id: str,
        request: Userupdate,
    ):
        try:
            data = request.model_dump()
            if data['password']:
                adminAuthenserive = AdminAuthenticationService()
                encrypted_password = bytes.fromhex(data['password'])
                password = private_key.decrypt(
                encrypted_password,
                padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )).decode('utf-8')
                password = adminAuthenserive.hash_password(password)
                request.password = password
                
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
            print(employee_id)
           
            # print(employee_id)
            # employee_id = int(employee_id["sub"])
            # print(employee_id)
            res = await userservice.get_user_by_employee_id(employee_id.get('sub'))
            print(res.to_json())
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
            # print(credentials.credentials)
            employee_id = userservice.extract_token(token=credentials.credentials)
            # print(request)
            res = await UserService.update_user_by_employee_id(
                employee_id.get('sub'),
                request
            )
            # print(res.status)
            if res.status >= 400:
                raise HTTPException(status_code=400, detail=res.message)
            return res.to_json()
            # return {"status": 200, "message": "success"}
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    
    # @staticmethod
    # @router.put("/update_user_by_employee_id/{employee_id}")
    # async def update_user(
    #     request: Userupdate,
    #     employee_id: str,
    # ):
    #     try:
    #         res = await UserService.update_user_by_employee_id(
    #             employee_id,
    #             request
    #         )
    #         if res.status >= 400:
    #             raise HTTPException(status_code=400, detail=res.message)
    #         return res.to_json()
    #     except Exception as e:
    #         raise HTTPException(status_code=400, detail=str(e))
    @staticmethod
    @router.get("/get_all_user")
    async def getAllUser():
        try:
            res = await UserService.getAllUser()
            return res
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
    @staticmethod
    @router.delete("/delete_user/{employee_id}")
    async def delete_user(employee_id: str):
        try:
            res = await UserService.delete_user_by_employee_id(employee_id)
            if res.status >= 400:
                raise HTTPException(status_code=400, detail=res.message)
            return res.to_json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))