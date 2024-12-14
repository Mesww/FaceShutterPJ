import asyncio
import base64
from datetime import datetime 
import os
from pathlib import Path
from typing import List
import uuid
import cv2
import numpy as np
from skimage.feature import local_binary_pattern
import mediapipe as mp

class Phone_Detection:
    def __init__(self):
        # ปรับค่า threshold ให้ยืดหยุ่นขึ้น
        self.IRIS_RATIO_MIN = 0.15  # ลดลงจาก 0.2
        self.IRIS_RATIO_MAX = 0.8   # เพิ่มขึ้นจาก 0.7
        self.IRIS_INTENSITY_THRESHOLD = 70  # เพิ่มขึ้นจาก 50

    def detect_screen_reflection(self, face_region: np.ndarray) -> bool:
        try:
            hsv = cv2.cvtColor(face_region, cv2.COLOR_BGR2HSV)
            gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
            
            _, v = cv2.threshold(hsv[:,:,2], 200, 255, cv2.THRESH_BINARY)
            reflection_ratio = np.sum(v) / v.size
            
            glare_threshold = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY)[1]
            glare_ratio = np.sum(glare_threshold) / glare_threshold.size
            
            local_std = cv2.Sobel(gray, cv2.CV_64F, 1, 1, ksize=3)
            smoothness = np.mean(np.abs(local_std))
            
            return (reflection_ratio > 0.15 or 
                   glare_ratio > 0.1 or 
                   smoothness < 10)

        except Exception as e:
            print(f"Error detecting screen reflection: {str(e)}")
            return False

    def analyze_texture_frequency(self, face_region: np.ndarray) -> bool:
        try:
            gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
            
            f_transform = np.fft.fft2(gray)
            magnitude_spectrum = np.abs(f_transform)
            
            high_freq = magnitude_spectrum > np.mean(magnitude_spectrum) * 1.5
            pattern_score = np.sum(high_freq) / high_freq.size
            
            return pattern_score > 0.3
            
        except Exception as e:
            print(f"Error in texture analysis: {str(e)}")
            return False

    def get_lbp(self, image, n_points, radius):
        lbp = np.zeros_like(image)
        for i in range(radius, image.shape[0] - radius):
            for j in range(radius, image.shape[1] - radius):
                center = image[i, j]
                binary = []
                for k in range(n_points):
                    angle = 2 * np.pi * k / n_points
                    x = i + radius * np.cos(angle)
                    y = j - radius * np.sin(angle)
                    x1 = int(np.floor(x))
                    y1 = int(np.floor(y))
                    binary.append(1 if image[x1, y1] >= center else 0)
                lbp[i, j] = int(''.join(map(str, binary)), 2)
        return lbp

    def detect_moire_pattern(self, gray_image: np.ndarray) -> float:
        frequencies = [0.1, 0.25, 0.4]
        orientations = [0, 45, 90, 135]
        pattern_responses = []
        
        for freq in frequencies:
            for theta in orientations:
                kernel = cv2.getGaborKernel(
                    (21, 21), sigma=4.0, theta=theta,
                    lambd=1.0/freq, gamma=0.5, psi=0
                )
                filtered = cv2.filter2D(gray_image, cv2.CV_64F, kernel)
                pattern_responses.append(np.std(filtered))
        
        return np.std(pattern_responses) / np.mean(pattern_responses)

    def detect_phone_shape(self,frame: np.ndarray) -> bool:
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray_frame, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = w / float(h)
            
            if 0.6 < aspect_ratio < 2.0 and w > 150 and h > 300:
                return True
        return False
    
    def detect_uniform_brightness(self,face_region: np.ndarray) -> bool:
        gray_region = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        std_dev = np.std(gray_region)
        return std_dev < 15

    def detect_iris(self, eye_region: np.ndarray) -> bool:
        try:
            # แปลงภาพเป็นโทนเทา
            gray_eye = cv2.cvtColor(eye_region, cv2.COLOR_BGR2GRAY)
            
            # ปรับความคมชัดให้มากขึ้น
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))  # เพิ่ม clipLimit จาก 2.0
            enhanced_eye = clahe.apply(gray_eye)
            
            # ปรับพารามิเตอร์ของ HoughCircles
            circles = cv2.HoughCircles(
                enhanced_eye,
                cv2.HOUGH_GRADIENT,
                dp=1.2,  # เพิ่มจาก 1
                minDist=10,  # ลดลงจาก 20
                param1=40,  # ลดลงจาก 50
                param2=25,  # ลดลงจาก 30
                minRadius=int(eye_region.shape[0] * 0.15),  # ลดลงจาก 0.2
                maxRadius=int(eye_region.shape[0] * 0.45)   # เพิ่มขึ้นจาก 0.4
            )
            
            if circles is not None:
                circles = np.uint16(np.around(circles))
                for i in circles[0, :]:
                    iris_radius = i[2]
                    eye_width = eye_region.shape[1]
                    iris_ratio = (iris_radius * 2) / eye_width
                    
                    # ตรวจสอบขนาดม่านตาด้วยค่า threshold ที่ปรับใหม่
                    if not (self.IRIS_RATIO_MIN <= iris_ratio <= self.IRIS_RATIO_MAX):
                        continue
                    
                    # สร้าง mask สำหรับตรวจสอบความเข้มของม่านตา
                    mask = np.zeros_like(gray_eye)
                    cv2.circle(mask, (i[0], i[1]), i[2], 255, -1)
                    iris_intensity = cv2.mean(gray_eye, mask=mask)[0]
                    
                    if iris_intensity > self.IRIS_INTENSITY_THRESHOLD:
                        continue
                    
                    return True
            return False
            
        except Exception as e:
            print(f"Error in iris detection: {str(e)}")
            return False

    def detect_phone_in_frame(self, frame: np.ndarray, face_region: np.ndarray) -> bool:
        try:
            # ตรับค่า confidence ให้ต่ำลง
            face_mesh = mp.solutions.face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=1,
                min_detection_confidence=0.3,  # ลดลงจาก 0.5
                min_tracking_confidence=0.3     # เพิ่มพารามิเตอร์นี้
            )
            
            results = face_mesh.process(cv2.cvtColor(face_region, cv2.COLOR_BGR2RGB))
            
            if not results.multi_face_landmarks:
                print("No face landmarks detected")
                return True
            
            landmarks = results.multi_face_landmarks[0]
            
            # เพิ่มขนาดพื้นที่การตรวจจับตา
            padding = 15  # เพิ่มจาก 10
            
            def extract_eye_region(indices):
                x_coords = [landmarks.landmark[idx].x for idx in indices]
                y_coords = [landmarks.landmark[idx].y for idx in indices]
                
                x_min = int(min(x_coords) * face_region.shape[1])
                x_max = int(max(x_coords) * face_region.shape[1])
                y_min = int(min(y_coords) * face_region.shape[0])
                y_max = int(max(y_coords) * face_region.shape[0])
                
                x_min = max(0, x_min - padding)
                x_max = min(face_region.shape[1], x_max + padding)
                y_min = max(0, y_min - padding)
                y_max = min(face_region.shape[0], y_max + padding)
                
                return face_region[y_min:y_max, x_min:x_max]
            
            left_eye_region = extract_eye_region([362, 385, 387, 263, 373, 380])
            right_eye_region = extract_eye_region([33, 160, 158, 133, 153, 144])
            
            # ตรวจสอบขนาดของภาพตาก่อนประมวลผล
            min_eye_size = 30
            if (left_eye_region.shape[0] < min_eye_size or 
                left_eye_region.shape[1] < min_eye_size or
                right_eye_region.shape[0] < min_eye_size or 
                right_eye_region.shape[1] < min_eye_size):
                print("Eye regions too small")
                return True
            
            left_iris_detected = self.detect_iris(left_eye_region)
            right_iris_detected = self.detect_iris(right_eye_region)
            
            # ต่านการตรวจสอบถ้าตรวจพบม่านตาอย่างน้อยหนึ่งข้าง
            if not (left_iris_detected or right_iris_detected):
                print("No iris detected")
                return True
                
            return False

        except Exception as e:
            print(f"Error in phone detection: {str(e)}")
            return False

    def check_pixel_patterns(self, gray_image: np.ndarray) -> bool:
        radius = 2
        n_points = 8 * radius
        lbp = local_binary_pattern(gray_image, n_points, radius, method='uniform')
        
        hist, _ = np.histogram(lbp.ravel(), bins=np.arange(0, n_points + 3), density=True)
        pattern_uniformity = np.sum(hist > 0.1)
        
        return pattern_uniformity < 4  # ปรับจาก 5 เป็น 4

    def check_color_continuity(self, image: np.ndarray) -> bool:
        block_size = 8
        h, w = image.shape[:2]
        n_blocks_h = h // block_size
        n_blocks_w = w // block_size
        
        color_variations = []
        for i in range(n_blocks_h):
            for j in range(n_blocks_w):
                block = image[i*block_size:(i+1)*block_size, 
                            j*block_size:(j+1)*block_size]
                color_variations.append(np.std(block))
        
        variation_std = np.std(color_variations)
        return variation_std < 8  # ปรับจาก 10 เป็น 8

    def detect_moire_pattern(self, gray_image: np.ndarray) -> float:
        """ตรวจจับ Moiré patterns ที่มักพบในภาพถ่ายหน้าจอ"""
        # ใช้ FFT เพื่อตรวจจับรูปแบบที่ซ้ำกัน
        f_transform = np.fft.fft2(gray_image)
        magnitude_spectrum = np.abs(np.fft.fftshift(f_transform))
        
        # หาความถี่ที่โดดเด่น
        threshold = np.mean(magnitude_spectrum) * 2
        high_freq_ratio = np.sum(magnitude_spectrum > threshold) / magnitude_spectrum.size
        
        return high_freq_ratio

