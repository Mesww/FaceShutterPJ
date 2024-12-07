import cv2
import os
import json
import pymongo
from pymongo import MongoClient
from bson.binary import Binary
import gridfs

# เชื่อมต่อกับ MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['mongodbVSCodePlaygroundDB']
collection = db['attendees']
fs = gridfs.GridFS(db)

from pymongo import MongoClient

# เพิ่มข้อมูลเข้าสู่คอลเล็กชัน
data = {'name': 'John', 'age': 30}
collection.insert_one(data)


# ฟังก์ชันสำหรับการลงทะเบียนผู้เข้าร่วม
def register_attendee(name, frame):
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    if len(faces) > 0:
        (x, y, w, h) = faces[0]
        face_image = frame[y:y+h, x:x+w]
        
        # แปลงรูปภาพเป็นบิตไบนารี
        _, buffer = cv2.imencode('.jpg', face_image)
        face_image_binary = Binary(buffer.tobytes())
        
        # บันทึกข้อมูลผู้ใช้งานและรูปภาพใบหน้าใน MongoDB
        user_data = {
            'name': name,
            'face_image': fs.put(face_image_binary, filename=f"{name}.jpg")  # บันทึกใบหน้าใน GridFS
        }
        register_user(user_data)
        print(f"Registered {name} successfully!")
    else:
        print("No face detected.")

# ฟังก์ชันสำหรับการบันทึกข้อมูลผู้ใช้งาน
def register_user(user_data):
    collection.insert_one(user_data)

# เปิดกล้องสำหรับการลงทะเบียน
video_capture = cv2.VideoCapture(0)
name = input("Enter the name of the attendee: ")

while True:
    ret, frame = video_capture.read()
    if not ret:
        break

    # แสดงภาพจากกล้อง
    cv2.imshow('Video - Press "s" to save', frame)

    if cv2.waitKey(1) & 0xFF == ord('s'):
        register_attendee(name, frame)
        break

# ปิดการเชื่อมต่อกล้อง
video_capture.release()
cv2.destroyAllWindows()

# Debug: แสดงไดเรกทอรีทำงานปัจจุบัน
print("Current working directory:", os.getcwd())


