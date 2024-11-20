import cv2
import numpy as np
import os
import json
import time
import base64
from pymongo import MongoClient

# MongoDB setup
client = MongoClient("mongodb://root:1234@localhost:27017/")  # Adjust as needed
db = client["face_data"]
collection = db["scanned_images"]

# MediaPipe Setup
import mediapipe as mp
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.5)

# Scan status and directions for capturing data from different angles
scan_directions = ["Front", "Turn left", "Turn right", "Look up", "Look down"]
current_direction_idx = 0
scanned_images = []

# Delay time for saving data per frame
delay_time = 3  # Delay time in seconds
last_saved_time = time.time()

# Get user input for the person's name before opening the webcam
person_name = input("Enter the name of the person to save images: ")

# Open Webcam after getting the name
cap = cv2.VideoCapture(1)  # Change to 0 if using the default camera

# Helper function to crop the face from the frame
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

# Helper function to encode image as Base64
def encode_image_to_base64(image):
    _, buffer = cv2.imencode('.jpg', image)
    return base64.b64encode(buffer).decode('utf-8')

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("Unable to access the camera")
        break

    # Flip the frame horizontally
    frame = cv2.flip(frame, 1)

    # Convert BGR to RGB
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Process face detection
    results = face_mesh.process(rgb_frame)

    # Show instruction for the user to move their head to the specified direction
    instruction_text = f"Please move your head to: {scan_directions[current_direction_idx]}"
    cv2.putText(frame, instruction_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Draw face landmarks (if a face is detected)
    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            mp_drawing.draw_landmarks(frame, face_landmarks, mp_face_mesh.FACEMESH_TESSELATION,
                                      mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=1, circle_radius=1),
                                      mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=1, circle_radius=1))
            
            # Check delay time before saving data
            if time.time() - last_saved_time >= delay_time:
                # Save the cropped face image with metadata
                cropped_face = crop_face(frame, face_landmarks.landmark)

                # Encode image to Base64
                base64_image = encode_image_to_base64(cropped_face)

                # Save to MongoDB
                document = {
                    "person_name": person_name,
                    "scan_direction": scan_directions[current_direction_idx],
                    "image_data": base64_image
                }
                collection.insert_one(document)

                print(f"Saved {scan_directions[current_direction_idx]} image for {person_name} to MongoDB.")
                
                # Move to the next direction
                current_direction_idx += 1
                if current_direction_idx >= len(scan_directions):
                    print("Successfully saved images from all directions.")
                    cap.release()
                    cv2.destroyAllWindows()
                    exit()

                # Reset delay time
                last_saved_time = time.time()

    # Show the frame with landmarks 
    cv2.imshow('3D Face Detection - Save Images', frame)

    # Press 'q' to exit the program
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the camera and close all windows
cap.release()
cv2.destroyAllWindows()
