import face_recognition
import numpy as np
import cv2

# โหลดภาพ reference สำหรับการรู้จำ
bank_image = face_recognition.load_image_file("/Users/pumpkin/Documents/FaceRecognitionProject/FaceShutterPJ/Facedetection/bank.jpg")
bank_face_encoding = face_recognition.face_encodings(bank_image)[0]

tu_image = face_recognition.load_image_file("/Users/pumpkin/Documents/FaceRecognitionProject/FaceShutterPJ/Facedetection/Tu.jpg")
tu_face_encoding = face_recognition.face_encodings(tu_image)[0]

# สร้างลิสต์สำหรับการเข้ารหัสใบหน้าและชื่อ
known_face_encodings = [bank_face_encoding, tu_face_encoding]
known_face_names = ["BANK", "TU"]

# โหลดภาพที่ต้องการตรวจจับใบหน้า
image_path = "/Users/pumpkin/Documents/FaceRecognitionProject/FaceShutterPJ/Facedetection/Tu.jpg"  # เปลี่ยนเป็นชื่อไฟล์ของคุณ
comparison_image_path = "/Users/pumpkin/Documents/FaceRecognitionProject/FaceShutterPJ/Facedetection/Tu.jpg"  # เปลี่ยนเป็นชื่อไฟล์ของภาพที่ต้องการเปรียบเทียบ

# โหลดภาพ
frame = cv2.imread(image_path)
comparison_frame = cv2.imread(comparison_image_path)

# ตรวจสอบว่าภาพถูกโหลดสำเร็จหรือไม่
if frame is None or comparison_frame is None:
    print("Failed to load one or both images.")
else:
    # เปลี่ยน BGR เป็น RGB 
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    rgb_comparison_frame = cv2.cvtColor(comparison_frame, cv2.COLOR_BGR2RGB)

    # ค้นหาตำแหน่งใบหน้าในเฟรม 
    face_locations = face_recognition.face_locations(rgb_frame, model="hog")
    comparison_face_locations = face_recognition.face_locations(rgb_comparison_frame, model="hog")

    # ตรวจสอบว่ามีใบหน้าถูกตรวจพบในภาพหลักหรือไม่
    if len(face_locations) > 0 and len(comparison_face_locations) > 0:
        # คำนวณการเข้ารหัสใบหน้าสำหรับแต่ละภาพ
        face_encoding = face_recognition.face_encodings(rgb_frame, face_locations)[0]
        comparison_face_encoding = face_recognition.face_encodings(rgb_comparison_frame, comparison_face_locations)[0]

        # คำนวณระยะห่างระหว่างการเข้ารหัสใบหน้า
        face_distance = face_recognition.face_distance([face_encoding], comparison_face_encoding)[0]

        # แปลงระยะห่างเป็นเปอร์เซ็นต์ความเหมือนกัน
        similarity_percentage = (1 - face_distance) * 100

        # กำหนดเกณฑ์ความคล้ายคลึงกัน (เช่น 60%)
        threshold = 60.0

        if similarity_percentage >= threshold:
            # เปรียบเทียบกับชื่อที่รู้จัก
            name_index = np.argmin(face_recognition.face_distance(known_face_encodings, face_encoding))
            name = known_face_names[name_index]
            color = (255, 102, 51)  # สีกรอบสำหรับการจับคู่
        else:
            name = "UNKNOWN"
            color = (0, 0, 255)  # สีแดงสำหรับไม่รู้จัก

        # วาดกรอบรอบใบหน้าที่ตรวจพบในภาพหลัก
        for (top, right, bottom, left) in face_locations:
            cv2.rectangle(frame, (left, top), (right, bottom), color, 2)
            cv2.putText(frame, f"{name} ({similarity_percentage:.2f}%)", 
                        (left + 6, top - 6), 
                        cv2.FONT_HERSHEY_DUPLEX, 
                        0.6, (255, 255, 255), 1)

        # วาดกรอบรอบใบหน้าที่ตรวจพบในภาพเปรียบเทียบ
        for (top, right, bottom, left) in comparison_face_locations:
            cv2.rectangle(comparison_frame, (left, top), (right, bottom), color, 2)

        # แสดงผลลัพธ์
        cv2.imshow("Detected Faces in Image", frame)
        cv2.imshow("Comparison Image", comparison_frame)
        cv2.waitKey(0)  # รอจนกว่าจะกดปุ่มใด ๆ เพื่อปิดหน้าต่าง
    else:
        print("No faces found in one or both images.")

# ปิดหน้าต่างทั้งหมดเมื่อเสร็จสิ้น
cv2.destroyAllWindows()