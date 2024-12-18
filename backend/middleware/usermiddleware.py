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
    async def dispatch(self, request: Request, call_next):
        user_service = UserService()
        # Restrict access to /get_all_user
        if request.url.path == "/api/users/get_all_user":
            credentials: HTTPAuthorizationCredentials = await self.bearer_scheme(request)
            token = credentials.credentials  # Extract token
            if token is None:
                # Deny access if no token
                return JSONResponse(status_code=401, content={"detail": "Missing token"})
            payload = user_service.extract_token(token)
            print(payload)
            employee_id = payload.get("sub")
            print(employee_id)
            user = await user_service.get_user_by_employee_id(employee_id)
            # print(user.data)
            # Simulate admin check (e.g., token, headers, etc.)
            if user.data is None or user.data['roles'] != "ADMIN":
                # Deny access if not admin
                return JSONResponse(status_code=403, content={"detail": "Admin access only"})

        # Allow other routes to proceed normally
        response = await call_next(request)
        return response
    
    