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