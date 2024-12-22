import re
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware

from backend.services.user_service import UserService

class UserMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.bearer_scheme = HTTPBearer()
        
        # กำหนด paths และ roles ที่อนุญาตให้เข้าถึง
        self.protected_routes = {
            "/api/users/get_all_user": ["ADMIN"],
            "/api/users/create_user": ["ADMIN"],
            "/api/users/update_user": ["ADMIN"],
            "/api/users/delete_user": ["ADMIN"],
            "/api/reports/sensitive_data": ["ADMIN", "MANAGER"],
            "/api/settings": ["ADMIN", "MANAGER"]
        }

    async def dispatch(self, request: Request, call_next):
        user_service = UserService()
        current_path = request.url.path

        # ตรวจสอบว่า path ปัจจุบันอยู่ใน protected routes หรือไม่
        if current_path in self.protected_routes:
            try:
                credentials: HTTPAuthorizationCredentials = await self.bearer_scheme(request)
                token = credentials.credentials
                # print(token)
                if not token:
                    return JSONResponse(
                        status_code=401, 
                        content={"detail": "Missing token"}
                    )

                payload = user_service.extract_token(token)
                employee_id = payload.get("sub")
                user = await user_service.get_user_by_employee_id(employee_id)

                if user.data is None:
                    return JSONResponse(
                        status_code=401, 
                        content={"detail": "Invalid user"}
                    )   

                # ตรวจสอบว่า role ของ user อยู่ใน allowed roles หรือไม่
                if user.data['roles'] not in self.protected_routes[current_path]:
                    return JSONResponse(
                        status_code=403, 
                        content={"detail": f"Access denied. Required roles: {self.protected_routes[current_path]}"}
                    )

            except Exception as e:
                return JSONResponse(
                    status_code=401,
                    content={"detail": str(e)}
                )

        response = await call_next(request)
        return response