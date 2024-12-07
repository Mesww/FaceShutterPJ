import cv2
import pymongo
import base64
from datetime import datetime

# เชื่อมต่อกับ MongoDB ด้วย URI ที่กำหนด
uri = "mongodb+srv://6431501057:Code0963614833@cluster0.rrbt7jr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
client = pymongo.MongoClient(uri)
db = client["Project"]               # เชื่อมต่อกับฐานข้อมูล test
collection = db["students"]       # เชื่อมต่อกับคอลเล็กชัน students

# เริ่มต้นการจับภาพจากกล้อง
cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    # แสดงผลหน้าต่างกล้อง
    cv2.imshow("Face Scanner", frame)

    # เมื่อกด 'c' จะทำการแคปภาพ
    if cv2.waitKey(1) & 0xFF == ord('c'):
        # แปลงภาพเป็น base64
        _, buffer = cv2.imencode('.jpg', frame)
        img_base64 = base64.b64encode(buffer).decode('utf-8')

        # เก็บข้อมูลลง MongoDB
        data = {
            "timestamp": datetime.now(),
            "image_base64": img_base64
        }
        collection.insert_one(data)
        print("Captured and saved to MongoDB in the students collection.")

    # กด 'q' เพื่อออกจากโปรแกรม
    elif cv2.waitKey(1) & 0xFF == ord('q'):
        break

# ปิดกล้องและหน้าต่าง
cap.release()
cv2.destroyAllWindows()
