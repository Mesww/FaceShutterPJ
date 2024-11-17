from pathlib import Path
from dotenv import dotenv_values, load_dotenv
from fastapi import FastAPI
from backend.routes import face_routes, user_routes 

from backend.configs.db import database, engine, Base
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

pathenv = Path('./.env')
load_dotenv(dotenv_path=pathenv)
config = dotenv_values()
FONTEND_URL = config.get('FRONTEND_URL', "http://localhost:5173")

app = FastAPI()

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React development server
        FONTEND_URL,  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan context
    - Connects to the database and creates tables if they don't exist
    - Disconnects from the database on shutdown
    """
    try:
        print("Connecting to the database")
        await database.connect()
        print("Successfully connected to the database")

        # Create tables if they don't exist
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        
        print("Database tables created successfully")

        # Yield control to the application
        yield
    finally:
        await database.disconnect()
        print("Successfully disconnected from the database")

# Assign the lifespan context to the app
app.router.lifespan_context = lifespan

# Health check endpoint
@app.get("/health")
async def health_check():
    """
    Simple health check endpoint
    """
    return {
        "status": "healthy",
        "message": "Application is running smoothly"
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return {
        "status": "error",
        "message": str(exc)
    }



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
