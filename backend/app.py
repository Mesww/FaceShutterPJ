import asyncio
import base64
import datetime
from pathlib import Path
import cv2
from dotenv import dotenv_values, load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import numpy as np
from backend.configs.config import SCAN_DIRECTION, ConnectionManager
from backend.models.user_model import User
from backend.routes import face_routes, user_routes,history_routes,checkinout_routes
import mediapipe as mp
from fastapi.middleware.cors import CORSMiddleware

from backend.services.face_service import Face_service
from backend.services.user_service import UserService
from backend.utils.image_utills import Image_utills

pathenv = Path("./.env")
load_dotenv(dotenv_path=pathenv)
config = dotenv_values()
FONTEND_URL = config.get("FRONTEND_URL", "http://localhost:5173")

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
    


manager = ConnectionManager()

# MediaPipe Setup
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    static_image_mode=False,
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.5,
)


@app.websocket("/ws/auth")
async def websocket_endpoint(websocket: WebSocket):
    face_service = Face_service()
    user_service = UserService()
    await websocket.accept()
    headers = websocket.headers
    encoded_token = headers.get('sec-websocket-protocol')
    token = None
    employee_id = None
    if encoded_token:
        try:
            # Decode the base64 token
            import base64
            token = base64.b64decode(encoded_token).decode('utf-8')
            employee_id = user_service.extract_token(token).get('sub')
        except:
            token = None
            employee_id = None
    
    print("token,employee : ",token,employee_id)    
    if token and employee_id:
        print("Checkinout_ws")
        await face_service.checkinout_ws(websocket,employee_id=employee_id)
    else:
        await face_service.login_ws(websocket)        

@app.websocket("/ws/scan")
async def websocket_endpoint(websocket: WebSocket):
    face_service = Face_service()
    user_service = UserService()
    await websocket.accept()
    scan_directions = ["Front", "Turn left", "Turn right"]
    current_direction_idx = 0
    images = []  # To store images temporarily

    # Request user information
    await websocket.send_text(
        "Provide user details (employee_id, name, email, password):"
    )
    await websocket.send_json({"scan_directions": scan_directions})
    user_details = await websocket.receive_json()
    print('receive user_details : ',user_details)
    employee_id = user_details["employee_id"]
    name = user_details["name"]
    email = user_details["email"]
    tel = user_details["tel"]
    password = ''

    try:
        while current_direction_idx < len(scan_directions):
            expected_direction = scan_directions[current_direction_idx]
            await websocket.send_text(f"Please move your head to: {expected_direction}")
            
            data = await websocket.receive_json()

            # Decode the received image
            frame_bytes = np.frombuffer(bytearray(data["image"]), dtype=np.uint8)
            frame = cv2.imdecode(frame_bytes, cv2.IMREAD_COLOR)

            # Detect face and landmarks
            results = face_mesh.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            if not results.multi_face_landmarks:
                await websocket.send_text("No face detected. Please try again.")
                continue

            face_landmarks = results.multi_face_landmarks[0]
            frame_with_landmarks = face_service.draw_landmarks(frame, face_landmarks)
            detected_direction = face_service.check_head_direction(face_landmarks)
            print(f"Detected direction: {detected_direction}")
            # print(f"Landmarks: {[(lm.x, lm.y) for lm in face_landmarks.landmark]}")
            # Check if the direction matches
            encoded_frame = face_service.encode_image_to_base64(frame_with_landmarks)
            await websocket.send_text(encoded_frame)

            if detected_direction != expected_direction:
                await websocket.send_text(
                    f"Incorrect direction! Detected: {detected_direction}"
                )
                continue
            
            # Add the frame and direction to the images list
            images.append({"frame": frame, "direction": expected_direction})

            await websocket.send_text(f"Image captured for {expected_direction}")
            current_direction_idx += 1

        # Save all images and user data at once
        user_id = await user_service.save_user_and_images(
            employee_id, name, email, password, images, tel
        )
        await websocket.send_text(
            f"User data and images saved successfully with ID: {user_id}"
        )
    except WebSocketDisconnect:
        print("WebSocket disconnected.")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
