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

class Phone_Detection:
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

    def detect_phone_in_frame(self, frame: np.ndarray, face_region: np.ndarray) -> bool:
        try:
            # ลดขนาดภาพลงเพื่อเพิ่มความเร็ว
            scale_factor = 0.5
            small_face = cv2.resize(face_region, None, fx=scale_factor, fy=scale_factor)
            
            # 1. ตรวจสอบการสะท้อนแสงและความสว่าง
            hsv = cv2.cvtColor(small_face, cv2.COLOR_BGR2HSV)
            gray = cv2.cvtColor(small_face, cv2.COLOR_BGR2GRAY)
            
            # ตรับค่า threshold ของความสว่าง
            brightness_std = np.std(hsv[:,:,2])
            if brightness_std < 15:  # ปรับจาก 20 เป็น 15
                return True
            
            # 2. ตรวจสอบขอบภาพ
            edges = cv2.Canny(gray, 100, 200)
            edge_density = np.sum(edges > 0) / edges.size
            if edge_density > 0.15:  # ปรับจาก 0.1 เป็น 0.15
                return True
                
            # 3. ตรวจสอบรูปแบบพิกเซล
            pixel_pattern = self.check_pixel_patterns(gray)
            if pixel_pattern:
                return True
                
            # 4. ตรวจสอบความต่อเนื่องของสี
            color_continuity = self.check_color_continuity(small_face)
            if color_continuity:
                return True
                
            # 5. ตรวจสอบ Moiré patterns
            if self.detect_moire_pattern(gray) > 0.4:  # ปรับจาก 0.3 เป็น 0.4
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