from pathlib import Path
import cv2
from dotenv import dotenv_values, load_dotenv
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
    PATHENV,
    SCAN_DIRECTION,
    SNMP_OIDS,
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
from backend.services.snmp_service import SnmpService
from backend.services.user_service import UserService
from backend.utils.image_utills import Image_utills
from backend.services.Log_service import Logservice

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
            load_dotenv(dotenv_path=PATHENV)
            config = dotenv_values()
            HOST = config.get("SNMP_HOST", "localhost")
            COMMUNITY = config.get("SNMP_COMMUNITY", "public")
            user_service = UserService()
            snmp_service = SnmpService()
            timezone = pytz.timezone(DEFAULT_TIMEZONE)
            
            """
            Check if the device is connected to the WIFI University network
            """

            await websocket.send_json(
                {
                    "data": {
                        "status": "pending",
                        "message": "กำลังตรวจสอบการเชื่อมต่อ WIFI",
                    }
                }
            )
            is_WIFI = True if await snmp_service.finder_snmp(HOST, COMMUNITY, SNMP_OIDS['id'], employee_id) else False
            
            if not is_WIFI:
                await websocket.send_json(
                    {
                        "data": {
                            "status": "alert",
                            "message": "ไม่สามารถตรวจสอบการเชื่อมต่อ WIFI ได้"
                        }
                    }
                )
                await websocket.close()
                return
                
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
        log_service = Logservice()
        
        try:
            user_service = UserService()
            auth_service = FaceAuthenticationService()

            user_response = await user_service.get_user_by_employee_id(employee_id)
            if not user_response.data:
                await websocket.send_json(
                    {"data": {"status": "failed", "message": "ไม่พบผู้ใช้งาน"}}
                )
                return None, "ไม่พบผู้ใช้งาน", 0.0

            user = User(**user_response.data)
            if not user.embeddeds:
                # บบการบันทึก log กรณีไม่พบข้อมูลใบหน้า
                await websocket.send_json(
                    {
                        "data": {
                            "status": "stopped",
                            "message": "ไม่พบข้อมูลใบหน้าของผู้ใช้",
                        }
                    }
                )
                return None, "ไม่พบข้อมูลใบหน้า", 0.0

            max_attempts = MAX_ATTEMPTS
            attempt_count = 0
            min_confidence_threshold = MIN_CONFIDENCE_THRESHOLD
            consecutive_successes_needed = CONSECUTIVE_SUCCESS_NEEDED
            consecutive_successes = 0
            last_confidence = 0.0
        
            while attempt_count < max_attempts:
                try:
                    data = await websocket.receive_json()
                    if not data.get("image"):
                        continue

                    frame_bytes = np.frombuffer(
                        bytearray(data["image"]), dtype=np.uint8
                    )
                    frame = cv2.imdecode(frame_bytes, cv2.IMREAD_COLOR)
                    if frame is None:
                        continue

                    # frame = cv2.flip(frame, 1)

                    is_authenticated, confidence, message = (
                        await auth_service.authenticate_face(
                            websocket, frame, user.embeddeds
                        )
                    )

                    if is_authenticated and confidence >= min_confidence_threshold:
                        consecutive_successes += 1
                        last_confidence = confidence

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
                    # บบการบันทึก log กรณีการเชื่อมต่อหลุด
                    return None, "การเชื่อมต่อขาดหาย", 0.0
                    
                except Exception as e:
                    # บังคงบันทึก log กรณีเกิดข้อผิดพลาดอื่นๆ
                    await log_service.create_log(
                        employee_id=employee_id,
                        log={
                            "action": "face_scan", 
                            "status": "error",
                            "message": f"Error: {str(e)}",
                            "attempt": attempt_count + 1
                        }
                    )
                    await websocket.send_json(
                        {
                            "data": {
                                "status": "error",
                                "message": f"เกิดข้อผิดพลาด: {str(e)}",
                            }
                        }
                    )

                attempt_count += 1

            # บันทึก log สถานะ stopped เมื่อครบจำนวนครั้งที่กำหนด
            await log_service.create_log(
                employee_id=employee_id,
                log={
                    "action": "face_scan",
                    "status": "stopped",
                    "message": "Authentication failed - Maximum attempts reached",
                    "attempt": attempt_count
                }
            )
            
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
            # บังคงบันทึก log กรณีเกิดข้อผิดพลาดร้ายแรง
            await log_service.create_log(
                employee_id=employee_id,
                log={
                    "action": "face_scan",
                    "status": "error", 
                    "message": f"Error server: {str(e)}"
                }
            )
            
            await websocket.send_json(
                {
                    "data": {
                        "status": "error",
                        "message": "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
                    }
                }
            )
            return None, f"เกิดข้อผิดพลาดร้ายแรง: {str(e)}", 0.0


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
            expected_direction = scan_directions[current_direction_idx]
            
            while True:  # เพิ่ม loop เพื่อให้สามารถถ่ายซ้ำได้
                # รอรับภาพที่ถ่ายจาก frontend
                await websocket.send_json({
                    "data": {
                        "status": "scanning",
                        "instructions": f"ถ่ายภาพใบหน้าของคุณ",
                    }
                })
                
                data = await websocket.receive_json()
                
                # ตรวจสอบวารปิดกล้อง
                if "action" in data and data["action"] == "normal_close":
                    print("Camera closed normally")
                    return None, []
                
                # ตรวจสอบว่าเป็นการส่งภาพมาหรือไม่
                if "captured_image" in data:
                    frame_bytes = np.frombuffer(bytearray(data["captured_image"]), dtype=np.uint8)
                    frame = cv2.imdecode(frame_bytes, cv2.IMREAD_COLOR)
                    
                    # ตรวจสอบใบหน้าในภาพที่ถ่าย
                    results = self.face_mesh.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                    
                    if not results.multi_face_landmarks:
                        await websocket.send_json({
                            "data": {
                                "status": "failed",
                                "message": "ไม่พบใบหน้าในภาพ กรุณาถ่ายใหม่"
                            }
                        })
                        continue  # ให้วนกลับไปถ่ายใหม่
                        
                    face_landmarks = results.multi_face_landmarks[0]
                    detected_direction = self.check_head_direction(face_landmarks)
                    
                    # สร้าง face encoding จากภาพที่ถ่าย
                    face_encodings = self.generate_encodeings(images=frame)
                    if face_encodings:
                        encode = face_encodings[0]
                        images.clear()
                        images.append({"frame": frame, "direction": detected_direction})
                        
                        await websocket.send_json({
                            "data": {
                                "status": "success",
                                "message": "บันทึกภาพสำเร็จ"
                            }
                        })
                        return encode, images
                    else:
                        await websocket.send_json({
                            "data": {
                                "status": "failed",
                                "message": "ไม่สามารถประมวลผลใบหน้าได้ กรุณาถ่ายใหม่"
                            }
                        })
                        continue  # ให้วนกลับไปถ่ายใหม่
                        
        except WebSocketDisconnect:
            print("WebSocket disconnected.")
            return None, []
