import cv2
import mediapipe as mp

# การตั้งค่า MediaPipe
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=0.5)

# เปิดการใช้งาน Webcam
cap = cv2.VideoCapture(0)

while cap.isOpened():
    success, frame = cap.read()
    if not success:
        print("ไม่สามารถเข้าถึงกล้องได้")
        break

    # พลิกภาพให้ไม่เป็น mirrored (ด้านซ้ายขวาถูกต้อง)
    frame = cv2.flip(frame, 1)

    # แปลง BGR เป็น RGB
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # ตรวจจับใบหน้า
    results = face_mesh.process(rgb_frame)

    # วาด Landmark บนใบหน้า
    if results.multi_face_landmarks:
        for face_landmarks in results.multi_face_landmarks:
            for idx, landmark in enumerate(face_landmarks.landmark):
                # แปลงพิกัดจาก normalized เป็นพิกัดพิกเซล
                x = int(landmark.x * frame.shape[1])
                y = int(landmark.y * frame.shape[0])

                # วาดจุด Landmark บนใบหน้า
                cv2.circle(frame, (x, y), 2, (0, 255, 0), -1)

    # แสดงผลลัพธ์
    cv2.imshow('3D Face Detection from Webcam', frame)

    # กด 'q' เพื่อออกจากโปรแกรม
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# ปิดกล้องและหน้าต่างทั้งหมด
cap.release()
cv2.destroyAllWindows()
