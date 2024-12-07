# student_management.py
from mongo_backend import AttendanceDB
import os
import csv

class StudentManager:
    def __init__(self):
        self.db = AttendanceDB()
    
    def add_single_student(self, student_id, first_name, last_name, faculty, major):
        """เพิ่มข้อมูลนักศึกษารายคน"""
        result = self.db.add_student(
            student_id=student_id,
            first_name=first_name,
            last_name=last_name,
            faculty=faculty,
            major=major
        )
        return result

    def import_from_csv(self, csv_file):
        """นำเข้าข้อมูลนักศึกษาจากไฟล์ CSV"""
        try:
            with open(csv_file, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                success_count = 0
                error_count = 0
                for row in reader:
                    try:
                        result = self.add_single_student(
                            student_id=row['student_id'],
                            first_name=row['first_name'],
                            last_name=row['last_name'],
                            faculty=row['faculty'],
                            major=row['major']
                        )
                        if result['status'] in ['created', 'updated']:
                            success_count += 1
                        else:
                            error_count += 1
                            print(f"Error adding student {row['student_id']}: {result}")
                    except Exception as e:
                        error_count += 1
                        print(f"Error processing row: {str(e)}")
                
                return {
                    'success_count': success_count,
                    'error_count': error_count,
                    'total': success_count + error_count
                }
        except Exception as e:
            return {'error': f"Failed to import CSV: {str(e)}"}

    def verify_students_in_images(self, images_folder='Images'):
        """ตรวจสอบว่านักศึกษาที่มีรูปภาพมีข้อมูลในฐานข้อมูลหรือไม่"""
        if not os.path.exists(images_folder):
            return {'error': f"ไม่พบโฟลเดอร์ {images_folder}"}
        
        results = {
            'found': [],
            'not_found': [],
            'invalid_files': []
        }
        
        for filename in os.listdir(images_folder):
            if filename.lower().endswith(('.png', '.jpg', '.jpeg')):
                student_id = os.path.splitext(filename)[0]
                if student_id.isalnum():  # ตรวจสอบว่าเป็นรหัสนักศึกษาที่ถูกต้อง
                    student = self.db.get_student(student_id)
                    if student:
                        results['found'].append(student_id)
                    else:
                        results['not_found'].append(student_id)
                else:
                    results['invalid_files'].append(filename)
        
        return results

    def list_all_students(self):
        """แสดงรายชื่อนักศึกษาทั้งหมดในฐานข้อมูล"""
        students = self.db.get_all_students()
        return students

if __name__ == "__main__":
    manager = StudentManager()
    
    # # ตัวอย่างการเพิ่มนักศึกษารายคน
    # print("\nเพิ่มข้อมูลนักศึกษาตัวอย่าง:")
    # result = manager.add_single_student(
    #     student_id="6431501050",
    #     first_name="สมชาย",
    #     last_name="ใจดี",
    #     faculty="วิศวกรรมศาสตร์",
    #     major="วิศวกรรมคอมพิวเตอร์"
    # )
    # print(f"ผลการเพิ่มนักศึกษา: {result}")
    
    # ตรวจสอบนักศึกษาที่มีรูปภาพ
    print("\nตรวจสอบนักศึกษาที่มีรูปภาพ:")
    verification = manager.verify_students_in_images()
    print("พบข้อมูลในฐานข้อมูล:", verification['found'])
    print("ไม่พบข้อมูลในฐานข้อมูล:", verification['not_found'])
    if verification['invalid_files']:
        print("ไฟล์ที่ไม่ถูกต้อง:", verification['invalid_files'])
    
    # แสดงรายชื่อนักศึกษาทั้งหมด
    print("\nรายชื่อนักศึกษาทั้งหมดในฐานข้อมูล:")
    students = manager.list_all_students()
    for student in students:
        print(f"รหัส: {student['student_id']}, "
              f"ชื่อ: {student['first_name']} {student['last_name']}, "
              f"คณะ: {student['faculty']}, "
              f"สาขา: {student['major']}")
