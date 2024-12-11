from pathlib import Path
import cv2
import face_recognition
import numpy as np
import os
import json
import time
import base64
import uuid
import math

import pytz

from backend.configs.config import (
    CONSECUTIVE_SUCCESS_NEEDED,
    DEFAULT_TIMEZONE,
    MAX_ATTEMPTS,
    MIN_CONFIDENCE_THRESHOLD,
    SCAN_DIRECTION,
)
from backend.models.checkinout_model import CheckInOutToday
from backend.models.returnformat import Returnformat
import mediapipe as mp

from backend.models.user_model import (
    Faceimage,
    Faceimageprocess,
    RoleEnum,
    User,
    Userupdate,
)
from backend.services.auth_service import FaceAuthenticationService
from backend.services.checkinout_service import CheckInOut_Service
from backend.services.user_service import UserService
from backend.utils.image_utills import Image_utills

import cv2
import numpy as np
import mediapipe as mp
from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Optional, Tuple, Any
import asyncio
from datetime import datetime


class Face_service:

    def __init__(self):
        self.base_dir = Path(__file__).resolve().parent.parent
        self.image_storage_path = os.path.join(self.base_dir, "images")
        # Initialize face mesh with optimal settings
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5,
        )

    @staticmethod
    def encode_image_to_base64(image):
        _, buffer = cv2.imencode(".jpg", image)
        return base64.b64encode(buffer).decode("utf-8")

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
            return "Turn_left"
        elif (
            nose_x > face_landmarks.landmark[263].x + threshold_x
            or nose_x > face_landmarks.landmark[291].x + threshold_x
        ):
            return "Turn_right"
        else:
            return "Front"

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
            await websocket.receive_json()

            check_in_time = datetime.now(tz=timezone).strftime("%H:%M:%S")
            # print("Check in time: ",datetime.now(tz=timezone).strftime("%H:%M:%S"))

            checkorcheckout = await CheckInOut_Service.is_checkinorout_time_valid(
                check_in_time
            )

            user, label, pred_confidence = await self.face_scan_ws(
                websocket, employee_id
            )
            # print("Check: ",checkorcheckout)
            if not user:
                await websocket.send_json(
                    {
                        "data": {
                            "status": "failed",
                            "message": "Face not recognized. Please try again.",
                        }
                    }
                )
                await websocket.close()
                return
            if checkorcheckout["data"] == "checkin":
                data = CheckInOutToday(
                    employee_id=user.employee_id,
                    check_in_time=check_in_time,
                    date=datetime.now(tz=timezone).strftime("%Y-%m-%d"),
                )
                # print(data)
                checkin = await CheckInOut_Service.check_in(data)
                if checkin["status"] == "error":
                    await websocket.send_json(
                        {
                            "data": Returnformat(
                                status=checkin["status"],
                                message=checkin["message"],
                                data=checkin["id"],
                            ).to_json()
                        }
                    )
                    await websocket.close()
                else:
                    await websocket.send_json(
                        {
                            "data": Returnformat(
                                status=checkin["status"],
                                message=checkin["message"],
                                data=checkin["id"],
                            ).to_json()
                        }
                    )
            elif checkorcheckout["data"] == "checkout":
                checkout = await CheckInOut_Service.check_out(employee_id)
                if checkout["status"] == "error":
                    await websocket.send_json(
                        {
                            "data": Returnformat(
                                status=checkout["status"],
                                message=checkout["message"],
                                data=checkout,
                            ).to_json()
                        }
                    )
                    await websocket.close()
                else:
                    await websocket.send_json(
                        {
                            "data": Returnformat(
                                status=checkout["status"],
                                message=checkout["message"],
                                data=checkout,
                            ).to_json()
                        }
                    )
            else:
                await websocket.send_json(
                    {
                        "data": Returnformat(
                            status="error",
                            message="Invalid time",
                            data=checkorcheckout["data"],
                        ).to_json()
                    }
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
            checklogined = await CheckInOut_Service.is_already_checked_in_out(
                employee_id
            )

            user, label, pred_confidence = await self.face_scan_ws(
                websocket, employee_id
            )

            if not user:
                await websocket.send_json(
                    {
                        "data": {
                            "status": "failed",
                            "message": "Face not recognized. Please try again.",
                        }
                    }
                )
                await websocket.close()
                return
            timezone = pytz.timezone(DEFAULT_TIMEZONE)
            # print("Check in time: ",datetime.now(tz=timezone).strftime("%H:%M:%S"))
            check_in_time = datetime.now(tz=timezone).strftime("%H:%M:%S")

            checkorcheckout = await CheckInOut_Service.is_checkinorout_time_valid(
                check_in_time
            )
            # print("Check: ",checkorcheckout)
            # print(checkorcheckout)
            if checklogined["data"]:
                await websocket.send_json(
                    {
                        "data": {
                            "status": "alreadycheckedinout",
                            "message": "User already checked in or out today.",
                        }
                    }
                )
            else:
                # print("Check: ",checkorcheckout)
                if checkorcheckout["data"] == "checkin":
                    data = CheckInOutToday(
                        employee_id=user.employee_id,
                        check_in_time=check_in_time,
                        date=datetime.now(tz=timezone).strftime("%Y-%m-%d"),
                    )
                    # print("Checkin",data)
                    ischeckin = await CheckInOut_Service.is_already_checked_in(
                        user.employee_id
                    )
                    # print(ischeckin["data"])

                    if ischeckin["data"]:
                        await websocket.send_json(
                            {
                                "data": {
                                    "status": "alreadycheckedin",
                                    "message": "User already checked in today.",
                                }
                            }
                        )
                    else:
                        checkin = await CheckInOut_Service.check_in(data)
                        await websocket.send_json(
                            {
                                "data": Returnformat(
                                    status="success",
                                    message=checkin["message"],
                                    data=checkin["id"],
                                ).to_json()
                            }
                        )
                elif checkorcheckout["data"] == "checkout":
                    ischeckout = await CheckInOut_Service.is_already_checked_out(
                        user.employee_id
                    )
                    if ischeckout["data"]:
                        await websocket.send_json(
                            {
                                "data": {
                                    "status": "alreadycheckedout",
                                    "message": "User already checked out today.",
                                }
                            }
                        )

                    else:
                        checkout = await CheckInOut_Service.check_out(employee_id)
                        await websocket.send_json(
                            {
                                "data": Returnformat(
                                    status="success",
                                    message="Check-out complete",
                                    data=checkout,
                                ).to_json()
                            }
                        )
                elif checkorcheckout["data"] == None:
                    await websocket.send_json(
                        {
                            "data": Returnformat(
                                status="error",
                                message="Invalid time",
                                data=checkorcheckout["data"],
                            ).to_json()
                        }
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
        """
        WebSocket handler for face scanning and authentication
        Returns tuple of (user, authentication_message, confidence_score)
        """
        try:
            # Initialize services
            user_service = UserService()
            auth_service = FaceAuthenticationService()

            # Fetch and validate user
            user_response = await user_service.get_user_by_employee_id(employee_id)
            if not user_response.data:
                await websocket.send_json(
                    {"data": {"status": "failed", "message": "User not found"}}
                )
                return None, "User not found", 0.0

            user = User(**user_response.data)
            if not user.embeddeds:
                await websocket.send_json(
                    {
                        "data": {
                            "status": "failed",
                            "message": "No face encodings found for user",
                        }
                    }
                )
                return None, "No face encodings found", 0.0

            # Authentication attempt counter and threshold
            max_attempts = MAX_ATTEMPTS
            attempt_count = 0
            min_confidence_threshold = MIN_CONFIDENCE_THRESHOLD
            consecutive_successes_needed = CONSECUTIVE_SUCCESS_NEEDED
            consecutive_successes = 0
            last_confidence = 0.0
        
            while attempt_count < max_attempts:
                try:
                    # Receive and validate frame data
                    data = await websocket.receive_json()
                    if not data.get("image"):
                        await websocket.send_json(
                            {
                                "data": {
                                    "status": "failed",
                                    "message": "No image data received",
                                }
                            }
                        )
                        continue

                    # Process frame
                    frame_bytes = np.frombuffer(
                        bytearray(data["image"]), dtype=np.uint8
                    )
                    frame = cv2.imdecode(frame_bytes, cv2.IMREAD_COLOR)
                    if frame is None:
                        await websocket.send_json(
                            {
                                "data": {
                                    "status": "failed",
                                    "message": "Invalid image data",
                                }
                            }
                        )
                        continue

                    frame = cv2.flip(frame, 1)  # Mirror image

                    # Authenticate face
                    is_authenticated, confidence, message = (
                        await auth_service.authenticate_face(
                            websocket, frame, user.embeddeds
                        )
                    )

                    # Debug logging
                    print(
                        f"Attempt {attempt_count + 1}: Auth={is_authenticated}, Confidence={confidence:.2f}, Message={message}, consecutive_successes={consecutive_successes}"
                    )

                    if is_authenticated and confidence >= min_confidence_threshold:
                        consecutive_successes += 1
                        last_confidence = confidence

                        # Send progress message
                        await websocket.send_json(
                            {
                                "data": {
                                    "status": "progress",
                                    "message": f"แสกนสำเร็จ: {consecutive_successes}/{consecutive_successes_needed}",
                                    "confidence": confidence,
                                }
                            }
                        )

                        if consecutive_successes >= consecutive_successes_needed:
                            return user, "ยืนยันตัวตนสำเร็จ", last_confidence
                    else:
                        await websocket.send_json(
                            {
                                "data": {
                                    "status": "failed",
                                    "message": message,
                                    "confidence": confidence,
                                }
                            }
                        )

                except WebSocketDisconnect:
                    print("WebSocket disconnected during face scan")
                    return None, "Connection lost", 0.0
                except Exception as e:
                    print(f"Error during face scan: {str(e)}")
                    await websocket.send_json(
                        {
                            "data": {
                                "status": "error",
                                "message": f"Face scan error: {str(e)}",
                            }
                        }
                    )

                attempt_count += 1

            # If we've exhausted all attempts
            await websocket.send_json(
                {
                    "data": {
                        "status": "stopped",
                        "message": "คุณไม่สามารถยืนยันตัวตนได้ - ครบจำนวนครั้งที่กำหนดแล้ว",
                    }
                }
            )
            
            return None, "คุณไม่สามารถยืนยันตัวตนได้ - ครบจำนวนครั้งที่กำหนดแล้ว", 0.0

        except Exception as e:
            print(f"Fatal error in face_scan_ws: {str(e)}")
            await websocket.send_json(
                {
                    "data": {
                        "status": "error",
                        "message": "Internal server error during face scan",
                    }
                }
            )
            return None, f"Fatal error: {str(e)}", 0.0

    def generate_encodeings(self, images):
        try:
            face_encodeings = face_recognition.face_encodings(images)
            if face_encodeings:
                return face_encodeings
            else:
                return None
        except Exception as e:
            print(f"Error encoding image: {str(e)}")
            return None

    async def face_registation(
        self,
        websocket: WebSocket,
        images: List = [],
        current_direction_idx: int = 0,
        scan_directions: List[str] = SCAN_DIRECTION,
    ):
        try:
            encode = None
            frame = None
            while current_direction_idx < len(scan_directions):
                expected_direction = scan_directions[current_direction_idx]
                await websocket.send_json(
                    {
                        "data": {
                            "status": "scan",
                            "instructions": f"Please move your head into frame.",
                        }
                    }
                )
                data = await websocket.receive_json()
                # Decode the received image
                frame_bytes = np.frombuffer(bytearray(data["image"]), dtype=np.uint8)
                frame = cv2.imdecode(frame_bytes, cv2.IMREAD_COLOR)
                results = self.face_mesh.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                if not results.multi_face_landmarks:
                    await websocket.send_text("No face detected. Please try again.")
                    continue

                face_landmarks = results.multi_face_landmarks[0]
                # frame_with_landmarks = face_service.draw_landmarks(frame, face_landmarks)
                detected_direction = self.check_head_direction(face_landmarks)
                # print(f"Detected direction: {detected_direction}")
                if detected_direction == expected_direction:
                    face_encodings = self.generate_encodeings(images=frame)
                    if face_encodings:
                        encode = face_encodings[0]
                        images.clear()
                        images.append({"frame": frame, "direction": expected_direction})
                        await websocket.send_json(
                            {
                                "data": {
                                    "status": "scanning",
                                    "instructions": f"Face detected. Please wait.",
                                }
                            }
                        )
                        return encode, images
                    else:
                        await websocket.send_json(
                            {
                                "data": {
                                    "status": "scanning",
                                    "instructions": f"No face detected. Please try again.",
                                }
                            }
                        )
                else:
                    await websocket.send_json(
                        {
                            "data": {
                                "status": "scanning",
                                "instructions": f"Please move your head to: {expected_direction}",
                            }
                        }
                    )
                    continue
        except WebSocketDisconnect:
            print("WebSocket disconnected.")
