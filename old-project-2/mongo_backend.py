from pymongo import MongoClient, ASCENDING
from datetime import datetime
from pymongo.errors import DuplicateKeyError



class AttendanceDB:
    
    def __init__(self, connection_string="mongodb://root:1234@localhost:27017/"):
        # เชื่อมต่อกับ MongoDB
        self.client = MongoClient(connection_string)
        # สร้างฐานข้อมูล face_recognition_db
        self.db = self.client.face_recognition_db
        
        # สร้าง collections
        self.students = self.db.students
        self.attendance = self.db.attendance
        
        # สร้าง indexes
        self.students.create_index([("student_id", ASCENDING)], unique=True)

    def get_known_encodings(self):
        """ดึงข้อมูล face_encodings ของนักศึกษาทั้งหมดจากฐานข้อมูล"""
        encodings = []
        for student in self.students.find({}, {"face_encoding": 1, "_id": 0}):
            if "face_encoding" in student:
                encodings.append(student["face_encoding"])
        return encodings


    def add_student(self, student_id, first_name, last_name, faculty, major, force_update=False):
        """
        เพิ่มข้อมูลนักศึกษา
        force_update: ถ้าเป็น True จะอัพเดทข้อมูลถ้ามีรหัสนักศึกษาอยู่แล้ว
        """
        try:
            # ตรวจสอบว่ามีนักศึกษาอยู่แล้วหรือไม่
            existing_student = self.get_student(student_id)
            
            if existing_student:
                if force_update:
                    # อัพเดทข้อมูลถ้า force_update เป็น True
                    update_data = {
                        "first_name": first_name,
                        "last_name": last_name,
                        "faculty": faculty,
                        "major": major,
                        "updated_at": datetime.now()
                    }
                    result = self.update_student(student_id, update_data)
                    return {"status": "updated", "student_id": student_id}
                else:
                    return {"status": "exists", "student_id": student_id}
            
            # เพิ่มนักศึกษาใหม่
            student_data = {
                "student_id": student_id,
                "first_name": first_name,
                "last_name": last_name,
                "faculty": faculty,
                "major": major,
                "created_at": datetime.now(),
                "updated_at": datetime.now()
            }
            self.students.insert_one(student_data)
            return {"status": "created", "student_id": student_id}
            
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def record_attendance(self, student_id):
        """บันทึกการเข้าเรียน"""
        try:
            # ตรวจสอบว่ามีนักศึกษาในระบบหรือไม่
            student = self.get_student(student_id)
            if not student:
                return {"status": "error", "message": f"ไม่พบนักศึกษารหัส {student_id}"}

            now = datetime.now()
            attendance_data = {
                "student_id": student_id,
                "datetime": now,
                "year": now.year,
                "month": now.month,
                "day": now.day,
                "hour": now.hour,
                "minute": now.minute,
                "second": now.second,
                "status": "present"  # สถานะเริ่มต้น (present, late, absent, leave)
            }
            
            result = self.attendance.insert_one(attendance_data)
            return {"status": "success", "attendance_id": str(result.inserted_id)}
            
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def get_student(self, student_id):
        """ดึงข้อมูลนักศึกษา"""
        return self.students.find_one({"student_id": student_id})

    def get_student_attendance(self, student_id, start_date=None, end_date=None):
        """ดึงประวัติการเข้าเรียนของนักศึกษา"""
        query = {"student_id": student_id}
        if start_date and end_date:
            start_datetime = datetime.combine(start_date, datetime.min.time())
            end_datetime = datetime.combine(end_date, datetime.max.time())
            query["datetime"] = {
                "$gte": start_datetime,
                "$lte": end_datetime
            }
        return list(self.attendance.find(query).sort("datetime", -1))

    def get_all_students(self):
        """ดึงข้อมูลนักศึกษาทั้งหมด"""
        return list(self.students.find())

# ตัวอย่างการใช้งาน
if __name__ == "__main__":
    try:
        db = AttendanceDB()
        
        # ทดสอบเพิ่มนักศึกษา
        student_data = {
            "first_name": "สมชาย",
            "last_name": "ใจดี",
            "faculty": "วิศวกรรมศาสตร์",
            "major": "วิศวกรรมคอมพิวเตอร์"
        }
        
        # ทดลองเพิ่มนักศึกษาใหม่
        result = db.add_student("6404101002", **student_data)
        print("ผลการเพิ่มนักศึกษา:", result)
        
        # ทดลองบันทึกการเข้าเรียน
        attendance_result = db.record_attendance("6404101002")
        print("ผลการบันทึกการเข้าเรียน:", attendance_result)
        
        # แสดงรายชื่อนักศึกษาทั้งหมด
        print("\nรายชื่อนักศึกษาทั้งหมด:")
        all_students = db.get_all_students()
        for student in all_students:
            print(f"รหัส: {student['student_id']}, ชื่อ: {student['first_name']} {student['last_name']}")
            
    except Exception as e:
        print(f"เกิดข้อผิดพลาด: {str(e)}")

