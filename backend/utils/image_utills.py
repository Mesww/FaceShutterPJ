import base64
import datetime
import os
from pathlib import Path
import uuid
import cv2
import numpy as np


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
    def save_image(image: np.ndarray, filename: str) -> str:
        """Save image to file"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            base_dir = Path(__file__).resolve().parent.parent
            image_storage_path = os.path.join(base_dir, 'images')
            random_filename = (
                    f"{timestamp}_{uuid.uuid5(uuid.NAMESPACE_DNS,filename).hex}.jpg"
                )
            filepath = os.path.join(image_storage_path, random_filename)
            cv2.imwrite(filepath, image)
            return filepath
        except Exception as e:
            print(f"Error in save_image: {str(e)}")
            raise ValueError("Failed to save image to file")