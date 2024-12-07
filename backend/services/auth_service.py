import math
import cv2
import face_recognition
from fastapi import WebSocket
import mediapipe as mp
import numpy as np

class FaceAuthenticationService:
    def __init__(self):
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.4
        )
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

    async def authenticate_face(self, websocket: WebSocket, frame, user_embeddeds):
        """Authenticate face with proper embedding handling"""
        imgS = cv2.resize(frame, (0, 0), None, 0.25, 0.25)
        rgb_frame = cv2.cvtColor(imgS, cv2.COLOR_BGR2RGB)
        
        results = self.face_mesh.process(rgb_frame)
        if not results.multi_face_landmarks:
            return False, 0.0, "No face detected"

        is_live = await self._check_liveness(results.multi_face_landmarks[0])
        if not is_live:
            return False, 0.0, "Liveness check failed"

        face_locations = face_recognition.face_locations(imgS)
        if not face_locations:
            return False, 0.0, "No face detected"

        current_encoding = face_recognition.face_encodings(imgS, face_locations)[0]
        
        # Convert user_embeddeds to proper numpy array format
        if isinstance(user_embeddeds, list):
            user_embeddeds = np.array(user_embeddeds)
        if len(user_embeddeds.shape) == 1:
            user_embeddeds = np.array([user_embeddeds])
        is_check = False
        for encodeFace, faceLoc in zip(user_embeddeds, face_locations):
            matches = face_recognition.compare_faces([encodeFace], current_encoding)
            faceDis = face_recognition.face_distance([encodeFace], current_encoding)
            y1, x2, y2, x1 = faceLoc
            y1, x2, y2, x1 = y1 * 4, x2 * 4, y2 * 4, x1 * 4
            bbox = 55 + x1, 162 + y1, x2 - x1, y2 - y1
            matchIndex = np.argmin(faceDis)
            if matches[matchIndex] and faceDis[matchIndex] < 0.5:
                face_distance = faceDis[matchIndex]
                confidence = float(1 - face_distance)
                is_check = True
        if is_check :
            return True, confidence, "Authentication successful"

    async def _check_liveness(self, landmarks):
        """Check for signs of liveness (blinks, movement)"""
        left_eye = [landmarks.landmark[i] for i in [362, 385, 387, 263, 373, 380]]
        right_eye = [landmarks.landmark[i] for i in [33, 160, 158, 133, 153, 144]]
        
        ear = (self.calculate_eye_aspect_ratio([(lm.x, lm.y) for lm in left_eye]) + 
               self.calculate_eye_aspect_ratio([(lm.x, lm.y) for lm in right_eye])) / 2.0
               
        return ear < 0.25  # Indicates a blink