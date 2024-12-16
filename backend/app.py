import asyncio
import base64
import datetime
from pathlib import Path
import time
from dotenv import dotenv_values, load_dotenv
from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
import jwt
import numpy as np
from requests_oauthlib import OAuth2Session
from backend.configs.config import (
    IMAGE_PER_DIRECTION,
    SCAN_DIRECTION,
    ConnectionManager,
    public_key_pem
)

from backend.models.user_model import User, Userupdate
from backend.routes import face_routes, user_routes, history_routes, checkinout_routes,auth_routes,logs_routes
import mediapipe as mp
from fastapi.middleware.cors import CORSMiddleware
from backend.services.face_service import Face_service
from backend.services.history_service import History_Service
from backend.services.user_service import UserService
from backend.utils.image_utills import Image_utills
from apscheduler.schedulers.background import BackgroundScheduler

from datetime import datetime
from typing import Optional



pathenv = Path("./.env")
load_dotenv(dotenv_path=pathenv)
config = dotenv_values()
FONTEND_URL = config.get("FRONTEND_URL", "http://localhost:5173")
SECRET_KEY = config.get("SECRET_KEY", "RickAstley")
ALGORITHM = config.get("ALGORITHM", "HS256")
OAUTH_CLIENT_ID = config.get("OAUTH_CLIENT_ID","")
OAUTH_SECRET = config.get("OAUTH_SECRET","")
OAUTH_CALLBACK_URL = config.get("OAUTH_CALLBACK_URL","")
OAUTH_AUTHORIZE_URL = config.get("OAUTH_AUTHORIZE_URL","")
OAUTH_TOKEN_URL = config.get("OAUTH_TOKEN_URL","")

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
    return {"status": "healthy", "message": "Application is running smoothly"}

# For frontend to get the public key
@app.get('/get_public_key')
def get_public_key():
    return {'public_key': public_key_pem.decode('utf-8')}

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return {"status": "error", "message": str(exc)}


app.include_router(
    user_routes.router,  # เพิ่มการรวม user_routes
    prefix="/api/users",  # Base path for user-related routes
    tags=["users"],
)
app.include_router(
    face_routes.router,  # เพิ่มการรวม user_routes
    prefix="/api/face",  # Base path for user-related routes
    tags=["face"],
)

app.include_router(
    checkinout_routes.router,  # เพิ่มการรวม user_routes
    prefix="/api/checkinout",  # Base path for user-related routes
    tags=["checkinout"],
)

app.include_router(
    history_routes.router,  # เพิ่มการรวม user_routes
    prefix="/api/history",  # Base path for user-related routes
    tags=["history"],
)
app.include_router(
    auth_routes.router,  # เพิ่มการรวม user_routes
    prefix="/api/auth",  # Base path for user-related routes
    tags=["auth"],
)

app.include_router(
    logs_routes.router,  # เพิ่มการรวม user_routes
    prefix="/api/logs",  # Base path for user-related routes
    tags=["auth"],
)

"""

    Testing OAuth2 Authorization Code Flow

"""

@app.post('/login')
def login():
    oauth = OAuth2Session(OAUTH_CLIENT_ID, redirect_uri=OAUTH_CALLBACK_URL,
            scope=['openid', 'email', 'profile'])
    authorization_url, state = oauth.authorization_url(OAUTH_AUTHORIZE_URL)
    return {"authorization_url": authorization_url, "state": state}

@app.get('/callback')
def callback(request: Request):
    oauth = OAuth2Session(OAUTH_CLIENT_ID, redirect_uri=OAUTH_CALLBACK_URL)
    try:
        token = oauth.fetch_token(
            OAUTH_TOKEN_URL,
            authorization_response=str(request.url),
            client_secret=OAUTH_SECRET,
            include_client_id=True,
            scope=['openid', 'email', 'profile']
        )
        return {"token": token}
    except Exception as e:
        return {"error": str(e)}


# Create a scheduler instance

scheduler = BackgroundScheduler()

async def async_daily_task():
    # Your async daily task logic here
    print(f"Async daily task started at {datetime.now()}")
    res= await History_Service.migrate_to_history()
    print(res)
    print(f"Async daily task completed at {datetime.now()}")

def daily_task():
    # Run the async task in the event loop
    asyncio.run(async_daily_task())

# Schedule the task to run daily at a specific time
scheduler.add_job(daily_task, 'cron', hour=23, minute=59)  # Adjust time as needed

# Start the scheduler
scheduler.start()


@app.on_event("shutdown")
def shutdown_event():
    # Shutdown scheduler gracefully
    scheduler.shutdown()


manager = ConnectionManager()

# MediaPipe Setup
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
)






active_connections = {}


