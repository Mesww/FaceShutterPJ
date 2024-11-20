from pathlib import Path
import cv2
import numpy as np
import os
import json
import time
import base64
import uuid

from backend.models.returnformat import Returnformat
import mediapipe as mp

from backend.models.user_model import Faceimage, RoleEnum, User, Userupdate
from backend.services.user_service import UserService
from backend.utils.image_utills import Image_utills

base_dir = Path(__file__).resolve().parent.parent
image_storage_path = os.path.join(base_dir, 'images')
class Face_service:
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
    async def save_landmarks(ScanDirection, frame, name,employee_id: str):
        print("Processing frame...")
        print(f"ScanDirection: {ScanDirection}")
        user = await UserService.get_user_by_employee_id(employee_id)
        
        mp_face_mesh = mp.solutions.face_mesh
        mp_drawing = mp.solutions.drawing_utils
        status = 200
        face_mesh = mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
        )

        frame = cv2.flip(frame, 1)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb_frame)
        
        # Draw face landmarks (if a face is detected)
        if results.multi_face_landmarks:
            instruction_text = f"Please move your head to: {ScanDirection}"
            for face_landmarks in results.multi_face_landmarks:
                mp_drawing.draw_landmarks(
                    frame,
                    face_landmarks,
                    mp_face_mesh.FACEMESH_TESSELATION,
                    mp_drawing.DrawingSpec(
                        color=(0, 255, 0), thickness=1, circle_radius=1
                    ),
                    mp_drawing.DrawingSpec(
                        color=(0, 0, 255), thickness=1, circle_radius=1
                    ),
                )

                cropped_face = Face_service.crop_face(frame, face_landmarks.landmark)
                random_filename = (
                    f"{ScanDirection}_{uuid.uuid5(uuid.NAMESPACE_DNS,name).hex}.jpg"
                )
                filepath = os.path.join(image_storage_path, random_filename)
                cv2.imwrite(filepath, cropped_face)
                print(f"Image saved at: {filepath}")
        else:
            instruction_text = "No face detected. Please ensure your face is well-lit and in the frame."
            status = 400
        frame = Image_utills.convert_cv2_to_base64(frame)
        
        """
            Update user faceimage data in the database
        """
        faceimage = Faceimage(scan_direction=ScanDirection, image_path=filepath)
        print(user.data)
        if user.data:
            print("User data",user)
            print("User found, updating face image...")
            res = await UserService.update_user_image_by_employee_id(employee_id, request=faceimage)
        else:
            print("User not found, creating new face image...")
            request = User(employee_id=employee_id,name=name,faceimage=[faceimage],roles=RoleEnum.USER)
            res = await UserService.create_user_image_by_employee_id(request=request)    
        print(res.message)
        if res.status >= 400:
            status = 400
            instruction_text = res.message
        return Returnformat(status,  instruction_text, {"image_path":filepath,"frame":frame})
