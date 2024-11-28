import cv2
import os
import time
import mediapipe as mp

# MediaPipe Setup
mp_face_mesh = mp.solutions.face_mesh
mp_drawing = mp.solutions.drawing_utils
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.5)

# Scan status and directions for capturing data from specific angles
scan_directions = ["Front", "Turn left", "Turn right"]
current_direction_idx = 0
scanned_images = []
images_per_direction = 20  # Number of images per direction
image_count = 0  # Counter for images saved in the current direction

# Delay time for saving data per frame
delay_time = 0.25  # Delay time in seconds
last_saved_time = time.time()

# Get user input for the person's name before opening the webcam
person_name = input("Enter the name of the person to save images: ")

# Create directory to save images if it doesn't exist
if not os.path.exists('saved_images'):
    os.makedirs('saved_images')

# Open Webcam after getting the name
cap = cv2.VideoCapture(0)  # Change to 0 if using the default camera

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

def check_head_direction(face_landmarks):
    # Get coordinates of specific landmarks
    nose_x = face_landmarks.landmark[1].x  # Nose tip (index 1)
    threshold_x = 0.03  # Horizontal threshold for detecting left/right

    # Determine the head direction
    if nose_x < 0.5 - threshold_x:
        return "left"
    elif nose_x > 0.5 + threshold_x:
        return "right"
    return "center"

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
    instruction_text = f"Please move your head to: {scan_directions[current_direction_idx]} ({image_count}/{images_per_direction})"
    cv2.putText(frame, instruction_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)

    # Draw face landmarks (if a face is detected)
    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            mp_drawing.draw_landmarks(frame, face_landmarks, mp_face_mesh.FACEMESH_TESSELATION,
                                      mp_drawing.DrawingSpec(color=(0, 255, 0), thickness=1, circle_radius=1),
                                      mp_drawing.DrawingSpec(color=(0, 0, 255), thickness=1, circle_radius=1))

            head_direction = check_head_direction(face_landmarks)
            expected_direction = scan_directions[current_direction_idx]

            # Validate head direction
            if (expected_direction == "Front" and head_direction != "center") or \
               (expected_direction == "Turn left" and head_direction != "left") or \
               (expected_direction == "Turn right" and head_direction != "right"):
                warning_text = "Incorrect direction! Please turn correctly."
                cv2.putText(frame, warning_text, (10, 100), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 0, 255), 3)
                continue  # Skip saving if direction is incorrect

            # Save image after the delay
            if time.time() - last_saved_time >= delay_time:
                cropped_face = crop_face(frame, face_landmarks.landmark)
                filename = f"saved_images/{person_name.replace(' ', '_')}_{scan_directions[current_direction_idx].replace(' ', '_').lower()}_{image_count + 1}.jpg"
                cv2.imwrite(filename, cropped_face)
                scanned_images.append(cropped_face)
                print(f"Saved: {filename}")

                image_count += 1  # Increment the counter
                last_saved_time = time.time()

                # If 20 images are saved for the current direction, move to the next
                if image_count >= images_per_direction:
                    image_count = 0  # Reset the counter for the next direction
                    current_direction_idx += 1
                    if current_direction_idx >= len(scan_directions):
                        print("Successfully saved 20 images for all directions!")
                        cap.release()
                        cv2.destroyAllWindows()
                        exit()

    # Show the frame with landmarks
    cv2.imshow('3D Face Detection - Save Images', frame)

    # Press 'q' to exit the program
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release the camera and close all windows
cap.release()
cv2.destroyAllWindows()