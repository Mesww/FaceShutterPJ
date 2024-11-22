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
    def check_head_direction(face_landmarks, debug=False) -> str:
        # Get key landmark coordinates
        nose_x = face_landmarks.landmark[1].x  # NOSE_TIP
        nose_y = face_landmarks.landmark[1].y  # NOSE_TIP
        
        # Eye landmarks
        left_eye_x = face_landmarks.landmark[33].x
        right_eye_x = face_landmarks.landmark[263].x
        left_eye_y = face_landmarks.landmark[33].y
        right_eye_y = face_landmarks.landmark[263].y
        
        # Mouth landmarks
        left_mouth_x = face_landmarks.landmark[61].x
        right_mouth_x = face_landmarks.landmark[291].x
        left_mouth_y = face_landmarks.landmark[61].y
        right_mouth_y = face_landmarks.landmark[291].y

        # Calculate midpoints
        eye_midpoint_x = (left_eye_x + right_eye_x) / 2
        eye_midpoint_y = (left_eye_y + right_eye_y) / 2
        mouth_midpoint_x = (left_mouth_x + right_mouth_x) / 2
        mouth_midpoint_y = (left_mouth_y + right_mouth_y) / 2

        # More sensitive thresholds
        horizontal_threshold = 0.08  # Reduced from 0.15
        vertical_threshold = 0.08    # Reduced from 0.15

        # Horizontal (left/right) detection
        # Consider both nose and overall facial landmarks
        horizontal_nose_offset = nose_x - eye_midpoint_x
        horizontal_mouth_offset = mouth_midpoint_x - eye_midpoint_x

        # Vertical (up/down) detection
        # Compare nose position relative to eye and mouth midpoints
        vertical_nose_offset = nose_y - eye_midpoint_y
        vertical_mouth_offset = nose_y - mouth_midpoint_y

        # Detailed direction detection
        direction = "Front"
        
        # Horizontal detection with more nuanced approach
        if horizontal_nose_offset < -horizontal_threshold and horizontal_mouth_offset < -horizontal_threshold:
            direction = "Turn left"
        elif horizontal_nose_offset > horizontal_threshold and horizontal_mouth_offset > horizontal_threshold:
            direction = "Turn right"

        # Vertical detection with more precise measurement
        if vertical_nose_offset < -vertical_threshold and vertical_mouth_offset < -vertical_threshold:
            direction = "Look up"
        elif vertical_nose_offset > vertical_threshold and vertical_mouth_offset > vertical_threshold:
            direction = "Look down"

        # Debugging information
        if debug:
            print("Detailed Head Direction Analysis:")
            print(f"Nose Position: (x={nose_x:.3f}, y={nose_y:.3f})")
            print(f"Eye Midpoint: (x={eye_midpoint_x:.3f}, y={eye_midpoint_y:.3f})")
            print(f"Mouth Midpoint: (x={mouth_midpoint_x:.3f}, y={mouth_midpoint_y:.3f})")
            print(f"Horizontal Offsets - Nose: {horizontal_nose_offset:.3f}, Mouth: {horizontal_mouth_offset:.3f}")
            print(f"Vertical Offsets - Nose: {vertical_nose_offset:.3f}, Mouth: {vertical_mouth_offset:.3f}")
            print(f"Detected direction: {direction}")

        return direction
    @staticmethod
    def draw_landmarks(frame, face_landmarks):
        # Draw landmarks on the image for debugging
        for landmark in face_landmarks.landmark:
            x = int(landmark.x * frame.shape[1])  # scale to image width
            y = int(landmark.y * frame.shape[0])  # scale to image height
            cv2.circle(frame, (x, y), 1, (0, 255, 0), -1)  # Draw small circles for landmarks
        return frame      