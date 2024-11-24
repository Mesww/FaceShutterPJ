from pathlib import Path
import cv2
import numpy as np
import os
import json
import time
import base64
import uuid
import math

from backend.models.returnformat import Returnformat
import mediapipe as mp

from backend.models.user_model import Faceimage, RoleEnum, User, Userupdate
from backend.services.user_service import UserService
from backend.utils.image_utills import Image_utills

import cv2
import numpy as np
import mediapipe as mp
from fastapi import WebSocket
from typing import List, Dict, Optional, Tuple
import asyncio
from datetime import datetime

class FaceCheckinSystem:
    def __init__(self):
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        )
        # Initialize face feature extractor
        self.feature_extractor = cv2.face.LBPHFaceRecognizer_create()
        
    async def process_checkin(self, websocket: WebSocket, user_service: any) -> Dict:
        """Main check-in processing logic"""
        try:
            # Get employee ID first
            await websocket.send_json({
                "status": "request",
                "message": "Please provide your employee ID"
            })
            
            employee_data = await websocket.receive_json()
            employee_id = employee_data.get("employee_id")
            
            # Fetch user data and stored face features
            user_data = await user_service.get_user_by_employee_id(employee_id)
            if not user_data:
                await websocket.send_json({
                    "status": "error",
                    "message": "Employee ID not found"
                })
                return {"success": False, "message": "Employee ID not found"}
                
            # Initialize verification session
            verification_result = await self._verify_face_sequence(
                websocket,
                user_data["stored_features"],
                user_data["name"]
            )
            
            if verification_result["success"]:
                # Record successful check-in
                timestamp = datetime.now()
                await user_service.record_checkin(
                    employee_id=employee_id,
                    timestamp=timestamp,
                    confidence=verification_result["confidence"]
                )
                
                return {
                    "success": True,
                    "message": f"Welcome {user_data['name']}!",
                    "timestamp": timestamp,
                    "confidence": verification_result["confidence"]
                }
            else:
                return {
                    "success": False,
                    "message": verification_result["message"]
                }
                
        except Exception as e:
            return {"success": False, "message": f"Check-in failed: {str(e)}"}

    async def _verify_face_sequence(self, websocket: WebSocket, 
                                  stored_features: List[Dict],
                                  user_name: str) -> Dict:
        """Verify face through a sequence of checks"""
        verification_steps = [
            {"instruction": "Please look at the camera", "direction": "front"},
            {"instruction": "Please blink naturally", "direction": "blink"},
            {"instruction": "Please turn slightly left", "direction": "left"},
            {"instruction": "Please turn slightly right", "direction": "right"}
        ]
        
        liveness_confirmed = False
        face_matched = False
        best_confidence = 0
        attempts = 0
        max_attempts = 3
        
        while attempts < max_attempts:
            try:
                # Process each verification step
                for step in verification_steps:
                    await websocket.send_json({
                        "status": "instruction",
                        "message": step["instruction"]
                    })
                    
                    # Collect and verify frame
                    frame_result = await self._process_verification_frame(
                        websocket,
                        stored_features,
                        step["direction"]
                    )
                    
                    if not frame_result["success"]:
                        await websocket.send_json({
                            "status": "warning",
                            "message": frame_result["message"]
                        })
                        continue
                        
                    # Update verification status
                    if frame_result["confidence"] > best_confidence:
                        best_confidence = frame_result["confidence"]
                    
                    if step["direction"] == "blink" and frame_result["liveness_detected"]:
                        liveness_confirmed = True
                    
                    if frame_result["confidence"] > 75:  # Confidence threshold
                        face_matched = True
                    
                    # Provide feedback
                    await websocket.send_json({
                        "status": "progress",
                        "message": f"Verification in progress... ({frame_result['confidence']:.1f}% match)"
                    })
                    
                # Check if all verification criteria are met
                if face_matched and liveness_confirmed:
                    return {
                        "success": True,
                        "message": "Face verification successful",
                        "confidence": best_confidence
                    }
                    
                attempts += 1
                if attempts < max_attempts:
                    await websocket.send_json({
                        "status": "retry",
                        "message": f"Verification incomplete, please try again. Attempt {attempts + 1}/{max_attempts}"
                    })
                
            except Exception as e:
                return {
                    "success": False,
                    "message": f"Verification error: {str(e)}"
                }
                
        return {
            "success": False,
            "message": "Maximum verification attempts reached"
        }

    async def _process_verification_frame(self, websocket: WebSocket,
                                        stored_features: List[Dict],
                                        expected_direction: str) -> Dict:
        """Process and verify a single frame during check-in"""
        try:
            # Receive frame from client
            frame_data = await websocket.receive_json()
            frame = self._decode_frame(frame_data["image"])
            
            if frame is None:
                return {
                    "success": False,
                    "message": "Invalid frame received"
                }
                
            # Extract current frame features
            current_features = self._extract_frame_features(frame)
            if not current_features:
                return {
                    "success": False,
                    "message": "Could not detect face in frame"
                }
                
            # Verify direction
            if not self._verify_face_direction(current_features, expected_direction):
                return {
                    "success": False,
                    "message": f"Please follow the instruction: {expected_direction}"
                }
                
            # Compare with stored features
            best_match = self._compare_features(current_features, stored_features)
            
            # Check for liveness if requested
            liveness_detected = False
            if expected_direction == "blink":
                liveness_detected = self._detect_blink(current_features)
                
            return {
                "success": True,
                "confidence": best_match["confidence"],
                "direction_matched": True,
                "liveness_detected": liveness_detected,
                "message": "Frame processed successfully"
            }
            
        except Exception as e:
            return {
                "success": False,
                "message": f"Frame processing error: {str(e)}"
            }

    def _decode_frame(self, image_data: bytes) -> Optional[np.ndarray]:
        """Decode received image data"""
        try:
            frame_bytes = np.frombuffer(bytearray(image_data), dtype=np.uint8)
            return cv2.imdecode(frame_bytes, cv2.IMREAD_COLOR)
        except Exception:
            return None

    def _extract_frame_features(self, frame: np.ndarray) -> Optional[Dict]:
        """Extract features from a frame"""
        if frame is None:
            return None
            
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        
        if not results.multi_face_landmarks:
            return None
            
        landmarks = results.multi_face_landmarks[0]
        
        return {
            'landmarks': landmarks,
            'face_measurements': self._calculate_face_measurements(landmarks, frame.shape),
            'eye_state': self._calculate_eye_state(landmarks)
        }

    def _calculate_face_measurements(self, landmarks, frame_shape) -> Dict:
        """Calculate key facial measurements"""
        h, w = frame_shape[:2]
        
        # Get key points
        nose_tip = landmarks.landmark[4]
        left_eye = landmarks.landmark[33]
        right_eye = landmarks.landmark[263]
        mouth_left = landmarks.landmark[61]
        mouth_right = landmarks.landmark[291]
        
        measurements = {
            'face_direction': self._calculate_face_direction(landmarks),
            'eye_distance': abs(right_eye.x - left_eye.x) * w,
            'mouth_width': abs(mouth_right.x - mouth_left.x) * w,
            'nose_position': (nose_tip.x * w, nose_tip.y * h)
        }
        
        return measurements

    def _calculate_face_direction(self, landmarks) -> str:
        """Determine face direction based on landmark positions"""
        nose_tip = landmarks.landmark[4]
        left_eye = landmarks.landmark[33]
        right_eye = landmarks.landmark[263]
        
        # Calculate horizontal position of nose relative to eyes
        eye_center_x = (left_eye.x + right_eye.x) / 2
        nose_offset = nose_tip.x - eye_center_x
        
        # Determine direction based on nose position
        if abs(nose_offset) < 0.05:
            return "front"
        elif nose_offset > 0:
            return "right"
        else:
            return "left"

    def _calculate_eye_state(self, landmarks) -> Dict:
        """Calculate eye state (open/closed)"""
        # Eye landmarks indices
        left_eye = [landmarks.landmark[i] for i in [362, 385, 387, 263, 373, 380]]
        right_eye = [landmarks.landmark[i] for i in [33, 160, 158, 133, 153, 144]]
        
        # Calculate eye aspect ratio
        left_ear = self._calculate_eye_aspect_ratio(left_eye)
        right_ear = self._calculate_eye_aspect_ratio(right_eye)
        
        return {
            'left_eye_ratio': left_ear,
            'right_eye_ratio': right_ear,
            'avg_eye_ratio': (left_ear + right_ear) / 2
        }

    def _calculate_eye_aspect_ratio(self, eye_landmarks) -> float:
        """Calculate the eye aspect ratio"""
        # Vertical eye landmarks
        A = self._euclidean_dist(eye_landmarks[1], eye_landmarks[5])
        B = self._euclidean_dist(eye_landmarks[2], eye_landmarks[4])
        # Horizontal eye landmark
        C = self._euclidean_dist(eye_landmarks[0], eye_landmarks[3])
        
        # Eye aspect ratio
        ear = (A + B) / (2.0 * C) if C > 0 else 0
        return ear

    def _euclidean_dist(self, p1, p2) -> float:
        """Calculate Euclidean distance between two points"""
        return ((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2) ** 0.5

    def _compare_features(self, current_features: Dict, 
                         stored_features: List[Dict]) -> Dict:
        """Compare current features with stored features"""
        best_match = {
            "confidence": 0,
            "matching_direction": None
        }
        
        current_measurements = current_features["face_measurements"]
        
        for stored_feature in stored_features:
            stored_measurements = stored_feature["face_measurements"]
            
            # Calculate similarity scores for different metrics
            similarity_scores = {
                'eye_distance': self._calculate_similarity(
                    current_measurements['eye_distance'],
                    stored_measurements['eye_distance']
                ),
                'mouth_width': self._calculate_similarity(
                    current_measurements['mouth_width'],
                    stored_measurements['mouth_width']
                ),
                'nose_position': self._calculate_point_similarity(
                    current_measurements['nose_position'],
                    stored_measurements['nose_position']
                )
            }
            
            # Calculate weighted average confidence
            confidence = (
                similarity_scores['eye_distance'] * 0.4 +
                similarity_scores['mouth_width'] * 0.3 +
                similarity_scores['nose_position'] * 0.3
            ) * 100
            
            if confidence > best_match["confidence"]:
                best_match["confidence"] = confidence
                best_match["matching_direction"] = stored_feature.get("direction")
                
        return best_match

    def _calculate_similarity(self, val1: float, val2: float) -> float:
        """Calculate similarity between two values"""
        max_val = max(val1, val2)
        if max_val == 0:
            return 0
        return 1 - abs(val1 - val2) / max_val

    def _calculate_point_similarity(self, p1: Tuple[float, float], 
                                  p2: Tuple[float, float]) -> float:
        """Calculate similarity between two points"""
        distance = ((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2) ** 0.5
        return 1 / (1 + distance)  # Normalize to 0-1 range

    def _verify_face_direction(self, features: Dict, 
                             expected_direction: str) -> bool:
        """Verify if face is in expected direction"""
        if expected_direction == "blink":
            return True  # Direction doesn't matter for blink verification
            
        detected_direction = features["face_measurements"]["face_direction"]
        return detected_direction == expected_direction

    def _detect_blink(self, features: Dict) -> bool:
        """Detect if the person is blinking"""
        eye_state = features["eye_state"]
        return eye_state["avg_eye_ratio"] < 0.2  # Threshold for blink detection

# Example usage in your websocket endpoint:
"""
@app.websocket("/ws/checkin")
async def checkin_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    checkin_system = FaceCheckinSystem()
    user_service = UserService()
    
    try:
        result = await checkin_system.process_checkin(websocket, user_service)
        
        if result["success"]:
            await websocket.send_json({
                "status": "success",
                "message": result["message"],
                "timestamp": str(result["timestamp"]),
                "confidence": result["confidence"]
            })
        else:
            await websocket.send_json({
                "status": "error",
                "message": result["message"]
            })
            
    except Exception as e:
        await websocket.send_json({
            "status": "error",
            "message": f"Check-in failed: {str(e)}"
        })
"""


import cv2
import numpy as np
import mediapipe as mp
from fastapi import WebSocket
from typing import List, Dict, Optional
import asyncio

class EnhancedFaceScanService:
    def __init__(self):
        self.face_mesh = mp.solutions.face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        )
        self.scan_directions = {
            "basic": [
                {"direction": "Front", "instruction": "Look straight ahead"},
                {"direction": "Turn left", "instruction": "Turn your head slightly left"},
                {"direction": "Turn right", "instruction": "Turn your head slightly right"}
            ],
            "expressions": [
                {"direction": "Front_Neutral", "instruction": "Look straight with a neutral expression"},
                {"direction": "Front_Blink", "instruction": "Look straight and blink naturally"},
                {"direction": "Front_Smile", "instruction": "Look straight with a slight smile"}
            ],
            "angles": [
                {"direction": "Slight_Up", "instruction": "Tilt your head slightly up"},
                {"direction": "Slight_Down", "instruction": "Tilt your head slightly down"}
            ]
        }

    async def collect_face_scans(self, websocket: WebSocket) -> Dict:
        """
        Collect comprehensive face scans with various poses and expressions
        """
        all_images = []
        all_features = []
        quality_threshold = 0.8

        # Collect basic direction scans
        basic_scans = await self._collect_direction_set(
            websocket, 
            self.scan_directions["basic"],
            "Basic pose scanning..."
        )
        all_images.extend(basic_scans)

        # Collect expression variations
        expression_scans = await self._collect_direction_set(
            websocket,
            self.scan_directions["expressions"],
            "Expression variation scanning..."
        )
        all_images.extend(expression_scans)

        # Collect angle variations
        angle_scans = await self._collect_direction_set(
            websocket,
            self.scan_directions["angles"],
            "Angle variation scanning..."
        )
        all_images.extend(angle_scans)

        # Extract and verify features from all collected images
        for image_data in all_images:
            features = self._extract_features(image_data["frame"])
            if features and self._verify_scan_quality(features, quality_threshold):
                all_features.append({
                    "features": features,
                    "direction": image_data["direction"],
                    "frame": image_data["frame"]
                })
            else:
                await websocket.send_json({
                    "status": "warning",
                    "message": f"Low quality scan detected for {image_data['direction']}, consider retaking"
                })

        return {
            "images": all_images,
            "features": all_features
        }

    async def _collect_direction_set(self, websocket: WebSocket, 
                                   directions: List[Dict], 
                                   progress_message: str) -> List[Dict]:
        """
        Collect a set of directional scans
        """
        collected_images = []
        
        await websocket.send_json({
            "status": "progress",
            "message": progress_message,
            "total_steps": len(directions)
        })

        for idx, direction_info in enumerate(directions):
            direction = direction_info["direction"]
            instruction = direction_info["instruction"]
            
            await websocket.send_json({
                "status": "instruction",
                "message": instruction,
                "current_step": idx + 1,
                "direction": direction
            })

            # Collect multiple frames for each direction
            frames_collected = 0
            required_frames = 3  # Collect multiple frames for better quality assurance
            
            while frames_collected < required_frames:
                try:
                    data = await websocket.receive_json()
                    frame = self._decode_frame(data["image"])
                    
                    if not frame is None:
                        quality_score = self._assess_frame_quality(frame)
                        
                        if quality_score >= 0.8:  # Quality threshold
                            collected_images.append({
                                "frame": frame,
                                "direction": direction,
                                "quality_score": quality_score
                            })
                            frames_collected += 1
                            
                            await websocket.send_json({
                                "status": "progress",
                                "message": f"Frame {frames_collected}/{required_frames} captured for {direction}",
                                "quality_score": quality_score
                            })
                        else:
                            await websocket.send_json({
                                "status": "warning",
                                "message": "Image quality too low, please adjust position or lighting",
                                "quality_score": quality_score
                            })
                    
                except Exception as e:
                    await websocket.send_json({
                        "status": "error",
                        "message": f"Error capturing frame: {str(e)}"
                    })

        return collected_images

    def _decode_frame(self, image_data: bytes) -> Optional[np.ndarray]:
        """Decode received image data into OpenCV format"""
        try:
            frame_bytes = np.frombuffer(bytearray(image_data), dtype=np.uint8)
            return cv2.imdecode(frame_bytes, cv2.IMREAD_COLOR)
        except Exception as e:
            print(f"Error decoding frame: {e}")
            return None

    def _assess_frame_quality(self, frame: np.ndarray) -> float:
        """
        Assess the quality of the captured frame
        Returns a quality score between 0 and 1
        """
        if frame is None:
            return 0.0

        # Convert to grayscale for analysis
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Calculate various quality metrics
        brightness = np.mean(gray) / 255.0  # Normalize to 0-1
        contrast = np.std(gray) / 255.0
        blur_score = self._calculate_blur_score(gray)
        
        # Calculate face size and position score
        face_score = self._calculate_face_position_score(frame)
        
        # Weighted average of quality metrics
        quality_score = (
            brightness * 0.2 +
            contrast * 0.2 +
            blur_score * 0.3 +
            face_score * 0.3
        )
        
        return min(max(quality_score, 0.0), 1.0)

    def _calculate_blur_score(self, gray_image: np.ndarray) -> float:
        """Calculate image sharpness score"""
        laplacian_var = cv2.Laplacian(gray_image, cv2.CV_64F).var()
        return min(laplacian_var / 500.0, 1.0)  # Normalize to 0-1

    def _calculate_face_position_score(self, frame: np.ndarray) -> float:
        """Calculate score based on face size and position in frame"""
        results = self.face_mesh.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        
        if not results.multi_face_landmarks:
            return 0.0
            
        landmarks = results.multi_face_landmarks[0].landmark
        
        # Calculate face bounding box
        x_coords = [landmark.x for landmark in landmarks]
        y_coords = [landmark.y for landmark in landmarks]
        
        # Calculate face size relative to frame
        face_width = max(x_coords) - min(x_coords)
        face_height = max(y_coords) - min(y_coords)
        
        # Calculate face center position
        face_center_x = (max(x_coords) + min(x_coords)) / 2
        face_center_y = (max(y_coords) + min(y_coords)) / 2
        
        # Score based on size (should be between 30-70% of frame)
        size_score = 1.0 - abs(0.5 - (face_width + face_height) / 2)
        
        # Score based on centering (should be near center of frame)
        center_score = 1.0 - (abs(0.5 - face_center_x) + abs(0.5 - face_center_y)) / 2
        
        return (size_score + center_score) / 2

    def _verify_scan_quality(self, features: Dict, threshold: float) -> bool:
        """Verify if the extracted features meet quality standards"""
        if not features:
            return False
            
        # Check facial symmetry
        symmetry_score = features.get('face_symmetry', 0)
        if symmetry_score < threshold:
            return False
            
        # Check feature completeness
        required_features = ['face_width', 'face_height', 'eye_distance', 'nose_to_mouth']
        if not all(key in features for key in required_features):
            return False
            
        return True

    def _extract_features(self, frame: np.ndarray) -> Optional[Dict]:
        """Extract facial features from the frame"""
        if frame is None:
            return None
            
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)
        
        if not results.multi_face_landmarks:
            return None
            
        landmarks = results.multi_face_landmarks[0]
        
        return {
            'face_width': self._calculate_face_width(landmarks, frame.shape[1]),
            'face_height': self._calculate_face_height(landmarks, frame.shape[0]),
            'eye_distance': self._calculate_eye_distance(landmarks, frame.shape[1]),
            'nose_to_mouth': self._calculate_nose_to_mouth(landmarks, frame.shape[0]),
            'face_symmetry': self._calculate_face_symmetry(landmarks),
            'landmarks': landmarks
        }

