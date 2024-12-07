import cv2
import os
import pickle
import numpy as np
import face_recognition
import cvzone
from datetime import datetime
from mongo_backend import AttendanceDB


class AttendanceUI:
    def __init__(self):
        self.mode = "ACTIVE"
        self.student_info = None
        self.status_color = (255, 255, 255)
        self.current_student = None
        self.profile_size = (150, 150)

    def draw_profile_card(self, img, student_data, snapshot=None, 
                      card_start_x=808, card_start_y=160, 
                      card_width=414, card_height=500):
        if img is None:
            return

        try:
            # Card dimensions and position
            card_start_x = 808
            card_start_y = 160
            card_width = 414
            card_height = 500

            # Main card background (white)
            cv2.rectangle(img, 
                        (card_start_x, card_start_y), 
                        (card_start_x + card_width, card_start_y + card_height),
                        (255, 255, 255), 
                        cv2.FILLED)
        
            # Header (pink) - ปรับสีให้อ่อนลงเล็กน้อย
            header_height = 80
            cv2.rectangle(img,
                        (card_start_x, card_start_y),
                        (card_start_x + card_width, card_start_y + header_height),
                        (255, 192, 203),  # Lighter pink
                        cv2.FILLED)
        
            # Header text - ปรับขนาดและสไตล์
            cv2.putText(img, "Student Profile",
                    (card_start_x + 20, card_start_y + 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, (255, 255, 255), 2)

            # Profile circle - ปรับขนาดและสี
            center_x = card_start_x + (card_width // 2)
            circle_y = card_start_y + header_height + 100
            if snapshot is not None:
                try:
                    # Resize snapshot to fit in the profile area
                    snapshot_resized = cv2.resize(snapshot, (140, 140))
                
                    # Calculate position to place the snapshot
                    snapshot_x = center_x - 70
                    snapshot_y = circle_y - 70
                
                    # Place the snapshot
                    img[snapshot_y:snapshot_y+140, snapshot_x:snapshot_x+140] = snapshot_resized
                except Exception as e:
                    print(f"Error placing snapshot: {str(e)}")
                    # Fallback to drawing a circle if snapshot fails
                    cv2.circle(img, 
                            (center_x, circle_y), 
                            70,  # Size
                            (255, 192, 203),  # Color
                            cv2.FILLED)
            else:

                cv2.circle(img, 
                    (center_x, circle_y), 
                    70,  # เพิ่มขนาด
                    (255, 192, 203),  # ใช้สีเดียวกับ header
                    cv2.FILLED)

            # Student information
            if student_data and isinstance(student_data, dict):
                name = student_data.get('name', '')
                student_id = str(student_data.get('student_id', ''))
                major = student_data.get('major', '')
            else:
                name = ""
                student_id = ""
                major = ""

            # Text positions
            text_start_y = circle_y + 120
        
            # Name
            name_size = cv2.getTextSize(name, cv2.FONT_HERSHEY_DUPLEX, 1.2, 2)[0]
            name_x = center_x - (name_size[0] // 2)
            cv2.putText(img, name,
                    (name_x, text_start_y),
                    cv2.FONT_HERSHEY_DUPLEX, 1.2, (0, 0, 0), 2)

            
            # ID
            id_text = f"ID: {student_id}"
            id_size = cv2.getTextSize(id_text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 1)[0]
            id_x = center_x - (id_size[0] // 2)
            cv2.putText(img, id_text,
                    (id_x, text_start_y + 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (100, 100, 100), 1)

            # Major
            major_text = f"Major: {major}"
            major_size = cv2.getTextSize(major_text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 1)[0]
            major_x = center_x - (major_size[0] // 2)
            cv2.putText(img, major_text,
                    (major_x, text_start_y + 90),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (100, 100, 100), 1)

        except Exception as e:
            print(f"Error drawing profile card: {str(e)}")

def main():
    try:
        db = AttendanceDB()
    except Exception as e:
        print(f"Error connecting to database: {str(e)}")
        return

    ui = AttendanceUI()
    
    try:
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            raise Exception("Cannot open camera")
            
        cap.set(3, 640)
        cap.set(4, 480)

        imgBackground = cv2.imread('Resources/background.png')
        if imgBackground is None:
            raise Exception("Cannot load background image")

        # โหลดรูปโปรไฟล์ตัวอย่าง (ถ้ามี)
        default_profile = None
        profile_path = 'Resources/default_profile.png'
        if os.path.exists(profile_path):
            default_profile = cv2.imread(profile_path)
        
        with open('EncodeFile.p', 'rb') as file:
            encodeListKnownWithIds = pickle.load(file)
        encodeListKnown, studentIds = encodeListKnownWithIds
        print("Encode File Loaded Successfully")

        counter = 0
        previous_id = None
        attendance_recorded = False
        face_not_recognized_counter = 0
        unknown_face_threshold = 3

        while True:
            success, img = cap.read()
            if not success:
                print("Error: Cannot read from camera")
                break

            imgS = cv2.resize(img, (0, 0), None, 0.25, 0.25)
            imgS = cv2.cvtColor(imgS, cv2.COLOR_BGR2RGB)

            faceCurFrame = face_recognition.face_locations(imgS)
            encodeCurFrame = face_recognition.face_encodings(imgS, faceCurFrame)
            
            if imgBackground.shape[0] >= 162+480 and imgBackground.shape[1] >= 55+640:
                imgBackground[162:162+480, 55:55+640] = img

            if len(faceCurFrame) == 0:
                ui.current_student = None
                face_not_recognized_counter = 0
                previous_id = None
                attendance_recorded = False
                counter = 0
            else:
                any_face_recognized = False
                all_faces_unknown = True
                
                for encodeFace, faceLoc in zip(encodeCurFrame, faceCurFrame):
                    matches = face_recognition.compare_faces(encodeListKnown, encodeFace)
                    faceDis = face_recognition.face_distance(encodeListKnown, encodeFace)

                    y1, x2, y2, x1 = faceLoc
                    y1, x2, y2, x1 = y1 * 4, x2 * 4, y2 * 4, x1 * 4
                    bbox = 55 + x1, 162 + y1, x2 - x1, y2 - y1

                    if len(faceDis) > 0:
                        matchIndex = np.argmin(faceDis)
                        
                        if matches[matchIndex] and faceDis[matchIndex] < 0.5:
                            all_faces_unknown = False
                            any_face_recognized = True
                            current_id = studentIds[matchIndex]
                            imgBackground = cvzone.cornerRect(imgBackground, bbox, rt=0)

                            if current_id != previous_id:
                                counter = 0
                                attendance_recorded = False
                                previous_id = current_id
                                try:
                                    student_data = db.get_student(current_id)
                                    if student_data:
                                        ui.current_student = student_data
                                        ui.mode = "SCANNING"
                                    else:
                                        ui.mode = "ERROR"
                                        print(f"Student not found: {current_id}")
                                except Exception as e:
                                    print(f"Database error: {str(e)}")
                                    ui.mode = "ERROR"

                            if not attendance_recorded:
                                counter += 1
                                if counter >= 10:
                                    try:
                                        result = db.record_attendance(current_id)
                                        if result.get("status") == "success":
                                            ui.mode = "MARKED"
                                            attendance_recorded = True
                                        else:
                                            if "already marked" in result.get("message", "").lower():
                                                ui.mode = "ALREADY_MARKED"
                                            else:
                                                ui.mode = "ERROR"
                                    except Exception as e:
                                        print(f"Error recording attendance: {str(e)}")
                                        ui.mode = "ERROR"
                        else:
                            imgBackground = cvzone.cornerRect(imgBackground, bbox, colorR=(0, 0, 255), rt=0)
                
                if all_faces_unknown:
                    face_not_recognized_counter += 1
                    if face_not_recognized_counter >= unknown_face_threshold:
                        # Create a dictionary with default values for unknown face
                        unknown_data = {
                            'name': 'Unknown Student',
                            'student_id': 'Not Registered',
                            'major': 'Not Available'
                        }
                        ui.current_student = unknown_data
                        ui.mode = "UNKNOWN"
                else:
                    face_not_recognized_counter = 0
                    
                if not any_face_recognized and ui.mode != "UNKNOWN":
                    ui.current_student = None

            # แสดงการ์ดข้อมูลนักศึกษา
            if ui.current_student:
                ui.draw_profile_card(imgBackground, ui.current_student, img)

            cv2.imshow("Face Attendance", imgBackground)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break

    except Exception as e:
        print(f"Critical error: {str(e)}")
    finally:
        if 'cap' in locals():
            cap.release()
        cv2.destroyAllWindows()

if __name__ == "__main__":
    main()