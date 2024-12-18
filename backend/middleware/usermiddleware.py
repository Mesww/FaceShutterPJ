import re
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware

class UserMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        self.bearer_scheme = HTTPBearer()
    async def dispatch(self, request: Request, call_next):
        # Restrict access to /getallusers
        if request.url.path == "/getallusers":
            credentials: HTTPAuthorizationCredentials = await self.bearer_scheme(request)
            token = credentials.credentials  # Extract token
            # Simulate admin check (e.g., token, headers, etc.)
            admin_token = request.headers.get("X-Admin-Token")
            if admin_token != "secret-admin-token":
                # Deny access if not admin
                return JSONResponse(status_code=403, content={"detail": "Admin access only"})

        # Allow other routes to proceed normally
        response = await call_next(request)
        return response