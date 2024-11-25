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
from backend.routes import face_routes, user_routes
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
    try:
        employee_id = await websocket.receive_json()
        employee_id = employee_id["employee_id"]

        await websocket.send_json(
            {
                "data": {
                    "status": "pending",
                    "message": "Employee ID received successfully.",
                }
            }
        )
        if not employee_id:
            await websocket.send_json(
                {
                    "data": {
                        "status": "failed",
                        "message": "Invalid employee ID. Please try again.",
                    }
                }
            )
            return
        user = await user_service.get_user_by_employee_id(employee_id)
        if not user.data:
            await websocket.send_json(
                {
                    "data": {
                        "status": "failed",
                        "message": "User not found. Please try again.",
                    }
                }
            )
            return
        user = User(**user.data)
        image = user.images
        if not image:
            await websocket.send_json(
                {
                    "data": {
                        "status": "failed",
                        "message": "No images found for the user.",
                    }
                }
            )
            return
        saved_faces = []
        labels = {}
        i = 0
        for imgs in image:
            imgs = imgs.model_dump()
            img = cv2.imread(imgs["path"])
            print(imgs["path"])
            if img is not None:
                saved_faces.append(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
                labels[i] = imgs["direction"]
            else:
                print(f"Unable to read image: {imgs['path']}")
            i += 1
        recognizer = cv2.face.LBPHFaceRecognizer_create()
        recognizer.train(saved_faces, np.array(list(labels.keys())))
        mp_face_mesh = mp.solutions.face_mesh
        mp_drawing = mp.solutions.drawing_utils
        face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
        )
        prev_landmarks = None
        blink_counter = 0
        await websocket.send_json(
            {"data": {"status": "pending", "message": "Please face the camera."}}
        )
        is_Chcek = False
        while True:
            data = await websocket.receive_json()
            if not data["image"]:
                continue

            frame_bytes = np.frombuffer(bytearray(data["image"]), dtype=np.uint8)
            frame = cv2.imdecode(frame_bytes, cv2.IMREAD_COLOR)
            frame = cv2.flip(frame, 1)
            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_frame)
            if results.multi_face_landmarks:
                for face_landmarks in results.multi_face_landmarks:
                    is_live = False

                    # Eye Blink Detection
                    left_eye = [face_landmarks.landmark[i] for i in [362, 385, 387, 263, 373, 380]]
                    right_eye = [face_landmarks.landmark[i] for i in [33, 160, 158, 133, 153, 144]]

                    left_ear = face_service.calculate_eye_aspect_ratio(
                        [(lm.x, lm.y) for lm in left_eye]
                    )
                    right_ear = face_service.calculate_eye_aspect_ratio(
                        [(lm.x, lm.y) for lm in right_eye]
                    )

                    eye_aspect_ratio = (left_ear + right_ear) / 2.0
                    if prev_landmarks is None:
                        prev_landmarks = face_landmarks
                        continue

                    # Face Movement Detection
                    face_movement = face_service.is_face_moving(prev_landmarks, face_landmarks)

                    # Liveness Criteria
                    if eye_aspect_ratio < 0.2:  # Blink detection
                        blink_counter += 1

                    if blink_counter >= 2 and face_movement:
                        is_live = True

                    prev_landmarks = face_landmarks  # Update for the next frame

                    # Face Recognition
                    h, w, _ = frame.shape
                    bounding_box = [
                        int(min([lm.x * w for lm in face_landmarks.landmark])),
                        int(min([lm.y * h for lm in face_landmarks.landmark])),
                        int(max([lm.x * w for lm in face_landmarks.landmark])),
                        int(max([lm.y * h for lm in face_landmarks.landmark])),
                    ]
                    cropped_face = frame[
                        bounding_box[1]:bounding_box[3],
                        bounding_box[0]:bounding_box[2],
                    ]

                    if cropped_face.size > 0:
                        gray_cropped_face = cv2.cvtColor(cropped_face, cv2.COLOR_BGR2GRAY)
                        label_id, pred_confidence = recognizer.predict(gray_cropped_face)
                        print(f"Predicted label: {label_id}, Confidence: {pred_confidence:.2f}, Direction: {labels[label_id]}, Live: {is_live}")
                        if is_live and pred_confidence < 80:
                            token = user_service.generate_token(user.employee_id)
                            await websocket.send_json(
                                {
                                    "data": {
                                        "status": "success",
                                        "message": f"Hi : {user.name} {labels[label_id]} (Confidence: {pred_confidence:.2f})",
                                        "token": token,
                                    }
                                }
                            )
                            print("You are Real!!!!")
                            is_Chcek = True
                            break
                        else:
                            await websocket.send_json(
                                {
                                    "data": {
                                        "status": "failed",
                                        "message": "You are Fake!!!!",
                                    }
                                }
                            )
                    else:
                        print("Cropped face is empty.")
                if is_Chcek:
                    break
            else:
                await websocket.send_json(
                    {
                        "data": {
                            "status": "failed",
                            "message": "No face detected. Please try again.",
                        }
                    }
                )
    except WebSocketDisconnect:
        print("WebSocket disconnected.")


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
