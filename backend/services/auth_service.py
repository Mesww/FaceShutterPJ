import math
import cv2
import face_recognition
from fastapi import WebSocket
import mediapipe as mp
import numpy as np
from typing import Tuple, List, Union
import time
from werkzeug.security import generate_password_hash, check_password_hash
from backend.services.user_service import UserService
from backend.utils.image_utills import Phone_Detection

class FaceAuthenticationService:   
    def __init__(self):
        # Initialize face mesh with optimal settings
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Constants for face authentication
        self.FACE_MATCH_THRESHOLD = 0.45  # Lower is more strict
        self.EYE_BLINK_THRESHOLD = 0.26   # Threshold for eye blink detection
        self.MIN_FACE_SIZE = 80           # Minimum face size in pixels
        
        # Store recent EAR values for blink detection
        self.recent_ear_values = []
        self.MAX_EAR_HISTORY = 10
        
        # Additional anti-spoofing parameters
        self.frame_buffer = []
        self.FRAME_BUFFER_SIZE = 30  # Store 1 second at 30fps
        self.MOVEMENT_THRESHOLD = 0.02
        self.TEXTURE_THRESHOLD = 0.15
        self.REFLECTION_THRESHOLD = 0.1

  
    def calculate_eye_aspect_ratio(self, eye_landmarks: List[Tuple[float, float]]) -> float:
        """
        Calculate Eye Aspect Ratio (EAR) for blink detection
        Using the formula from Soukupová and Čech's paper
        """
        try:
            # Vertical eye distances
            A = math.dist(eye_landmarks[1], eye_landmarks[5])
            B = math.dist(eye_landmarks[2], eye_landmarks[4])
            # Horizontal eye distance
            C = math.dist(eye_landmarks[0], eye_landmarks[3])
            
            # Avoid division by zero
            if C == 0:
                return 0.0
                
            ear = (A + B) / (2.0 * C)
            return round(ear, 3)
        except Exception as e:
            print(f"EAR calculation error: {str(e)}")
            return 0.0

    def check_face_quality(self, frame: np.ndarray, face_location: Tuple[int, int, int, int]) -> bool:
        """Check if detected face meets quality requirements"""
        top, right, bottom, left = face_location
        face_height = bottom - top
        face_width = right - left
        
        # Check minimum face size
        if face_height < self.MIN_FACE_SIZE or face_width < self.MIN_FACE_SIZE:
            return False
            
        # Check if face is too close to image boundaries
        height, width = frame.shape[:2]
        margin = 20
        if (top < margin or left < margin or 
            right > width - margin or bottom > height - margin):
            return False
            
        return True




    async def _check_liveness(self, landmarks) -> Tuple[bool, str]:
        """
        Enhanced liveness detection using multiple features
        Returns (is_live, message)
        """
        try:
            
            
            # Extract eye landmarks
            left_eye = [landmarks.landmark[i] for i in [362, 385, 387, 263, 373, 380]]
            right_eye = [landmarks.landmark[i] for i in [33, 160, 158, 133, 153, 144]]
            
            # Calculate EAR for both eyes
            left_ear = self.calculate_eye_aspect_ratio([(lm.x, lm.y) for lm in left_eye])
            right_ear = self.calculate_eye_aspect_ratio([(lm.x, lm.y) for lm in right_eye])
            current_ear = (left_ear + right_ear) / 2.0
            
            # Update EAR history
            self.recent_ear_values.append(current_ear)
            if len(self.recent_ear_values) > self.MAX_EAR_HISTORY:
                self.recent_ear_values.pop(0)
            
            # Detect blink by checking for sudden EAR drop
            if len(self.recent_ear_values) >= 3:
                if (max(self.recent_ear_values[-3:]) > self.EYE_BLINK_THRESHOLD and 
                    min(self.recent_ear_values[-3:]) < self.EYE_BLINK_THRESHOLD):
                    return True, "พบการเคลื่อนไหวของตา"
            
            # Check if eyes are open
            if current_ear > self.EYE_BLINK_THRESHOLD:
                return True, "พบการเปิดของตา"
                
            return False, "ไม่พบการเปิดของตา"
            
        except Exception as e:
            print(f"Liveness check error: {str(e)}")
            return False, "Liveness check error"

   
    def analyze_texture_frequency(self, face_region: np.ndarray) -> bool:
        """Analyze facial texture frequencies to detect flat surfaces"""
        # Apply Gabor filter bank for texture analysis
        scales = [1, 2, 4]
        orientations = [0, 45, 90, 135]
        texture_features = []
        
        for scale in scales:
            for theta in orientations:
                kernel = cv2.getGaborKernel(
                    (21, 21), scale, theta, 10.0, 0.5, 0, ktype=cv2.CV_32F
                )
                filtered = cv2.filter2D(face_region, cv2.CV_8UC3, kernel)
                texture_features.append(np.var(filtered))
        
        # Real faces have more texture variation
        texture_variance = np.var(texture_features)
        return texture_variance > self.TEXTURE_THRESHOLD
    
    def check_natural_movement(self) -> bool:
        """Detect natural head movements and micro-movements"""
        if len(self.frame_buffer) < self.FRAME_BUFFER_SIZE:
            return False
            
        # Calculate facial landmarks movement
        movements = []
        for i in range(1, len(self.frame_buffer)):
            prev_landmarks = self.frame_buffer[i-1]
            curr_landmarks = self.frame_buffer[i]
            
            if prev_landmarks and curr_landmarks:
                # Calculate average landmark movement
                movement = np.mean([
                    np.sqrt((curr.x - prev.x)**2 + (curr.y - prev.y)**2)
                    for prev, curr in zip(prev_landmarks, curr_landmarks)
                ])
                movements.append(movement)
        
        if not movements:
            return False
            
        # Check for natural variation in movements
        movement_std = np.std(movements)
        return movement_std > self.MOVEMENT_THRESHOLD

    async def authenticate_face(self, websocket: WebSocket, frame: np.ndarray, 
                              user_embeddeds: Union[List, np.ndarray]) -> Tuple[bool, float, str]:
        """Enhanced face authentication with anti-spoofing measures"""
        try:
            
            # Process face landmarks
            height, width = frame.shape[:2]
            target_width = 640
            scale = target_width / width
            dimensions = (target_width, int(height * scale))
            imgS = cv2.resize(frame, dimensions)
            rgb_frame = cv2.cvtColor(imgS, cv2.COLOR_BGR2RGB)
            
            phone_detecttion = Phone_Detection()

            
            
            results = self.face_mesh.process(rgb_frame)
            if not results.multi_face_landmarks:
                return False, 0.0, "ไม่พบหน้าในภาพ"

            # Check liveness
            is_live, liveness_msg = await self._check_liveness(results.multi_face_landmarks[0])
            if not is_live:
                return False, 0.0, f"ห้ามใช้รูปภาพ: {liveness_msg}"
            
            # Store landmarks for movement analysis
            self.frame_buffer.append(results.multi_face_landmarks[0].landmark)
            if len(self.frame_buffer) > self.FRAME_BUFFER_SIZE:
                self.frame_buffer.pop(0)

            # Detect face locations
            face_locations = face_recognition.face_locations(rgb_frame, model="hog")
            if not face_locations:
                return False, 0.0, "ไม่พบหน้าในภาพ"
                
            # Extract face region for texture analysis
            top, right, bottom, left = face_locations[0]
            face_region = rgb_frame[top:bottom, left:right]
            
            if phone_detecttion.detect_phone_in_frame(rgb_frame,face_region=face_region):
                return False, 0.0, "พบหน้าจอโทรศัพท์"
            # Check face quality and texture
            if not self.check_face_quality(rgb_frame, face_locations[0]):
                return False, 0.0, "ภาพไม่ชัดหรือหน้าอยู่ใกล้เกินไป"
            
            if not self.analyze_texture_frequency(face_region):
                return False, 0.0, "พบเจอหน้าจอโทรศัพท์"
            
            # Check for natural head movements
            # if not self.check_natural_movement():
            #     return False, 0.0, "คุณเคลื่อนไหวไม่ธรรมชาติ"

            # Get face encoding
            current_encoding = face_recognition.face_encodings(rgb_frame, face_locations)[0]
            
            # Prepare user embeddings
            if isinstance(user_embeddeds, list):
                user_embeddeds = np.array(user_embeddeds)
            if len(user_embeddeds.shape) == 1:
                user_embeddeds = np.array([user_embeddeds])

            # Compare against all stored embeddings
            best_match_confidence = 0.0
            for embed in user_embeddeds:
                # Calculate face distance
                face_distance = face_recognition.face_distance([embed], current_encoding)[0]
                matches = face_recognition.compare_faces([embed], current_encoding, 
                                                      tolerance=self.FACE_MATCH_THRESHOLD)
                
                print(f"Face distance: {face_distance:.3f}")
                print(f"Match result: {matches[0]}")
                
                if matches[0] and face_distance < self.FACE_MATCH_THRESHOLD:
                    confidence = float(1 - face_distance)
                    best_match_confidence = max(best_match_confidence, confidence)

            # Return authentication result
            if best_match_confidence > 0:
                return True, best_match_confidence, "หน้าตรงกับฐานข้อมูล"
            else:
                return False, 0.0, "หน้าไม่ตรงกับฐานข้อมูล"
            
        except Exception as e:
            print(f"Enhanced authentication error: {str(e)}")
            return False, 0.0, f"Authentication error: {str(e)}"


class AdminAuthenticationService:
    def __init__(self):
        self.HASH_METHOD = 'pbkdf2:sha256'
        self.HASH_ITERATIONS = 310000
    
    def hash_password(self, password: str) -> str:
        """Hash a password using PBKDF2"""
        return generate_password_hash(password, method=self.HASH_METHOD, salt_length=16)
    
    async def login(self, employee_id: str, password: str) -> Tuple[bool, str]:
      """Check if the provided password matches the hashed password"""
      try: 
        user = await UserService.get_user_by_employee_id_admin(employee_id)
        user = user.to_json()
        user = user.get('data')
        
        if not user['employee_id']:
            return False,"ไม่พบผู้ใช้งาน"
        
        is_admin = user['roles'] == 'ADMIN'
        
        if not is_admin:
            return False,"ไม่มีสิทธิ์เข้าใช้งาน"
        print(password)
        print(user['password'])
        compair_passwpord = check_password_hash(pwhash= user['password'],password= password)
        print(compair_passwpord)
        if compair_passwpord:
            return compair_passwpord,"เข้าสู่ระบบสำเร็จ"
        else:
            return False,"รหัสผ่านไม่ถูกต้อง"
      except Exception as e:
              print(f"Login error: {str(e)}")
              return False,str(e)