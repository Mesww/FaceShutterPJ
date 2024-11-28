import cv2
import numpy as np
import os
import json
import mediapipe as mp
import math

def calculate_eye_aspect_ratio(eye_landmarks):
    """Calculate the Eye Aspect Ratio to detect blinking"""
    # Vertical eye landmarks
    A = math.dist(eye_landmarks[1], eye_landmarks[5])
    B = math.dist(eye_landmarks[2], eye_landmarks[4])
    # Horizontal eye landmark
    C = math.dist(eye_landmarks[0], eye_landmarks[3])
    
    # Eye Aspect Ratio
    ear = (A + B) / (2.0 * C)
    return ear

def is_face_moving(prev_landmarks, curr_landmarks, threshold=0.02):
    """Check if face is moving between frames"""
    if prev_landmarks is None:
        return False
    
    # Calculate total movement of landmark points
    total_movement = sum([
        math.dist((lm1.x, lm1.y), (lm2.x, lm2.y)) 
        for lm1, lm2 in zip(prev_landmarks.landmark, curr_landmarks.landmark)
    ])
    
    return total_movement > threshold


cap = cv2.VideoCapture(0)  # Change to 0 if using the default camera

# Load the saved images and prepare labels
image_folder = 'saved_images'
image_files = [f for f in os.listdir(image_folder) if f.endswith('.jpg')]
saved_faces = []
labels = {}

for i, image_file in enumerate(image_files):
    img_path = os.path.join(image_folder, image_file)
    img = cv2.imread(img_path)
    if img is not None:
        saved_faces.append(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
        labels[i] = image_file.split('.')[0]

recognizer = cv2.face.LBPHFaceRecognizer_create()
recognizer.train(saved_faces, np.array(list(labels.keys())))

mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.5)

# Liveness detection variables
prev_landmarks = None
blink_counter = 0
liveness_checks = []

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("Unable to access the camera")
        break

    frame = cv2.flip(frame, 1)
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = face_mesh.process(rgb_frame)

    cv2.putText(frame, "Please face the camera", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            # Liveness Detection Logic
            is_live = False
            
            # Eye Blink Detection
            left_eye = [face_landmarks.landmark[i] for i in [362, 385, 387, 263, 373, 380]]
            right_eye = [face_landmarks.landmark[i] for i in [33, 160, 158, 133, 153, 144]]
            
            left_ear = calculate_eye_aspect_ratio([(lm.x, lm.y) for lm in left_eye])
            right_ear = calculate_eye_aspect_ratio([(lm.x, lm.y) for lm in right_eye])
            
            eye_aspect_ratio = (left_ear + right_ear) / 2.0
            
            # Face Movement Detection
            face_movement = is_face_moving(prev_landmarks, face_landmarks) if prev_landmarks is not None else False
            
            # Liveness Criteria
            if eye_aspect_ratio < 0.2:  # Blink detection
                blink_counter += 1
            
            if blink_counter >= 2 and face_movement:
                is_live = True
            
            # Store current landmarks for next frame comparison
            prev_landmarks = face_landmarks

            # Rest of the original face recognition code...
            h, w, _ = frame.shape
            bounding_box = [
                int(min([lm.x * w for lm in face_landmarks.landmark])),
                int(min([lm.y * h for lm in face_landmarks.landmark])),
                int(max([lm.x * w for lm in face_landmarks.landmark])),
                int(max([lm.y * h for lm in face_landmarks.landmark]))
            ]
            cropped_face = frame[bounding_box[1]:bounding_box[3], bounding_box[0]:bounding_box[2]]

            if cropped_face.size > 0:
                gray_cropped_face = cv2.cvtColor(cropped_face, cv2.COLOR_BGR2GRAY)
                label_id, pred_confidence = recognizer.predict(gray_cropped_face)

                # Modify recognition logic to include liveness check
                if is_live and pred_confidence < 80:
                    label_text = f"Hi : {labels[label_id]} (Confidence: {pred_confidence:.2f})"
                    color = (0, 255, 0)  # Green for live match
                else:
                    label_text = "You are Fake!!!!" 
                    color = (0, 0, 255)  # Red for no live match

                cv2.rectangle(frame, (bounding_box[0], bounding_box[1]), (bounding_box[2], bounding_box[3]), color, 2)
                cv2.putText(frame, label_text, (bounding_box[0], bounding_box[1] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
            else:
                print("Cropped face is empty.")

    cv2.imshow('Face Comparison', frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()