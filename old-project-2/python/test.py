from flask import Flask, request, redirect, url_for, render_template, Response
from pymongo import MongoClient
import cv2
import os
import base64

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# เชื่อมต่อกับ MongoDB Atlas
client = MongoClient('your_mongodb_atlas_connection_uri')
db = client['graduation']
students_collection = db['students']

def capture_frame():
    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    cap.release()
    if ret:
        filename = os.path.join(UPLOAD_FOLDER, 'capture.jpg')
        cv2.imwrite(filename, frame)
        return filename
    else:
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['POST'])
def register():
    name = request.form['name']
    photo_path = capture_frame()
    if photo_path:
        with open(photo_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
        
        student_data = {
            "name": name,
            "photo": encoded_string
        }
        students_collection.insert_one(student_data)
        return redirect(url_for('data'))
    else:
        return "Failed to capture photo", 500

@app.route('/data')
def data():
    students = students_collection.find()
    return render_template('data.html', students=students)

if __name__ == '__main__':
    app.run(debug=True)
