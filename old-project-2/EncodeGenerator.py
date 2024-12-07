# EncodeGenerator.py
import cv2
import face_recognition
import pickle
import os

def generate_encodings(folder_path='Images'):
    """
    สร้างไฟล์ encoding จากรูปภาพในโฟลเดอร์ที่กำหนด
    """
    if not os.path.exists(folder_path):
        print(f"Error: ไม่พบโฟลเดอร์ {folder_path}")
        return False

    mode_path_list = os.listdir(folder_path)
    if not mode_path_list:
        print(f"Error: ไม่พบไฟล์รูปภาพใน {folder_path}")
        return False

    img_mode_list = []
    student_ids = []
    
    print("เริ่มการโหลดรูปภาพ...")
    for path in mode_path_list:
        if path.lower().endswith(('.png', '.jpg', '.jpeg')):
            img_path = os.path.join(folder_path, path)
            img = cv2.imread(img_path)
            if img is not None:
                img_mode_list.append(img)
                student_ids.append(os.path.splitext(path)[0])
                print(os.path.splitext(path)[0])
            else:
                print(f"Warning: ไม่สามารถโหลดไฟล์ {path}")

    if not img_mode_list:
        print("Error: ไม่สามารถโหลดรูปภาพได้")
        return False

    print(f"โหลดรูปภาพสำเร็จ {len(img_mode_list)} รูป")
    print("เริ่มการสร้าง Encoding...")

    encode_list = []
    for img in img_mode_list:
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        try:
            face_encodings = face_recognition.face_encodings(img)
            if face_encodings:
                encode = face_encodings[0]
                encode_list.append(encode)
            else:
                print(f"Warning: ไม่พบใบหน้าในรูปภาพ {student_ids[img_mode_list.index(img)]}")
        except Exception as e:
            print(f"Error encoding image: {str(e)}")

    if not encode_list:
        print("Error: ไม่สามารถสร้าง encoding ได้")
        return False

    print("Encoding เสร็จสมบูรณ์")
    
    # บันทึกไฟล์
    encode_list_known_with_ids = [encode_list, student_ids]
    try:
        with open("EncodeFile.p", 'wb') as file:
            pickle.dump(encode_list_known_with_ids, file)
        print("บันทึกไฟล์สำเร็จ")
        return True
    except Exception as e:
        print(f"Error saving file: {str(e)}")
        return False

if __name__ == "__main__":
    generate_encodings()