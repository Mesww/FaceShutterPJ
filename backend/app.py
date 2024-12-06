import asyncio
import base64
import datetime
from pathlib import Path
import time
import cv2
from dotenv import dotenv_values, load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import jwt
import numpy as np
from backend.configs.config import (
    IMAGE_PER_DIRECTION,
    SCAN_DIRECTION,
    ConnectionManager,
)
from backend.models.user_model import User, Userupdate
from backend.routes import face_routes, user_routes, history_routes, checkinout_routes
import mediapipe as mp
from fastapi.middleware.cors import CORSMiddleware
from deepface import DeepFace
from backend.services.face_service import Face_service
from backend.services.user_service import UserService
from backend.utils.image_utills import Image_utills

pathenv = Path("./.env")
load_dotenv(dotenv_path=pathenv)
config = dotenv_values()
FONTEND_URL = config.get("FRONTEND_URL", "http://localhost:5173")
SECRET_KEY = config.get("SECRET_KEY", "RickAstley")
ALGORITHM = config.get("ALGORITHM", "HS256")

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


from fastapi import WebSocket, WebSocketDisconnect
from typing import Optional

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
    scan_directions = ["Front", "Turn_left", "Turn_right"]
    current_direction_idx = 0
    images = []  # To store images temporarily
    images_per_direction = IMAGE_PER_DIRECTION  # Number of images per direction
    image_count = 0  # Counter for images saved in the current direction

    # Delay time for saving data per frame
    delay_time = 0.25  # Delay time in seconds
    last_saved_time = time.time()

    # Request user information
    await websocket.send_text(
        "Provide user details (employee_id, name, email, password):"
    )
    await websocket.send_json(
        {
            "data": {
                "status": "register",
                "scan_directions": scan_directions,
                "totaldirection": images_per_direction,
            }
        }
    )
    user_details = await websocket.receive_json()
    print("receive user_details : ", user_details)
    employee_id = user_details["employee_id"]
    name = user_details["name"]
    email = user_details["email"]
    tel = user_details["tel"]
    password = ""

    try:
        while current_direction_idx < len(scan_directions):
            expected_direction = scan_directions[current_direction_idx]
            await websocket.send_text(f"Please move your head to: {expected_direction}")
            image_count = 0  # ตัวนับจำนวนภาพในทิศทางปัจจุบัน

            # ส่งข้อความขอให้ผู้ใช้ส่งข้อมูลภาพ
            while image_count < images_per_direction:  # เก็บภาพจนกว่าจะครบ 20 ภาพ

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
                # frame_with_landmarks = face_service.draw_landmarks(frame, face_landmarks)
                detected_direction = face_service.check_head_direction(face_landmarks)
                print(f"Detected direction: {detected_direction}")

                # Check if the direction matches
                encoded_frame = face_service.encode_image_to_base64(frame)
                await websocket.send_text(encoded_frame)

                if detected_direction != expected_direction:
                    await websocket.send_text(
                        f"Incorrect direction! Detected: {detected_direction}"
                    )
                    continue

                current_time = time.time()
                if current_time - last_saved_time >= delay_time:
                    # Add the frame and direction to the images list
                    images.append({"frame": frame, "direction": expected_direction})
                    image_count += 1  # เพิ่มตัวนับภาพ
                    last_saved_time = current_time  # อัปเดตเวลาที่บันทึกล่าสุด
                    await websocket.send_text(
                        f"Image {image_count} captured for {expected_direction}"
                    )

               
            

                # Add the frame and direction to the images list
                images.append({"frame": frame, "direction": expected_direction})

                image_count += 1  # เพิ่มตัวนับภาพ

                await websocket.send_text(
                    f"Image {image_count} captured for {expected_direction}"
                )

            current_direction_idx += 1  # เปลี่ยนไปทิศทางถัดไป
        print("All images captured successfully.")
        print("Saving user data and images...", len(images))
        # Save all images and user data at once
        user_id = await user_service.save_user_and_images(
            employee_id, name, email, password, images, tel
        )
        await websocket.send_text(
            f"User data and images saved successfully with ID: {user_id}"
        )

    except WebSocketDisconnect:
        print("WebSocket disconnected.")


@app.websocket("/ws/edit_image")
async def websocket_endpoint(websocket: WebSocket):
    face_service = Face_service()
    user_service = UserService()
    await websocket.accept()
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
    scan_directions = ["Front", "Turn_left", "Turn_right"]
    current_direction_idx = 0
    images = []
    embeddings = []
    images_per_direction = IMAGE_PER_DIRECTION
    image_count = 0
    await websocket.send_json(
        {
            "data": {
                "status": "register",
                "scan_directions": scan_directions,
                "totaldirection": images_per_direction,
            }
        }
    )
    try:
        while current_direction_idx < len(scan_directions):
            expected_direction = scan_directions[current_direction_idx]
            await websocket.send_text(f"Please move your head to: {expected_direction}")
            image_count = 0  # ตัวนับจำนวนภาพในทิศทางปัจจุบัน

            # ส่งข้อความขอให้ผู้ใช้ส่งข้อมูลภาพ
            while image_count < images_per_direction:  # เก็บภาพจนกว่าจะครบ 20 ภาพ

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
                # frame_with_landmarks = face_service.draw_landmarks(frame, face_landmarks)
                detected_direction = face_service.check_head_direction(face_landmarks)
                print(f"Detected direction: {detected_direction}")

                # Check if the direction matches
                encoded_frame = face_service.encode_image_to_base64(frame)
                await websocket.send_text(encoded_frame)

                if detected_direction != expected_direction:
                    await websocket.send_text(
                        f"Incorrect direction! Detected: {detected_direction}"
                    )
                    continue

                embedding = DeepFace.represent(
                    frame, model_name="ArcFace", enforce_detection=True
                )

                embeddings.append(embedding)

                # Add the frame and direction to the images list
                images.append({"frame": frame, "direction": expected_direction})

                image_count += 1  # เพิ่มตัวนับภาพ

                await websocket.send_text(
                    f"Image {image_count} captured for {expected_direction}"
                )

            current_direction_idx += 1  # เปลี่ยนไปทิศทางถัดไป

        print("All images captured successfully.")
        print("Saving user data and images...", len(images))
        image_utills = Image_utills()
        user = await user_service.get_user_by_employee_id(employee_id)
        # Save images to disk
        saved_image_paths = []
        for img_data in images:
            direction = img_data["direction"]
            frame = img_data["frame"]

            # Generate a unique filename for each image
            filepath = await image_utills.save_image(
                image=frame,
                filename=f"{employee_id}_{direction.replace(' ', '_').lower()}.jpg",
            )

            # Append the path to the list
            saved_image_paths.append({"path": filepath, "direction": direction})

        for existing_image in user.data["images"]:
            image_utills.remove_image(existing_image["path"])
        # Save all images and user data at once
        user_update = Userupdate(images=saved_image_paths)

        user_id = await user_service.update_user_by_employee_id(
            employee_id=employee_id, request=user_update
        )
        await websocket.send_text(
            f"User data and images saved successfully with ID: {user_id}"
        )

    except WebSocketDisconnect:
        print("WebSocket disconnected.")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
