import base64
import io
from PIL import Image
from flask import Flask, json, request, jsonify, render_template, redirect, url_for, make_response
import pymongo
import os
import face_recognition
import jwt
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash
import numpy as np
from datetime import datetime, timedelta

app = Flask(__name__)

# Connect to MongoDB
client = pymongo.MongoClient('mongodb://localhost:27017/')
db = client['user_database']
users_collection = db['users']

JWT_SECRET = 'mySuperSecretKey12345!'
UPLOAD_FOLDER = './static/uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# ฟังก์ชันช่วยในการสร้าง JWT
def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=2)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

# ฟังก์ชันช่วยในการตรวจสอบ JWT
def verify_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload['user_id']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Helper function to save user face data to MongoDB
def save_user_data(firstname, lastname, student_id, password, face_encodings, image_files):
     # เข้ารหัส face encodings ด้วย base64 ก่อนบันทึก
    encoded_face_data = [base64.b64encode(json.dumps(encoding).encode()).decode() for encoding in face_encodings]
    
    user_data = {
        "firstname": firstname,
        "lastname": lastname,
        "student_id": student_id,
        "password": password,  # Store the hashed password
        "face_encodings": face_encodings,
        "images": image_files
    }
    users_collection.insert_one(user_data)


# เส้นทางสำหรับการลงทะเบียนใบหน้า
@app.route('/register_face', methods=['GET', 'POST'])
def register_face():
    if request.method == 'POST':
        firstname = request.form['name']
        lastname = request.form['surname']
        student_id = request.form['student_id']

        # จัดการการอัปโหลดรูปภาพ
        images = {
            "front": request.files['imageFront'],
            "left": request.files.get('imageLeft'),
            "right": request.files.get('imageRight')
        }

        face_encodings = []
        image_files = []

        for view, file in images.items():
            if file:
                filename = secure_filename(f"{student_id}_{view}.jpg")
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)

                # ตรวจสอบประเภทของไฟล์ภาพ
                if not file.mimetype.startswith('image/'):
                    return jsonify({"message": f"The file for {view} is not a valid image."}), 400

                # ประมวลผลภาพและรับค่า face encoding
                image = face_recognition.load_image_file(file_path)
                encoding = face_recognition.face_encodings(image)

                if len(encoding) == 0:
                    return jsonify({"message": f"No face detected in the {view} image. Please upload a clear image."}), 400
                
                face_encodings.append(encoding[0].tolist())
                image_files.append(filename)

        # บันทึกข้อมูลลง MongoDB
        user_data = {
            "firstname": firstname,
            "lastname": lastname,
            "student_id": student_id,
            "face_encodings": face_encodings,
            "images": image_files
        }
        users_collection.insert_one(user_data)

        # เปลี่ยนเส้นทางไปยังหน้าเปรียบเทียบใบหน้า
        return redirect(url_for('compare_face'))
    else:
        return render_template('upload_face.html')

@app.route('/register', methods=['POST'])
def register_user():
    student_id = request.form['studentID']
    email = request.form['email']
    password = request.form['password']
    confirm_password = request.form['confirmPassword']

    if password != confirm_password:
        return jsonify({'message': 'Passwords do not match'}), 400

    # เข้ารหัสรหัสผ่านก่อนบันทึกลงในฐานข้อมูล
    hashed_password = generate_password_hash(password)

    # ตรวจสอบว่าผู้ใช้มีอยู่แล้วในฐานข้อมูลหรือไม่
    if users_collection.find_one({"student_id": student_id}):
        return jsonify({'message': 'User already exists'}), 400

    # บันทึกข้อมูลผู้ใช้ลงใน MongoDB
    user_data = {
        "student_id": student_id,
        "email": email,
        "password": hashed_password  # บันทึกเป็น hashed password
    }
    users_collection.insert_one(user_data)
    return redirect(url_for('login_page'))

# เส้นทางสำหรับการเข้าสู่ระบบ
@app.route('/auth/login', methods=['POST'])
def login():
    student_id = request.form['studentID']
    password = request.form['password']

    # ดึงข้อมูลผู้ใช้จากฐานข้อมูลตาม student_id
    user = users_collection.find_one({"student_id": student_id})

    # ตรวจสอบว่าผู้ใช้มีอยู่และรหัสผ่านถูกต้อง
    if user and check_password_hash(user['password'], password):  # ตรวจสอบรหัสผ่านที่ถูกเข้ารหัส
        token = generate_token(user['student_id'])
        response = make_response(redirect(url_for('home')))
        response.set_cookie('jwt_token', token)  # เก็บ JWT token ใน cookies
        return response
    else:
        return render_template('login.html', message='Invalid credentials'), 401



