from pathlib import Path
import cv2
import numpy as np
import os
import json
import time
import base64
import uuid
import math

import pytz

from backend.configs.config import DEFAULT_TIMEZONE
from backend.models.checkinout_model import CheckInOutToday
from backend.models.returnformat import Returnformat
import mediapipe as mp

from backend.models.user_model import Faceimage, RoleEnum, User, Userupdate
from backend.services.checkinout_service import CheckInOut_Service
from backend.services.user_service import UserService
from backend.utils.image_utills import Image_utills

import cv2
import numpy as np
import mediapipe as mp
from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Optional, Tuple
import asyncio
from datetime import datetime


class Face_service:
    base_dir = Path(__file__).resolve().parent.parent
    image_storage_path = os.path.join(base_dir, "images")

    @staticmethod
    def encode_image_to_base64(image):
        _, buffer = cv2.imencode(".jpg", image)
        return base64.b64encode(buffer).decode("utf-8")

    @staticmethod
    def crop_face(frame, landmarks):
        h, w, _ = frame.shape
        bounding_box = [
            int(min([lm.x * w for lm in landmarks])),
            int(min([lm.y * h for lm in landmarks])),
            int(max([lm.x * w for lm in landmarks])),
            int(max([lm.y * h for lm in landmarks])),
        ]
        # Crop the face region from the frame
        cropped_face = frame[
            bounding_box[1] : bounding_box[3], bounding_box[0] : bounding_box[2]
        ]
        return cropped_face

    @staticmethod
    def check_head_direction(face_landmarks):
        # Get coordinates of specific landmarks (e.g., nose, eyes, and mouth)
        nose_x = face_landmarks.landmark[1].x  # Use index 1 for NOSE_TIP
        # Threshold values to allow for more flexible detection
        threshold_x = 0.03  # Horizontal threshold for detecting left/right
        # Check head direction based on horizontal (left/right) and vertical (up/down) positions
        if (
            nose_x < face_landmarks.landmark[33].x - threshold_x
            or nose_x < face_landmarks.landmark[61].x - threshold_x
        ):
            return "Turn left"
        elif (
            nose_x > face_landmarks.landmark[263].x + threshold_x
            or nose_x > face_landmarks.landmark[291].x + threshold_x
        ):
            return "Turn right"
        else:
            return "Front"

    def calculate_eye_aspect_ratio(self, eye_landmarks):
        """Calculate the Eye Aspect Ratio to detect blinking"""
        # Vertical eye landmarks
        A = math.dist(eye_landmarks[1], eye_landmarks[5])
        B = math.dist(eye_landmarks[2], eye_landmarks[4])
        # Horizontal eye landmark
        C = math.dist(eye_landmarks[0], eye_landmarks[3])

        # Eye Aspect Ratio
        ear = (A + B) / (2.0 * C)
        return ear

    def is_face_moving(self, prev_landmarks, curr_landmarks, threshold=0.02):
        """Check if face is moving between frames"""
        if prev_landmarks is None:
            return False

        # Calculate total movement of landmark points
        total_movement = sum(
            [
                math.dist((lm1.x, lm1.y), (lm2.x, lm2.y))
                for lm1, lm2 in zip(prev_landmarks.landmark, curr_landmarks.landmark)
            ]
        )

        return total_movement > threshold

    @staticmethod
    def draw_landmarks(frame, face_landmarks):
        # Draw landmarks on the image for debugging
        for landmark in face_landmarks.landmark:
            x = int(landmark.x * frame.shape[1])  # scale to image width
            y = int(landmark.y * frame.shape[0])  # scale to image height
            cv2.circle(
                frame, (x, y), 1, (0, 255, 0), -1
            )  # Draw small circles for landmarks
        return frame

    async def checkinout_ws(self, websocket: WebSocket, employee_id: str):
        try:
            user_service = UserService()
            timezone = pytz.timezone(DEFAULT_TIMEZONE)
            check_in_time = datetime.now(tz=timezone).strftime("%H:%M:%S")
            checkorcheckout = await CheckInOut_Service.is_checkinorout_time_valid(
                employee_id
            )

            user, label, pred_confidence = await self.face_scan_ws(
                websocket, employee_id
            )

            if checkorcheckout["data"] == "checkin":
                data = CheckInOutToday(
                    employee_id=user.employee_id,
                    check_in_time=check_in_time,
                    date=datetime.now(tz=timezone).strftime("%Y-%m-%d"),
                )
                print(data)
                checkin = await CheckInOut_Service.check_in(data)
                await websocket.send_json(
                    Returnformat(
                        status="success", message=checkin["message"], data=checkin["id"]
                    ).to_json()
                )
            elif checkorcheckout["data"] == "checkout":
                checkout = await CheckInOut_Service.check_out(employee_id)
                await websocket.send_json(
                    Returnformat(
                        status="success", message=checkout["message"], data=checkout
                    ).to_json()
                )
            await websocket.send_json(
                Returnformat(
                    status="error", message="Invalid time", data=checkorcheckout["data"]
                ).to_json()
            )
        except WebSocketDisconnect:
            print("WebSocket disconnected.")

    async def login_ws(self, websocket: WebSocket):
        try:
            user_service = UserService()
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
            checklogined = await CheckInOut_Service.is_already_checked_in_out(employee_id)
           
            user, label, pred_confidence = await self.face_scan_ws(
                websocket, employee_id
            )
            
            timezone = pytz.timezone(DEFAULT_TIMEZONE)
            check_in_time = datetime.now(tz=timezone).strftime("%H:%M:%S")
            checkorcheckout = await CheckInOut_Service.is_checkinorout_time_valid(
                check_in_time
            )
            print(checkorcheckout)
            if checklogined["data"]:
                await websocket.send_json(
                    {
                        "data": {
                            "status": "failed",
                            "message": "User already checked in or out today.",
                        }
                    }
                )
            else:
                if checkorcheckout["data"] == "checkin":
                    data = CheckInOutToday(
                        employee_id=user.employee_id,
                        check_in_time=check_in_time,
                        date=datetime.now(tz=timezone).strftime("%Y-%m-%d"),
                    )
                    print(data)
                    ischeckin = await CheckInOut_Service.is_already_checked_in(user.employee_id)
                    if ischeckin["data"]:
                        await websocket.send_json(
                            {
                                "data": {
                                    "status": "failed",
                                    "message": "User already checked in today.",
                                }
                            }
                        )
                    else:
                        checkin = await CheckInOut_Service.check_in(data)
                        await websocket.send_json({
                        "data": Returnformat(
                                status="success", message=checkin["message"], data=checkin["id"]
                            ).to_json()}
                        )
                elif checkorcheckout["data"] == "checkout":
                    ischeckout = await CheckInOut_Service.is_already_checked_out(user.employee_id)
                    if ischeckout["data"]:
                        await websocket.send_json(
                            {
                                "data": {
                                    "status": "failed",
                                    "message": "User already checked out today.",
                                }
                            }
                        )
                        
                    else:
                        checkout = await CheckInOut_Service.check_out(employee_id)
                        await websocket.send_json(
                        {"data":  Returnformat(
                                status="success", message="Check-out complete", data=checkout
                            ).to_json()}
                        )
                elif checkorcheckout["data"] == None:
                    await websocket.send_json({
                        "data":
                        Returnformat(
                            status="error", message="Invalid time", data=checkorcheckout["data"]
                        ).to_json()}
                )
            
            token = user_service.generate_token(user.employee_id)
            await websocket.send_json(
                {
                    "data": {
                        "status": "success",
                        "message": f"Hi : {user.name} {label} (Confidence: {pred_confidence:.2f})",
                        "token": token,
                    }
                }
            )

        except WebSocketDisconnect:
            print("WebSocket disconnected.")

    async def face_scan_ws(self, websocket: WebSocket, employee_id: str):
        user_service = UserService()
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
            min_detection_confidence=0.4,
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
                    left_eye = [
                        face_landmarks.landmark[i]
                        for i in [362, 385, 387, 263, 373, 380]
                    ]
                    right_eye = [
                        face_landmarks.landmark[i]
                        for i in [33, 160, 158, 133, 153, 144]
                    ]

                    left_ear = self.calculate_eye_aspect_ratio(
                        [(lm.x, lm.y) for lm in left_eye]
                    )
                    right_ear = self.calculate_eye_aspect_ratio(
                        [(lm.x, lm.y) for lm in right_eye]
                    )

                    eye_aspect_ratio = (left_ear + right_ear) / 2.0
                    if prev_landmarks is None:
                        prev_landmarks = face_landmarks
                        continue

                    # Face Movement Detection
                    face_movement = self.is_face_moving(prev_landmarks, face_landmarks)

                    # Liveness Criteria
                    if eye_aspect_ratio < 0.25:  # Blink detection
                        blink_counter += 1

                    if blink_counter >= 1 and face_movement:
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
                        bounding_box[1] : bounding_box[3],
                        bounding_box[0] : bounding_box[2],
                    ]

                    if cropped_face.size > 0:
                        gray_cropped_face = cv2.cvtColor(
                            cropped_face, cv2.COLOR_BGR2GRAY
                        )
                        label_id, pred_confidence = recognizer.predict(
                            gray_cropped_face
                        )
                        print(
                            f"Predicted label: {label_id}, Confidence: {pred_confidence:.2f}, Direction: {labels[label_id]}, Live: {is_live}"
                        )
                        if is_live and pred_confidence < 80:

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
                    return user, labels[label_id], pred_confidence
            else:
                await websocket.send_json(
                    {
                        "data": {
                            "status": "failed",
                            "message": "No face detected. Please try again.",
                        }
                    }
                )
