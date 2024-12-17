import math
import cv2
import face_recognition
from fastapi import WebSocket
import mediapipe as mp
import numpy as np
from typing import Tuple, List, Union
import time
from werkzeug.security import generate_password_hash, check_password_hash
from skimage.feature import local_binary_pattern
from backend.services.user_service import UserService
from backend.utils.image_utills import Phone_Detection
import random

class FaceAuthenticationService:   
    def __init__(self):
        # Initialize face mesh with optimal settings
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=False,
            min_detection_confidence=0.3,
            min_tracking_confidence=0.3
        )
        
        # Constants for face authentication
        self.FACE_MATCH_THRESHOLD = 0.75
        self.EYE_BLINK_THRESHOLD = 0.15
        self.MIN_FACE_SIZE = 30
        self.TEXTURE_THRESHOLD = 4
        self.REFLECTION_THRESHOLD = 0.1
        self.EDGE_THRESHOLD = 0.1
        self.COLOR_VAR_THRESHOLD = 20
        self.MOIRE_THRESHOLD = 0.1
        
        # Store recent EAR values for blink detection
        self.recent_ear_values = []
        self.MAX_EAR_HISTORY = 5
        
        # Additional anti-spoofing parameters
        self.frame_buffer = []
        self.FRAME_BUFFER_SIZE = 30  # Store 1 second at 30fps
        self.MOVEMENT_THRESHOLD = 0.02
        self.NATURAL_MOVEMENT_THRESHOLD = 0.015
        self.MIN_MOVEMENT_FRAMES = 10
        self.natural_movement_buffer = []
        
        # เพิ่ม attributes สำหรับการตรวจจับท่าทาง
        self.POSE_TYPES = ['หันซ้าย', 'หันขวา']
        self.current_pose = None
        self.pose_completed = False
        self.pose_start_time = None
        self.POSE_TIMEOUT = 5  # timeout 5 วินาที

  
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
        Enhanced liveness detection using multiple features, focusing on blink detection.
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

            # Smooth EAR values with a moving average (reduce noise)
            if not hasattr(self, "recent_ear_values"):
                self.recent_ear_values = []
            self.recent_ear_values.append(current_ear)
            if len(self.recent_ear_values) > self.MAX_EAR_HISTORY:
                self.recent_ear_values.pop(0)
            
            smoothed_ear = sum(self.recent_ear_values[-3:]) / len(self.recent_ear_values[-3:])

            # Adaptive threshold (optional): Update based on baseline EAR
            if not hasattr(self, "baseline_ear"):
                self.baseline_ear = smoothed_ear
            if smoothed_ear > self.baseline_ear * 1.1:  # Update baseline if eyes open wider
                self.baseline_ear = smoothed_ear

            # Detect blinking: Look for rapid drops and rises in EAR
            if len(self.recent_ear_values) >= 3:
                last_ear = self.recent_ear_values[-1]
                min_ear = min(self.recent_ear_values[-3:])
                max_ear = max(self.recent_ear_values[-3:])

                # Blink occurs if EAR drops below threshold and rises back
                if max_ear > self.EYE_BLINK_THRESHOLD and min_ear < self.EYE_BLINK_THRESHOLD:
                    duration = self.recent_ear_values[-3:].index(min_ear)  # How long the blink lasted
                    if 1 <= duration <= 2:  # Validate realistic blink duration
                        return True, "พบการกะพริบตา"

            # Check if eyes are open based on smoothed EAR
            # if smoothed_ear > self.EYE_OPEN_THRESHOLD:
            #     return True, "พบการเปิดของตา"
            
            return False, "ไม่พบการกะพริบตาหรือการเปิดของตา"

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
        print(f"Texture variance: {texture_variance:.3f}")
        return texture_variance > self.TEXTURE_THRESHOLD
    
    def check_natural_movement(self, landmarks_history) -> bool:
        if len(landmarks_history) < 10:  # ต้องมีการเก็บประวัติจุด landmarks อย่างน้อย 10 เฟรม
            return False
        
        movements = []
        for i in range(1, len(landmarks_history)):
            prev = landmarks_history[i-1]
            curr = landmarks_history[i]
            
            # คำนวณการเคลื่อนที่ของจุดสำคัญ
            movement = np.mean([
                np.sqrt((curr[j].x - prev[j].x)**2 + (curr[j].y - prev[j].y)**2)
                for j in range(len(curr))
            ])
            movements.append(movement)
        
        # ตรวจสอบการเคลื่อนไหวที่เป็นธรรมชาติ
        movement_std = np.std(movements)
        movement_mean = np.mean(movements)
        
        # การเคลื่อนไหวต้องไม่นิ่งเกินไปและไม่กระตุกเกินไป
        return 0.0001 < movement_mean < 0.01 and 0.00005 < movement_std < 0.005

    async def authenticate_face(self, websocket: WebSocket, frame: np.ndarray, 
                              user_embeddeds: Union[List, np.ndarray]) -> Tuple[bool, float, str]:
        try:
            # 1. ลดขนาดภาพลงมากขึ้นเพื่อเพิ่มความเร็ว
            target_width = 200
            height, width = frame.shape[:2]
            scale = target_width / width
            dimensions = (target_width, int(height * scale))
            imgS = cv2.resize(frame, dimensions)
            rgb_frame = cv2.cvtColor(imgS, cv2.COLOR_BGR2RGB)
            
            # 2. ตรัจจับใบหน้า
            face_locations = face_recognition.face_locations(rgb_frame, model="hog", number_of_times_to_upsample=0)
            if not face_locations:
                return False, 0.0, "กรุณาวางใบหน้าให้อยู่ในกรอบ"

            # 3. ตรวจสอบขนาดและตำแหน่งใบหน้า
            top, right, bottom, left = face_locations[0]
            face_height = bottom - top
            face_width = right - left
            
            if face_height < self.MIN_FACE_SIZE or face_width < self.MIN_FACE_SIZE:
                return False, 0.0, "กรุณาเข้าใกล้กล้องมากขึ้น"

            # 4. ตรวจสอบการใช้ภาพถ่าย
            face_region = imgS[top:bottom, left:right]
            if self.quick_spoof_detection(face_region):
                return False, 0.0, "กรุณาใช้ใบหน้าจริงเท่านั้น"

            # 5. ตรวจสอบการมีชีวิต
            results = self.face_mesh.process(rgb_frame)
            if not results.multi_face_landmarks:
                return False, 0.0, "กรุณาหันหน้าเข้าหากล้อง"

            landmarks = results.multi_face_landmarks[0]

            # 6. ตรวจสอบท่าทาง
            if not self.current_pose:
                # สุ่มท่าทางใหม่
                pose = self.generate_random_pose()
                await websocket.send_json({
                    "status": "pose_required",
                    "pose": pose,
                    "message": f"กรุณาทำท่าทาง: {pose}"
                })
                return False, 0.0, f"กรุณาทำท่าทาง: {pose}"

            # ตรวจสอบว่าท่าทางถูกต้องหรือไม่
            pose_success, pose_message = self.check_pose(landmarks)
            if not pose_success:
                return False, 0.0, pose_message

            # 7. ถ้าทำท่าทางถูกต้อง ดำเนินการตรวจสอบใบหน้า
            if self.pose_completed:
                # รีเซ็ตท่าทางสำหรับครั้งต่อไป
                self.current_pose = None
                self.pose_completed = False

                # 8. เปรียบเทียบใบหน้า
                current_encoding = face_recognition.face_encodings(rgb_frame, face_locations)[0]
                
                if isinstance(user_embeddeds, list):
                    user_embeddeds = np.array(user_embeddeds)
                if len(user_embeddeds.shape) == 1:
                    user_embeddeds = np.array([user_embeddeds])

                # ตรวจสอบความเหมือนกับทุก embedding
                min_distance = float('inf')
                for embed in user_embeddeds:
                    face_distance = face_recognition.face_distance([embed], current_encoding)[0]
                    min_distance = min(min_distance, face_distance)
                    if face_distance < self.FACE_MATCH_THRESHOLD:
                        confidence = float(1 - face_distance)
                        return True, confidence, "ใบหน้าไม่ตรงกับฐานข้อมูล"

                return False, 0.0, "ใบหน้าไม่ตรงกับฐานข้อมูล"
            
            return False, 0.0, "กรุณาทำท่าทางให้ถูกต้อง"

        except Exception as e:
            print(f"Authentication error: {str(e)}")
            return False, 0.0, f"เกิดข้อผิดพลาด: {str(e)}"

    def quick_spoof_detection(self, face_region: np.ndarray) -> bool:
        try:
            # 1. ตรับความสว่างและคอนทราสต์อัตโนมัติ
            lab = cv2.cvtColor(face_region, cv2.COLOR_BGR2LAB)
            l_channel = lab[:,:,0]
            
            # ปรับความสว่างอัตโนมัติ
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
            enhanced_l = clahe.apply(l_channel)
            
            # รวมภาพที่ปรับแสงแล้ว
            lab[:,:,0] = enhanced_l
            enhanced_face = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
            
            # 2. ปรับขนาดภาพให้เหมาะสม
            target_size = (256, 256)
            face_region = cv2.resize(enhanced_face, target_size)

            # 3. ตรวจสอบความมีชีวิตด้วย Depth Information
            gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
            gradients = np.gradient(gray)
            depth_score = np.mean(np.abs(gradients[0]) + np.abs(gradients[1]))
            
            if depth_score < 3:  # ลดค่าลงเพื่อรองรับแสงน้อย
                return True

            # 4. ตรวจสอบ Skin Texture แบบยืดหยุ่น
            radius = 1
            n_points = 8
            lbp = local_binary_pattern(gray, n_points, radius, method='uniform')
            texture_var = np.var(lbp)
            
            # ปรับค่าตามความสว่าง
            brightness = np.mean(gray)
            if brightness < 50:  # แสงน้อย
                min_texture = 1.0
            elif brightness > 200:  # แสงมาก
                min_texture = 3.0
            else:  # แสงปกติ
                min_texture = 2.0
                
            if texture_var < min_texture:
                return True

            # 5. ตรวจสอบสีผิวแบบปรับตามแสง
            hsv = cv2.cvtColor(face_region, cv2.COLOR_BGR2HSV)
            
            # ปรับช่วงการตรวจจับสีผิวตามความสว่าง
            if brightness < 50:  # แสงน้อย
                skin_mask = cv2.inRange(hsv, (0, 10, 30), (25, 250, 250))
            elif brightness > 200:  # แสงมาก
                skin_mask = cv2.inRange(hsv, (0, 10, 50), (25, 200, 250))
            else:  # แสงปกติ
                skin_mask = cv2.inRange(hsv, (0, 10, 40), (25, 230, 250))
            
            skin_ratio = np.sum(skin_mask > 0) / skin_mask.size
            if skin_ratio < 0.15:  # ลดค่าลงเพื่อรองรับแสงน้อย
                return True

            # 6. ตรวจสอบคอนทราสต์แบบปรับตามแสง
            v_channel = hsv[:,:,2]
            contrast = np.std(v_channel)
            
            # ปรับค่าต่ำสุดของคอนทราสต์ตามความสว่าง
            if brightness < 50:
                min_contrast = 5
            elif brightness > 200:
                min_contrast = 15
            else:
                min_contrast = 10
                
            if contrast < min_contrast:
                return True

            return False

        except Exception as e:
            print(f"Spoof detection error: {str(e)}")
            return False

    async def _check_liveness_simple(self, landmarks) -> Tuple[bool, str]:
        """ตรวจสอบการมีชีวิตแบบง่ายและรวดเร็ว"""
        try:
            # ตรวจสอบตาทั้งสองข้าง
            left_eye = [landmarks.landmark[i] for i in [362, 385, 387, 263, 373, 380]]
            right_eye = [landmarks.landmark[i] for i in [33, 160, 158, 133, 153, 144]]

            # คำนวณ EAR แบบง่าย
            left_ear = self.calculate_eye_aspect_ratio([(lm.x, lm.y) for lm in left_eye])
            right_ear = self.calculate_eye_aspect_ratio([(lm.x, lm.y) for lm in right_eye])
            current_ear = (left_ear + right_ear) / 2.0

            # ตรวจสอบวารเปิดตา
            if current_ear > self.EYE_BLINK_THRESHOLD:
                return True, "ตรวจพบใบหน้า"
            
            return False, "กรุณาเปิดตาให้ชัดเจน"

        except Exception as e:
            print(f"Liveness check error: {str(e)}")
            return False, "ไม่สามารถตรวจสอบใบหน้าได้"

    def _calculate_natural_movement(self) -> float:
        """คำนวณการเคลื่อนไหวที่เป็นธรรมชาติจาก landmarks"""
        movements = []
        for i in range(1, len(self.natural_movement_buffer)):
            prev = self.natural_movement_buffer[i-1]
            curr = self.natural_movement_buffer[i]
            
            # คำนวณการเคลื่อนที่เฉลี่ยของ landmarks
            movement = np.mean([
                np.sqrt((curr[j].x - prev[j].x)**2 + 
                       (curr[j].y - prev[j].y)**2)
                for j in range(len(curr))
            ])
            movements.append(movement)
            
        return np.mean(movements) if movements else 0.0

    def detect_moire_pattern(self, gray_image: np.ndarray) -> float:
        """ตรวจจับลาย Moiré ที่มักพบในภาพถ่ายจากหน้าจอ"""
        # ใช้ FFT เพื่อตรวจจับรูปแบบที่ซ้ำกัน
        f_transform = np.fft.fft2(gray_image)
        magnitude_spectrum = np.abs(np.fft.fftshift(f_transform))
        
        # หาความถี่ที่โดดเด่น
        threshold = np.mean(magnitude_spectrum) * 2
        high_freq_ratio = np.sum(magnitude_spectrum > threshold) / magnitude_spectrum.size
        
        return high_freq_ratio

    def detect_screen_reflection(self, image: np.ndarray) -> bool:
        """ตรวจจับการสะท้อนแสงที่ผิดปกติ"""
        hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
        
        # ตรวจสอบความสว่างที่ผิดปกติ
        v_channel = hsv[:,:,2]
        bright_pixels = np.sum(v_channel > 250)
        total_pixels = v_channel.size
        
        # ถ้ามีพื้นที่สว่างมากเกินไป อาจเป็นการสะท้อนจากหน้าจอ
        reflection_ratio = bright_pixels / total_pixels
        return reflection_ratio > 0.1

    def analyze_face_texture(self, face_region: np.ndarray) -> bool:
        """วิเคราะห์ texture ของผิวหน้าเพื่อตรวจจับภาพถ่าย"""
        gray_face = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        
        # ใช้ Local Binary Pattern
        radius = 1
        n_points = 8 * radius
        lbp = local_binary_pattern(gray_face, n_points, radius, method='uniform')
        
        # คำนวณ histogram ของ LBP
        hist, _ = np.histogram(lbp.ravel(), bins=np.arange(0, n_points + 3), density=True)
        
        # ตรวจสอบความหลากหลายของ texture
        texture_variety = np.sum(hist > 0.01)
        return texture_variety >= 4

    def check_face_depth(self, landmarks) -> bool:
        """ตรวจสอบความลึกของใบหน้าจาก landmarks"""
        # เลือกจุดสำคัญที่แสดงความลึก
        nose_tip = landmarks.landmark[4]
        left_eye = landmarks.landmark[33]
        right_eye = landmarks.landmark[263]
        
        # คำนวณระยะห่างระหว่างจุด
        eye_dist = math.sqrt((left_eye.x - right_eye.x)**2 + (left_eye.y - right_eye.y)**2)
        nose_depth = abs(nose_tip.z - (left_eye.z + right_eye.z)/2)
        
        # ตรวจสอบความสมเหตุสมผลของความลึก
        return nose_depth > 0.01 and nose_depth < 0.1 and eye_dist > 0.1

    def generate_random_pose(self) -> str:
        """สุ่มท่าทางที่ต้องการให้ผู้ใช้ทำ"""
        self.current_pose = random.choice(self.POSE_TYPES)
        self.pose_completed = False
        self.pose_start_time = time.time()
        return self.current_pose

    def check_pose(self, landmarks) -> Tuple[bool, str]:
        """ตรวจสอบว่าผู้ใช้ทำท่าทางถูกต้องหรือไม่"""
        if not self.current_pose or self.pose_completed:
            return False, "กรุณารอการสุ่มท่าทางใหม่"

        # ตรวจสอบ timeout
        if time.time() - self.pose_start_time > self.POSE_TIMEOUT:
            self.current_pose = None
            return False, "หมดเวลา กรุณาลองใหม่"

        # คำนวณการหันซ้าย-ขวาจาก landmarks
        nose_tip = landmarks.landmark[4]
        left_eye = landmarks.landmark[33]
        right_eye = landmarks.landmark[263]

        # ตรวจสอบแต่ละท่าทาง
        if self.current_pose == 'หันซ้าย':
            head_turn = (right_eye.x - nose_tip.x) / (right_eye.x - left_eye.x)
            if head_turn > 0.7:
                self.pose_completed = True
                return True, "ทำท่าทางถูกต้อง"

        elif self.current_pose == 'หันขวา':
            head_turn = (nose_tip.x - left_eye.x) / (right_eye.x - left_eye.x)
            if head_turn > 0.7:
                self.pose_completed = True
                return True, "ทำท่าทางถูกต้อง"

        return False, "กรุณา" + self.current_pose


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