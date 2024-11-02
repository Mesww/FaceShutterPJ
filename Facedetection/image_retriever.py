# ฟังก์ชันดึงภาพจากฐานข้อมูล
import mysql.connector
import numpy as np
import cv2
import face_recognition

def fetch_image_from_db(image_id):
    # เชื่อมต่อกับฐานข้อมูล
    connection = mysql.connector.connect(
        host='your_host',  # เปลี่ยนเป็น host ของคุณ
        user='your_user',  # เปลี่ยนเป็น user ของคุณ
        password='your_password',  # เปลี่ยนเป็น password ของคุณ
        database='your_database'  # เปลี่ยนเป็นชื่อฐานข้อมูลของคุณ
    )

    cursor = connection.cursor()
    
    # คำสั่ง SQL เพื่อดึงข้อมูลภาพตาม ID
    query = "SELECT image FROM images WHERE id = %s"
    cursor.execute(query, (image_id,))
    
    result = cursor.fetchone()

    if result:
        image_data = result[0]  # ดึงข้อมูลภาพที่เป็น BLOB
        
        # แปลง BLOB เป็น numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        
        # แปลง numpy array เป็นภาพ
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        return image
    else:
        print("No image found with the given ID.")
        return None
    
# ฟังก์ชันตรวจจับใบหน้า
def detect_faces(image):
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    face_locations = face_recognition.face_locations(rgb_image, model="hog")
    
    if len(face_locations) > 0:
        face_encodings = face_recognition.face_encodings(rgb_image, face_locations)
        
        for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
            matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
            name = "UNKNOWN"
            color = (0, 0, 255)  # สีแดงสำหรับไม่รู้จัก
            
            if True in matches:
                first_match_index = matches.index(True)
                name = known_face_names[first_match_index]
                color = (255, 102, 51)  # สีกรอบสำหรับการจับคู่
            
            # วาดกรอบรอบใบหน้าที่ตรวจพบ
            cv2.rectangle(image, (left, top), (right, bottom), color, 2)
            cv2.putText(image, name, (left + 6, top - 6), cv2.FONT_HERSHEY_DUPLEX, 0.6, (255, 255, 255), 1)

    return image

# การใช้งานฟังก์ชัน
# กำหนดค่าของ known_face_encodings และ known_face_names ที่นี่
known_face_encodings = [bank_face_encoding, tu_face_encoding]
known_face_names = ["BANK", "TU"]

# ตัวอย่างการใช้งานฟังก์ชัน
image_id = 1  # เปลี่ยนเป็น ID ของภาพที่ต้องการดึงจากฐานข้อมูล
image_from_db = fetch_image_from_db(image_id)

if image_from_db is not None:
    processed_image = detect_faces(image_from_db)
    
    # แสดงผลลัพธ์
    cv2.imshow("Detected Faces", processed_image)
    cv2.waitKey(0)
    cv2.destroyAllWindows()