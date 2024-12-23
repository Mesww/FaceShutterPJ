from pathlib import Path
import re
from dotenv import dotenv_values, load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware

from backend.services.user_service import UserService

class UserMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.bearer_scheme = HTTPBearer()
        
        # Add public routes that don't need authentication
        self.public_routes = {
            "/health",
            "/get_public_key",
            "/api/auth/login",
            "/api/auth/generate_password/{password}",
            "/api/users/get_is_user_by_employee_id/{employee_id}",
            "/api/checkinout/is_checkinorout_time_valid/{time}",
            "/api/checkinout/is_already_checked_in_out_today",
            "/api/checkinout/is_already_checked_in_today",
            "/api/checkinout/is_already_checked_out_today",
            # Add other public routes as needed
        }
        
        self.protected_routes = {
            "/api/users/get_all_user": ["ADMIN"],
            "/api/users/delete_user/{employee_id}": ["ADMIN"],
            "/api/users/update_user_by_employee_id/{employee_id}": ["ADMIN"],
            "/api/users/add_admin": ["ADMIN"],
            "/api/logs/createlog": ["ADMIN"],
            "/api/logs/editlog": ["ADMIN"],
            "/api/history/migrate_to_history": ["ADMIN"],
            "/api/history/get_all_history_records/{start_date}/{end_date}": ["ADMIN"],
            "/api/checkinout/get_today_records": ["ADMIN"],

            "/api/users/get_user_by_employee_id": ["ADMIN", "USER"],
            "/api/users/update_user": ["ADMIN", "USER"],
            "/api/logs/getlogs": ["ADMIN", "USER"],
            "/api/history/get_history_records/{employee_id}/{start_date}/{end_date}": ["ADMIN", "USER"],
            "/api/checkinout/checkin": ["ADMIN", "USER"],
            "/api/checkinout/checkout": ["ADMIN", "USER"],
            
        }

    async def dispatch(self, request: Request, call_next):
      
        # Always allow OPTIONS requests
        if request.method == "OPTIONS":
            response = await call_next(request)
            return response

        path = request.url.path
        
        # Check if path is public
        if any(path.startswith(public_path) for public_path in self.public_routes):
            return await call_next(request)

        # For protected routes
        if any(path.startswith(protected_path.split("{")[0]) for protected_path in self.protected_routes.keys()):
            try:
                credentials: HTTPAuthorizationCredentials = await self.bearer_scheme(request)
                token = credentials.credentials
                
                if not token:
                    return JSONResponse(
                        status_code=401,
                        content={"detail": "Missing token"}
                    )

                user_service = UserService()
                payload = user_service.extract_token(token)
                employee_id = payload.get("sub")
                user = await user_service.get_user_by_employee_id(employee_id)

                if user.data is None:
                    return JSONResponse(
                        status_code=401,
                        content={"detail": "Invalid user"}
                    )

                # Check role access for exact path matches
                exact_path_match = next((route for route in self.protected_routes if path.startswith(route.split("{")[0])), None)
                if exact_path_match and user.data['roles'] not in self.protected_routes[exact_path_match]:
                    return JSONResponse(
                        status_code=403,
                        content={"detail": f"Access denied. Required roles: {self.protected_routes[exact_path_match]}"}
                    )

            except Exception as e:
                return JSONResponse(
                    status_code=401,
                    content={"detail": str(e)}
                )

        return await call_next(request)