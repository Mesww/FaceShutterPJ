from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from backend.models.user_model import Faceimage, Userupdate
from backend.services.user_service import UserService
from ..services.face_service import Face_service
import cv2
import numpy as np

router = APIRouter()


class Face_controller:
    @staticmethod
    @router.post("/save_landmarks")
    async def save_landmarks(
        ScanDirection: str = Form(...),
        frame: UploadFile = File(...),  # Correct usage of File
        name: str = Form(...),
        employee_id: str = Form(...),
    ):
        try:
            # Read the uploaded file and convert it to a NumPy array
            file_content = await frame.read()
            np_frame = cv2.imdecode(
                np.frombuffer(file_content, np.uint8), cv2.IMREAD_COLOR
            )

            # Call the Face_service to process the frame
            res = Face_service.save_landmarks(ScanDirection, np_frame, name)
            if res.status >= 400:
                raise HTTPException(status_code=400, detail=res.message)

            face_image = Faceimage(scan_direction=ScanDirection, image_path=res.data.get("image_path"))
            face_image = face_image.model_dump()
            face_image["scan_direction"] = ScanDirection

            update_user = Userupdate(faceimage=[face_image])
            update_res = await UserService.update_user_by_employee_id(
                employee_id, update_user
            )
            if update_res.status >= 400:
                raise HTTPException(status_code=400, detail=update_res.message)
            
            return update_res.to_json()
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))
