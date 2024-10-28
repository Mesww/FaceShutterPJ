from fastapi import FastAPI
from backend.routes import face_routes 

app = FastAPI()

# Include routes from face_routes
app.include_router(face_routes.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