@app.websocket("/ws/auth")
async def websocket_endpoint(websocket: WebSocket):
    face_service = Face_service()
    user_service = UserService()

    # Extract token from query parameters
    token: Optional[str] = websocket.query_params.get("token")
    employee_id = None

    if token:
        try:
            # Decode the JWT token
            decoded_token = jwt.decode(token, SECRET_KEY, algorithms=ALGORITHM)
            employee_id = decoded_token.get("sub")
        except jwt.ExpiredSignatureError:
            print("Token has expired.")
        except jwt.InvalidTokenError as e:
            print(f"Invalid token: {e}")
        except Exception as e:
            print(f"Unexpected error decoding token: {e}")
            token = None
            employee_id = None

    print("token,employee : ", token, employee_id)

    await websocket.accept()

    if token and employee_id:
        print("Checkinout_ws")
        await face_service.checkinout_ws(websocket, employee_id=employee_id)
    else:
        print("Login")
        await face_service.login_ws(websocket)


@app.websocket("/ws/scan")
async def websocket_endpoint(websocket: WebSocket):
    face_service = Face_service()
    user_service = UserService()
    await websocket.accept()
    
    # Request user information
    await websocket.send_text(
        "Provide user details (employee_id, name, email, password):"
    )
    await websocket.send_json(
        {
            "data": {
                "status": "register",
                "scan_directions": SCAN_DIRECTION,
                "totaldirection": IMAGE_PER_DIRECTION,
            }
        }
    )
    user_details = await websocket.receive_json()
    employee_id = user_details["employee_id"]
    name = user_details["name"]
    email = user_details["email"]
    tel = user_details["tel"]
    password = ""

    try:
        encode, images = await face_service.face_registation(websocket=websocket)
        
        # ตรวจสอบว่ามีการถ่ายภาพสำเร็จหรือไม่
        if not images:
            await websocket.close()
            return
            
        user_id = await user_service.save_user_and_images(
            employee_id=employee_id,
            name=name,
            email=email,
            images=images,
            tel=tel,
            password=password,
            face_encoding=encode
        )
        
        await websocket.send_json({
            "data": {
                "status": "success",
                "message": f"User data and images saved successfully with ID: {user_id}"
            }
        })
        
    except WebSocketDisconnect:
        print("WebSocket disconnected.")


@app.websocket("/ws/edit_image")
async def websocket_endpoint(websocket: WebSocket):
    face_service = Face_service()
    user_service = UserService()
    image_utills = Image_utills()
    
    await websocket.accept()
    
    # ตรวจสอบ token และ employee_id
    token: Optional[str] = websocket.query_params.get("token")
    employee_id = None
    if token:
        try:
            decoded_token = jwt.decode(token, SECRET_KEY, algorithms=ALGORITHM)
            employee_id = decoded_token.get("sub")
        except Exception as e:
            print(f"Token error: {e}")
            token = None
            employee_id = None

    scan_directions = SCAN_DIRECTION
    current_direction_idx = 0
    images = []
    
    await websocket.send_json({
        "data": {
            "status": "register",
            "scan_directions": scan_directions,
            "totaldirection": IMAGE_PER_DIRECTION,
        }
    })

    try:
        # รับภาพใหม่
        encode, images = await face_service.face_registation(websocket=websocket)
        
        if not images:
            await websocket.close()
            return

        user = await user_service.get_user_by_employee_id(employee_id)
        saved_image_paths = []

        # บันทึกภาพใหม่
        for img_data in images:
            direction = img_data["direction"]
            frame = img_data["frame"]
            filepath = await image_utills.save_image(
                image=frame,
                filename=f"{employee_id}_{direction.replace(' ', '_').lower()}.jpg",
            )
            saved_image_paths.append({"path": filepath, "direction": direction})

        # อัพเดทข้อมูลผู้ใช้
        user_update = Userupdate(images=saved_image_paths, embeddeds=encode)
        user_id = await user_service.update_user_by_employee_id(
            employee_id=employee_id, 
            request=user_update
        )

        # ลบรูปภาพเก่าหลังจากบันทึกข้อมูลใหม่สำเร็จ
        if user_id and user.data["images"]:
            for existing_image in user.data["images"]:
                image_utills.remove_image(existing_image["path"])

        await websocket.send_json({
            "data": {
                "status": "success", 
                "message": f"User data and images saved successfully with ID: {user_id}"
            }
        })

    except WebSocketDisconnect:
        print("WebSocket disconnected.")
        # ในกรณีที่เกิด disconnect ไม่ต้องลบรูปภาพเก่า
    except Exception as e:
        print(f"Error: {str(e)}")
        # ในกรณีที่เกิดข้อผิดพลาด ไม่ต้องลบรูปภาพเก่า
        await websocket.close()




if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