@app.route('/edit/<student_id>', methods=['POST'])
def edit_user(student_id):
    user = users_collection.find_one({"student_id": student_id})
    
    if not user:
        return jsonify({"message": "User not found"}), 404
    
    new_name = request.form['name']
    new_surname = request.form['surname']

    # Update user data
    update_data = {
        "firstname": new_name,
        "lastname": new_surname
    }
    
    if 'imageFront' in request.files:
        front_image = request.files['imageFront']
        filename = secure_filename(f"{student_id}_front.jpg")
        front_image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        
        # Update face encoding
        image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        image = face_recognition.load_image_file(image_path)
        encoding = face_recognition.face_encodings(image)
        
        if encoding:
            update_data["face_encodings"] = [encoding[0].tolist()]
            update_data["images"] = [filename]
    
    users_collection.update_one({"student_id": student_id}, {"$set": update_data})
    return redirect(url_for('home'))

# เส้นทางสำหรับการตรวจสอบใบหน้า
@app.route('/compare_face', methods=['GET', 'POST'])
def compare_face():
    if request.method == 'POST':
        if 'image' in request.files:
            # รับภาพที่ถูกส่งมาเป็น multipart/form-data
            image_data = request.files['image']
            # แปลงเป็นภาพและตรวจสอบใบหน้า
            image = face_recognition.load_image_file(image_data)
        elif 'image' in request.form:
            # รับข้อมูลภาพที่ส่งมาในรูปแบบ base64
            image_data = request.form.get('image')
            # แปลง base64 เป็นไฟล์ภาพ
            image_bytes = base64.b64decode(image_data.split(',')[1])
            image = Image.open(io.BytesIO(image_bytes))
            image = np.array(image)
        else:
            return jsonify({"message": "No image data provided."}), 400

        # ตรวจสอบใบหน้าในภาพที่รับมา
        face_encodings = face_recognition.face_encodings(image)

        if len(face_encodings) == 0:
            return jsonify({"message": "No face detected. Please try again."}), 400

        encoding_to_check = face_encodings[0]

        # เปรียบเทียบใบหน้ากับฐานข้อมูล
        users = users_collection.find()
        for user in users:
            for known_encoding in user['face_encodings']:
                matches = face_recognition.compare_faces([np.array(known_encoding)], encoding_to_check)
                if matches[0]:
                    return jsonify({'message': f"Face matched! Welcome {user['firstname']}!"}), 200

        return jsonify({'message': 'No matching face found.'}), 400
    else:
        # แสดงหน้า compare_face.html สำหรับคำขอ GET
        return render_template('compare_face.html')

# เส้นทางสำหรับ Logout
@app.route('/auth/logout', methods=['GET'])
def logout():
    response = make_response(redirect(url_for('login_page')))
    response.delete_cookie('jwt_token')  # ลบ JWT token ใน cookies
    return response

# เส้นทางสำหรับหน้า Home
@app.route('/home')
def home():
    token = request.cookies.get('jwt_token')
    if token:
        user_id = verify_token(token)
        if user_id:
            return render_template('home.html')
    return redirect(url_for('login_page'))

# เส้นทางสำหรับหน้า Login
@app.route('/login')
def login_page():
    return render_template('login.html')

# เส้นทางสำหรับหน้า Register
@app.route('/register', methods=['GET'])
def register_page():
    return render_template('register.html')

# Serve the header (if included dynamically)
@app.route('/header.html')
def header():
    return render_template('header.html')
# เส้นทางสำหรับหน้า gra-Inv
@app.route('/gra-Inv')
def gra_inv():
    return render_template('gra-Inv.html')

# เส้นทางสำหรับหน้า showInformation
@app.route('/showInformation')
def show_information():
    return render_template('showInformation.html')

# เส้นทางสำหรับหน้า Address
@app.route('/address', methods=['GET', 'POST'])
def address():
    if request.method == 'POST':
        # จัดการข้อมูลที่ได้รับจากฟอร์มที่อยู่
        # เช่น การบันทึกที่อยู่ลงในฐานข้อมูล
        return redirect(url_for('home'))
    return render_template('address.html')

if __name__ == '__main__':
    app.run(debug=True)


