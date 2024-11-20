import base64
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