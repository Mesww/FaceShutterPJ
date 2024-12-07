# from flask import Flask, request, jsonify
# import base64
# import cv2
# import numpy as np
# from main import AttendanceUI
# from mongo_backend import AttendanceDB

# app = Flask(__name__)
# attendance_ui = AttendanceUI()
# db = AttendanceDB()

# @app.route('/api/scan-face', methods=['POST'])
# def scan_face():
#     try:
#         # Get the image data from the request
#         data = request.json
#         image_data = data['image'].split(',')[1]
#         image_bytes = base64.b64decode(image_data)
        
#         # Convert to OpenCV format
#         nparr = np.frombuffer(image_bytes, np.uint8)
#         img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
#         # Use the existing face recognition logic from main.py
#         # Return the results
#         result = process_image(img)  # Implement this using main.py logic
        
#         return jsonify(result)
#     except Exception as e:
#         return jsonify({'error': str(e)}), 500
# def process_image(img):
#     """
#     Process an image for face recognition and return the recognition results.
    
#     Args:
#         img: OpenCV image in BGR format
        
#     Returns:
#         dict: Recognition results containing student info if found
#     """
#     try:
#         import face_recognition
#         import pickle
#         import numpy as np
#         from mongo_backend import AttendanceDB
        
#         # Initialize database connection
#         db = AttendanceDB()
        
#         # Load known encodings
#         with open('EncodeFile.p', 'rb') as file:
#             encodeListKnownWithIds = pickle.load(file)
#         encodeListKnown, studentIds = encodeListKnownWithIds
        
#         # Convert image to RGB (face_recognition expects RGB)
#         imgRGB = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
#         # Detect and encode faces in the image
#         faceCurFrame = face_recognition.face_locations(imgRGB)
#         encodeCurFrame = face_recognition.face_encodings(imgRGB, faceCurFrame)
        
#         # If no faces found
#         if not faceCurFrame:
#             return {
#                 'status': 'error',
#                 'message': 'No face detected in the image'
#             }
            
#         # Process each face found in the image
#         results = []
#         for encodeFace, faceLoc in zip(encodeCurFrame, faceCurFrame):
#             # Compare with known faces
#             matches = face_recognition.compare_faces(encodeListKnown, encodeFace)
#             faceDis = face_recognition.face_distance(encodeListKnown, encodeFace)
            
#             # Get the best match
#             if len(faceDis) > 0:
#                 matchIndex = np.argmin(faceDis)
                
#                 if matches[matchIndex] and faceDis[matchIndex] < 0.5:
#                     # Get student ID and info
#                     student_id = studentIds[matchIndex]
#                     student_data = db.get_student(student_id)
                    
#                     if student_data:
#                         # Record attendance
#                         attendance_result = db.record_attendance(student_id)
                        
#                         # Extract face location coordinates
#                         top, right, bottom, left = faceLoc
                        
#                         # Add to results
#                         results.append({
#                             'status': 'success',
#                             'student_id': student_id,
#                             'student_data': {
#                                 'name': f"{student_data.get('first_name', '')} {student_data.get('last_name', '')}",
#                                 'major': student_data.get('major', ''),
#                                 'faculty': student_data.get('faculty', '')
#                             },
#                             'attendance_status': attendance_result.get('status'),
#                             'face_location': {
#                                 'top': top,
#                                 'right': right,
#                                 'bottom': bottom,
#                                 'left': left
#                             },
#                             'confidence': float(1 - faceDis[matchIndex])
#                         })
#                     else:
#                         results.append({
#                             'status': 'error',
#                             'message': f'Student data not found for ID: {student_id}'
#                         })
#                 else:
#                     # Unknown face
#                     top, right, bottom, left = faceLoc
#                     results.append({
#                         'status': 'unknown',
#                         'message': 'Face not recognized in database',
#                         'face_location': {
#                             'top': top,
#                             'right': right,
#                             'bottom': bottom,
#                             'left': left
#                         },
#                         'confidence': float(1 - min(faceDis)) if len(faceDis) > 0 else 0
#                     })
        
#         # Return final results
#         return {
#             'status': 'success',
#             'face_count': len(faceCurFrame),
#             'results': results
#         }
        
#     except Exception as e:
#         return {
#             'status': 'error',
#             'message': f'Error processing image: {str(e)}'
#         }

# if __name__ == '__main__':
#     app.run(debug=True)