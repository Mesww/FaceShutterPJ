# app.py
from flask import Flask, render_template, Response, jsonify, request
import cv2
import numpy as np
import face_recognition
import pickle
import os
from datetime import datetime

app = Flask(__name__)

# Global variables
known_face_encodings = []
known_face_names = []

def load_known_faces():
    global known_face_encodings, known_face_names
    if os.path.exists('face_database.pkl'):
        with open('face_database.pkl', 'rb') as f:
            data = pickle.load(f)
            known_face_encodings = data['encodings']
            known_face_names = data['names']

def save_known_faces():
    with open('face_database.pkl', 'wb') as f:
        pickle.dump({
            'encodings': known_face_encodings,
            'names': known_face_names
        }, f)

@app.route('/')
@app.route('/Admin/html/scan.html')
def index():
    return render_template('scan.html')

@app.route('/scan_face', methods=['POST'])
def scan_face():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'})

    # Read image from request
    file = request.files['image']
    image_bytes = file.read()
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Convert BGR to RGB
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Find faces in the frame
    face_locations = face_recognition.face_locations(rgb_frame)
    if not face_locations:
        return jsonify({'error': 'No face detected'})

    # Get face encodings
    face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)

    # Check if face matches any known faces
    for face_encoding in face_encodings:
        matches = face_recognition.compare_faces(known_face_encodings, face_encoding)
        if True in matches:
            match_index = matches.index(True)
            student_id = known_face_names[match_index]
            
            # Mock student data - replace with database query in production
            student_info = {
                'id': student_id,
                'name': f'Student {student_id}',
                'faculty': 'Engineering',
                'major': 'Computer Engineering'
            }
            return jsonify({'success': True, 'student': student_info})

    return jsonify({'success': False, 'message': 'Face not found in database'})

@app.route('/add_face', methods=['POST'])
def add_face():
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'})
    
    student_id = request.form.get('student_id')
    if not student_id:
        return jsonify({'error': 'Student ID is required'})

    # Read image from request
    file = request.files['image']
    image_bytes = file.read()
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Convert BGR to RGB
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

    # Find faces in the frame
    face_locations = face_recognition.face_locations(rgb_frame)
    if not face_locations:
        return jsonify({'error': 'No face detected'})

    # Get face encodings
    face_encodings = face_recognition.face_encodings(rgb_frame, face_locations)
    if not face_encodings:
        return jsonify({'error': 'Failed to encode face'})

    # Add to known faces
    known_face_encodings.append(face_encodings[0])
    known_face_names.append(student_id)
    
    # Save to database
    save_known_faces()

    return jsonify({'success': True, 'message': 'Face added successfully'})

@app.before_first_request
def before_first_request():
    load_known_faces()

if __name__ == '__main__':
    app.run(debug=True)