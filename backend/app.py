import asyncio
import base64
from pathlib import Path
import cv2
from dotenv import dotenv_values, load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import numpy as np
from backend.configs.config import SCAN_DIRECTION, ConnectionManager
from backend.routes import  face_routes, user_routes 

from fastapi.middleware.cors import CORSMiddleware

from backend.services.face_service import Face_service

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

app.include_router(
    user_routes.router,  # เพิ่มการรวม user_routes
    prefix="/api/users",  # Base path for user-related routes
    tags=["users"]
)
app.include_router(
    face_routes.router,  # เพิ่มการรวม user_routes
    prefix="/api/face",  # Base path for user-related routes
    tags=["face"]
)

manager = ConnectionManager()
@app.websocket("/ws/face-scan/{employee_id}")
async def websocket_endpoint(websocket: WebSocket, employee_id: str):
    await manager.connect(websocket, employee_id)
    current_direction_index = 0
    
    try:
        while current_direction_index < len(SCAN_DIRECTION):
            # Send current direction instruction
            await manager.send_message({
                "type": "instruction",
                "direction": SCAN_DIRECTION[current_direction_index]
            }, employee_id)
            
            # Receive frame data
            data = await websocket.receive_json()
            
            if data["type"] == "frame":
                # Decode base64 image
                img_data = base64.b64decode(data["frame"].split(',')[1])
                nparr = np.frombuffer(img_data, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                
                # Process frame using face service
                result = await Face_service.save_landmarks(
                    SCAN_DIRECTION[current_direction_index],
                    frame,
                    name=data.get("name", "Unknown"),
                    employee_id=data.get("employee_id", employee_id)
                )
                
                # Send result back to client
                await manager.send_message({
                    "type": "result",
                    "status": result.status,
                    "message": result.message,
                    "data": result.data
                }, employee_id)
                
                if result.status == 200:
                    current_direction_index += 1
                    print(current_direction_index)
                    await asyncio.sleep(3)
                elif result.status >= 400:
                    await manager.send_message({
                        "type": "error",
                        "message": result.message
                    }, employee_id)
                    manager.disconnect(employee_id)
                    break
            elif data["type"] == "complete":
                break
        await manager.send_message({
            "type": "complete",
            "message": "Face scan completed"
        }, employee_id)
    except WebSocketDisconnect:
        manager.disconnect(employee_id)
    except Exception as e:
        await manager.send_message({
            "type": "error",
            "message": str(e)
        }, employee_id)
    finally:
        manager.disconnect(employee_id)



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
