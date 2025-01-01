from fastapi import APIRouter
from pydantic import BaseModel
from backend.services.auth_service import AdminAuthenticationService
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from backend.configs.config import private_key
from backend.services.user_service import UserService
router = APIRouter()
class loginRequest(BaseModel):
    employeeid: str
    password: str
class AdminAuthController:
    def __init__(self):
        self.auth_service = AdminAuthenticationService()
        self.user_service = UserService()
    @router.get("/generate_password/{password}")
    async def generate_password(self, password: str):
        password = self.auth_service.hash_password(password=password)
        return {"password": password}
    @router.post("/login")
    async def login(self, request: loginRequest):
     try:
        data = request.model_dump()
        
        encrypted_employee_id = bytes.fromhex(data['employeeid'])
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
        
        is_authenticated,message = await self.auth_service.login(employee_id, password)
        if not is_authenticated:
            return {"status": 400, "message": message}
        token = self.user_service.generate_token(employee_id)
        return {"status": 200, "message": message,"token": token}
     except Exception as e:
        return {"status": 400, "message": str(e)}