class Image_utills:
    @staticmethod
    def convert_cv2_to_base64(image: np.ndarray) -> str:
        try:
            # Convert image to bytes
            is_success, buffer = cv2.imencode(".jpg", image)
            if not is_success:
                raise ValueError("Failed to encode image")
                
            # Convert bytes to base64 string
            base64_str = base64.b64encode(buffer).decode('utf-8')
            return base64_str
            
        except Exception as e:
            print(f"Error in convert_cv2_to_base64: {str(e)}")
            raise ValueError("Failed to convert image to base64")
    
    @staticmethod
    async def save_image(image: np.ndarray, filename: str) -> str:
        try:
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            base_dir = Path(__file__).resolve().parent.parent
            image_storage_path = os.path.join(base_dir, 'images')
            random_filename = (
                    f"{timestamp}_{uuid.uuid4().hex}.jpg"
                )
            filepath = os.path.join(image_storage_path, random_filename)
            print(f"Saving image to: {filepath}")
            
            # Save the image synchronously since cv2.imwrite is not async
            success = cv2.imwrite(filepath, image)
            
            if not success:
                raise ValueError("Failed to write image file")
                
            print(f"Successfully saved image to: {filepath}")
            return filepath
        except Exception as e:
            print(f"Error in save_image: {str(e)}")
            raise ValueError("Failed to save image to file")
    
    @staticmethod
    def read_image_from_path(image_path: str) -> np.ndarray:
        try:
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError("Failed to read image file")
            return image
        except Exception as e:
            print(f"Error in read_image_from_path: {str(e)}")
            raise ValueError("Failed to read image from file")
    @staticmethod
    def remove_image(image_path: str) -> None:
        try:
            os.remove(image_path)
            print(f"Successfully removed image: {image_path}")
        except Exception as e:
            print(f"Error in remove_image: {str(e)}")
            raise ValueError("Failed to remove image file")