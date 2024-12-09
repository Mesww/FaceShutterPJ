import asyncio
import base64
from datetime import datetime 
import os
from pathlib import Path
from typing import List
import uuid
import cv2
import numpy as np

class Phone_Detection:
    def detect_screen_reflection(self, face_region: np.ndarray) -> bool:
        """
        Detect potential screen reflections in the face region with improved thresholds
        and additional validation.
        """
        try:
            gray = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
            blurred = cv2.GaussianBlur(gray, (5, 5), 0)
            
            # Use a more conservative threshold
            thresholded = cv2.adaptiveThreshold(
                blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
                cv2.THRESH_BINARY, 11, 5  # Increased C parameter to reduce sensitivity
            )
            
            contours, _ = cv2.findContours(
                thresholded, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )
            
            total_reflection_area = 0
            for contour in contours:
                area = cv2.contourArea(contour)
                
                # Increased minimum area threshold
                if area < 100:  
                    continue
                
                x, y, w, h = cv2.boundingRect(contour)
                aspect_ratio = w / h
                
                # More stringent aspect ratio and area requirements
                if 1.6 < aspect_ratio < 2.2 and area > 1000:
                    # Additional validation: check brightness consistency
                    roi = gray[y:y+h, x:x+w]
                    brightness_std = np.std(roi)
                    if brightness_std < 30:  # Screen-like uniform brightness
                        return True
                
                total_reflection_area += area
                
            face_area = face_region.shape[0] * face_region.shape[1]
            reflection_ratio = total_reflection_area / face_area
            
            # More conservative reflection ratio threshold
            return reflection_ratio > 0.3

        except Exception as e:
            print(f"Error detecting screen reflection: {str(e)}")
            return False

    def analyze_texture_frequency(self, face_region: np.ndarray) -> bool:
        """
        Enhanced texture analysis with more robust feature extraction.
        """
        # Convert to grayscale if not already
        if len(face_region.shape) > 2:
            face_region = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
            
        scales = [1, 2, 4, 8]  # Added more scales
        orientations = [0, 45, 90, 135]
        texture_features = []
        
        # Calculate local binary patterns for additional texture information
        lbp = cv2.resize(face_region, (64, 64))  # Normalize size
        
        for scale in scales:
            for theta in orientations:
                kernel = cv2.getGaborKernel(
                    (21, 21), sigma=scale, theta=theta, 
                    lambd=10.0, gamma=0.5, psi=0, 
                    ktype=cv2.CV_32F
                )
                filtered = cv2.filter2D(face_region, cv2.CV_8UC3, kernel)
                # Calculate multiple statistical features
                texture_features.extend([
                    np.var(filtered),
                    np.mean(filtered),
                    np.std(filtered)
                ])
        
        # Combine texture metrics
        texture_variance = np.var(texture_features)
        return texture_variance > 0.25  # Increased threshold
    
    def detect_phone_shape(self,frame: np.ndarray) -> bool:
        """
        Detect rectangular shapes with phone-like aspect ratios.
        """
        gray_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray_frame, 50, 150)
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            aspect_ratio = w / float(h)
            
            # Check if aspect ratio matches a phone's typical screen
            if 0.6 < aspect_ratio < 2.0 and w > 150 and h > 300:  # Adjust size thresholds
                return True
        return False
    
    def detect_uniform_brightness(self,face_region: np.ndarray) -> bool:
        """
        Check for uniform brightness typical of phone screens.
        """
        gray_region = cv2.cvtColor(face_region, cv2.COLOR_BGR2GRAY)
        std_dev = np.std(gray_region)
        return std_dev < 15  # Adjust threshold for uniformity
    def detect_phone_in_frame(self, frame: np.ndarray, face_region: np.ndarray) -> bool:
        """
        Enhanced phone detection with weighted scoring system.
        """
        score = 0
        total_weights = 0
        
        # Screen reflection (highest weight)
        weight = 3
        if self.detect_screen_reflection(face_region):
            print("screen reflection")
            score += weight
        total_weights += weight
        
        # Texture analysis (medium weight)
        weight = 2
        if not self.analyze_texture_frequency(face_region):
            print("texture analysis")
            score += weight
        total_weights += weight
        
        # Phone shape detection (lower weight)
        weight = 1
        if self.detect_phone_shape(frame):
            print("phone shape")
            score += weight
        total_weights += weight
        
        # Uniform brightness (medium weight)
        weight = 2
        if self.detect_uniform_brightness(face_region):
            print("uniform brightness")
            score += weight
        total_weights += weight
        
        # Calculate final weighted score
        final_score = score / total_weights
        print(f"Phone detection score: {final_score}")
        return final_score > 0.4  # Require multiple strong indicators

class Image_utills:
    @staticmethod
    def convert_cv2_to_base64(image: np.ndarray) -> str:
        """Convert CV2 image to base64 string"""
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
        """Save image to file"""
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
        """Read image from file"""
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
        """Remove image file"""
        try:
            os.remove(image_path)
            print(f"Successfully removed image: {image_path}")
        except Exception as e:
            print(f"Error in remove_image: {str(e)}")
            raise ValueError("Failed to remove image file")