import cv2
import numpy as np
import os
import json
from mtcnn.mtcnn import MTCNN

# Load the saved directions from the JSON file
with open('saved_landmarks.json', 'r') as json_file:
    scan_directions = json.load(json_file)

# Open Webcam
cap = cv2.VideoCapture(1)  # Change to 0 if using the default camera

# Load the saved images and prepare labels
image_folder = 'saved_images'  # Directory where images are saved
image_files = [f for f in os.listdir(image_folder) if f.endswith('.jpg')]
saved_faces = []
labels = {}

# Load the saved face images into a list and convert them to grayscale
for i, image_file in enumerate(image_files):
    img_path = os.path.join(image_folder, image_file)
    img = cv2.imread(img_path)
    if img is not None:
        saved_faces.append(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
        labels[i] = image_file.split('.')[0]  # Save just the name without extension

# Create LBPH Face Recognizer and train it with saved faces
recognizer = cv2.face.LBPHFaceRecognizer_create()
recognizer.train(saved_faces, np.array(list(labels.keys())))  # Train with saved faces

# Initialize MTCNN detector
detector = MTCNN()

# Set confidence threshold (adjust this value as needed)
threshold_confidence = 100  

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("Unable to access the camera")
        break

    # Flip the frame horizontally
    frame = cv2.flip(frame, 1)

    # Convert BGR to RGB for MTCNN
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Detect faces in the frame using MTCNN
    detected_faces = detector.detect_faces(rgb_frame)

    # Check if any faces are detected
    if detected_faces:
        for face in detected_faces:
            x, y, width, height = face['box']
            confidence = face['confidence']

            # Crop the detected face region for recognition 
            face_roi = rgb_frame[y:y + height, x:x + width]

            # Use the recognizer to predict the label of the detected face 
            gray_face_roi = cv2.cvtColor(face_roi, cv2.COLOR_RGB2GRAY)
            label_id, pred_confidence = recognizer.predict(gray_face_roi)

            # Check if confidence is below a certain threshold
            if pred_confidence < threshold_confidence:
                label_text = f"Match: {labels[label_id]} (Confidence: {pred_confidence:.2f})"
                color = (0, 255, 0)  # Green for a match 
            else:
                label_text = "No Match"
                color = (0, 0, 255)  # Red for no match 

            # Draw rectangle around the face and put label text 
            cv2.rectangle(frame, (x, y), (x + width, y + height), color, 2)
            cv2.putText(frame, label_text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
    else:
        # If no faces are detected
        cv2.putText(frame, "No Face Detected", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2)

    # Show the frame with detection results 
    cv2.imshow('Face Comparison', frame)

    # Press 'q' to exit the program 
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the camera and close all windows 
cap.release()
cv2.destroyAllWindows()