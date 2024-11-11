import base64
import logging
import os
from typing import Optional, Tuple, Union
import cv2
import face_recognition
import numpy as np
import random
import string
import hashlib
import io
from fastapi import UploadFile
from PIL import Image

from backend.configs.config import SIMILARITY_THRESHOLD

class ImageCompairUtils:
    @staticmethod
    async def convert_uploadfile_to_cv2(upload_file: UploadFile) -> Union[np.ndarray, None]:
        """Convert FastAPI UploadFile to CV2 image format"""
        try:
            logging.info(f"Converting UploadFile to CV2: {upload_file.filename}")
            # Check if file is an image based on content type
            if not upload_file.content_type.startswith("image/"):
                print("File is not an image.")
                return None

            # Read the content of UploadFile
            contents = await upload_file.read()
            if not contents:
                print("Failed to read file contents.")
                return None

            # Convert to numpy array
            nparr = np.frombuffer(contents, np.uint8)
            print(f"Buffer converted to numpy array, shape: {nparr.shape}, dtype: {nparr.dtype}")

            # Decode image
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            # Check if the image was decoded correctly
            if img is None:
                print("Failed to decode image.")
                return None

            print(f"Image decoded successfully, shape: {img.shape}, dtype: {img.dtype}")

            # Reset file pointer for potential reuse
            await upload_file.seek(0)

            return img

        except Exception as e:
            print(f"Error in convert_uploadfile_to_cv2: {str(e)}")
            return None


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
    def random_name_image(imagename: str) -> str:
        """Generate random unique name for image"""
        random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
        file_extension = imagename.split('.')[-1]
        hash_object = hashlib.sha256(random_string.encode('utf-8'))
        hash_name = hash_object.hexdigest()
        return f"{hash_name}.{file_extension}"
    
    @staticmethod
    def find_Image(image_path: str) -> np.ndarray:
        """Load image from path"""
        print(image_path)
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Failed to load image from path: {image_path}")
        return image
    
    @staticmethod
    def delete_Image(image_path: str) -> bool:
        """Delete image from path"""
        try:
            os.remove(image_path)
            return True
        except Exception as e:
            print(f"Error deleting image: {str(e)}")
            return False
    
    @staticmethod
    async def upload_image(upload_file: UploadFile, image_path: str) -> bool:
        """Save UploadFile to disk"""
        try:
            # Convert UploadFile to CV2 format
            img = await ImageCompairUtils.convert_uploadfile_to_cv2(upload_file)
            
            # Save image
            result = cv2.imwrite(image_path, img)
            
            if not result:
                raise ValueError("Failed to save image")
                
            return True
        except Exception as e:
            print(f"Error saving image: {str(e)}")
            return False
    @staticmethod
    async def compare_images(image1: UploadFile, image2: UploadFile) -> Tuple[float,Optional[str]]:
        """
        Compare two facial images and return similarity percentage.
        Ensures each image contains exactly one face for security.
        
        Args:
            image1: First image (UploadFile or cv2 image)
            image2: Second image (UploadFile or cv2 image)
            
        Returns:
            float: Similarity percentage between the faces (0-100)
            
        Raises:
            ValueError: If images can't be loaded or face detection fails
        """
        try:
            # Convert images if needed
            img1 = await ImageCompairUtils.convert_uploadfile_to_cv2(image1) if isinstance(image1, UploadFile) else image1
            img2 = await ImageCompairUtils.convert_uploadfile_to_cv2(image2) if isinstance(image2, UploadFile) else image2
            
            if img1 is None or img2 is None:
                raise ValueError("Failed to load one or both images.")

            # Convert BGR to RGB
            image1_rgb = cv2.cvtColor(img1, cv2.COLOR_BGR2RGB)
            image2_rgb = cv2.cvtColor(img2, cv2.COLOR_BGR2RGB)
            
            # Detect faces
            face_locations_image_1 = face_recognition.face_locations(image1_rgb, model="hog")
            face_locations_image_2 = face_recognition.face_locations(image2_rgb, model="hog")

            # Check for exactly one face in each image
            if len(face_locations_image_1) == 0:
                raise ValueError("No face detected in the first image")
            if len(face_locations_image_1) > 1:
                raise ValueError("Multiple faces detected in the first image")
                
            if len(face_locations_image_2) == 0:
                raise ValueError("No face detected in the second image")
            if len(face_locations_image_2) > 1:
                raise ValueError("Multiple faces detected in the second image")

            # Get face encodings - we can safely use [0] now since we confirmed one face
            face_encoding_image_1 = face_recognition.face_encodings(image1_rgb, face_locations_image_1)[0]
            face_encoding_image_2 = face_recognition.face_encodings(image2_rgb, face_locations_image_2)[0]

            # Calculate similarity
            face_distance = face_recognition.face_distance([face_encoding_image_1], face_encoding_image_2)[0]
            similarity_percentage = (1 - face_distance) * 100

            return float(similarity_percentage),None  # Ensure we return a float
            
        except Exception as e:
            print(f"Error comparing images: {str(e)}")
            return 0.0,f"Error comparing images: {str(e)}"
    @staticmethod
    def validate_image(image: np.ndarray) -> bool:
        """Validate if image contains a detectable face"""
        try:
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            face_locations = face_recognition.face_locations(rgb_image, model="hog")
            return len(face_locations) > 0
        except Exception as e:
            print(f"Error validating image: {str(e)}")
            return False