# Example usage in your websocket endpoint:
"""
@app.websocket("/ws/scan")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    face_scan_service = EnhancedFaceScanService()
    user_service = UserService()
    
    # Get user details
    await websocket.send_json({
        "status": "request",
        "message": "Provide user details",
        "required_fields": ["employee_id", "name", "email", "tel", "password"]
    })
    
    user_details = await websocket.receive_json()
    
    try:
        # Collect face scans
        scan_results = await face_scan_service.collect_face_scans(websocket)
        
        # Save user data and scans
        user_id = await user_service.save_user_and_images(
            employee_id=user_details["employee_id"],
            name=user_details["name"],
            email=user_details["email"],
            password=user_details["password"],
            images=scan_results["images"],
            tel=user_details["tel"]
        )
        
        await websocket.send_json({
            "status": "success",
            "message": f"Registration complete! User ID: {user_id}",
            "scans_collected": len(scan_results["images"]),
            "features_extracted": len(scan_results["features"])
        })
        
    except Exception as e:
        await websocket.send_json({
            "status": "error",
            "message": f"Registration failed: {str(e)}"
        })
"""

class Face_service:
    base_dir = Path(__file__).resolve().parent.parent
    image_storage_path = os.path.join(base_dir, 'images')
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
            int(max([lm.y * h for lm in landmarks]))
        ]
        # Crop the face region from the frame
        cropped_face = frame[bounding_box[1]:bounding_box[3], bounding_box[0]:bounding_box[2]]
        return cropped_face
    @staticmethod
    def check_head_direction(face_landmarks):
        # Get coordinates of specific landmarks (e.g., nose, eyes, and mouth)
        nose_x = face_landmarks.landmark[1].x  # Use index 1 for NOSE_TIP
        # Threshold values to allow for more flexible detection
        threshold_x = 0.03  # Horizontal threshold for detecting left/right
        # Check head direction based on horizontal (left/right) and vertical (up/down) positions
        if nose_x < face_landmarks.landmark[33].x - threshold_x or nose_x < face_landmarks.landmark[61].x - threshold_x:
            return "Turn left"
        elif nose_x > face_landmarks.landmark[263].x + threshold_x or nose_x > face_landmarks.landmark[291].x + threshold_x:
            return "Turn right"
        else:
            return "Front"
    
    def calculate_eye_aspect_ratio(self,eye_landmarks):
        """Calculate the Eye Aspect Ratio to detect blinking"""
        # Vertical eye landmarks
        A = math.dist(eye_landmarks[1], eye_landmarks[5])
        B = math.dist(eye_landmarks[2], eye_landmarks[4])
        # Horizontal eye landmark
        C = math.dist(eye_landmarks[0], eye_landmarks[3])
        
        # Eye Aspect Ratio
        ear = (A + B) / (2.0 * C)
        return ear

    def is_face_moving(self,prev_landmarks, curr_landmarks, threshold=0.02):
        """Check if face is moving between frames"""
        if prev_landmarks is None:
            return False
        
        # Calculate total movement of landmark points
        total_movement = sum([
            math.dist((lm1.x, lm1.y), (lm2.x, lm2.y)) 
            for lm1, lm2 in zip(prev_landmarks.landmark, curr_landmarks.landmark)
        ])
        
        return total_movement > threshold
        
    @staticmethod
    def draw_landmarks(frame, face_landmarks):
        # Draw landmarks on the image for debugging
        for landmark in face_landmarks.landmark:
            x = int(landmark.x * frame.shape[1])  # scale to image width
            y = int(landmark.y * frame.shape[0])  # scale to image height
            cv2.circle(frame, (x, y), 1, (0, 255, 0), -1)  # Draw small circles for landmarks
        return frame      