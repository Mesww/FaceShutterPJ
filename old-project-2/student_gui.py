from tkinter import Tk,ttk, messagebox, filedialog,END
from mongo_backend import AttendanceDB
from student_management import StudentManager
import csv

class StudentManagementGUI:
    def __init__(self):
        self.root = Tk()
        self.root.title("ระบบจัดการข้อมูลนักศึกษา")
        self.root.geometry("600x400")
        
        self.student_manager = StudentManager()
        
        # สร้าง Notebook สำหรับแท็บต่างๆ
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(expand=True, fill='both', padx=10, pady=5)
        
        # สร้างแท็บต่างๆ
        self.create_add_student_tab()
        self.create_import_csv_tab()
        self.create_view_students_tab()
        
    def create_add_student_tab(self):
        add_frame = ttk.Frame(self.notebook)
        self.notebook.add(add_frame, text='เพิ่มนักศึกษา')
        
        # สร้างฟอร์มกรอกข้อมูล
        ttk.Label(add_frame, text="รหัสนักศึกษา:").grid(row=0, column=0, padx=5, pady=5)
        self.student_id_entry = ttk.Entry(add_frame)
        self.student_id_entry.grid(row=0, column=1, padx=5, pady=5)
        
        ttk.Label(add_frame, text="ชื่อ:").grid(row=1, column=0, padx=5, pady=5)
        self.first_name_entry = ttk.Entry(add_frame)
        self.first_name_entry.grid(row=1, column=1, padx=5, pady=5)
        
        ttk.Label(add_frame, text="นามสกุล:").grid(row=2, column=0, padx=5, pady=5)
        self.last_name_entry = ttk.Entry(add_frame)
        self.last_name_entry.grid(row=2, column=1, padx=5, pady=5)
        
        ttk.Label(add_frame, text="คณะ:").grid(row=3, column=0, padx=5, pady=5)
        self.faculty_entry = ttk.Entry(add_frame)
        self.faculty_entry.grid(row=3, column=1, padx=5, pady=5)
        
        ttk.Label(add_frame, text="สาขา:").grid(row=4, column=0, padx=5, pady=5)
        self.major_entry = ttk.Entry(add_frame)
        self.major_entry.grid(row=4, column=1, padx=5, pady=5)
        
        # ปุ่มบันทึก
        ttk.Button(add_frame, text="บันทึก", command=self.add_student).grid(row=5, column=0, columnspan=2, pady=20)
        
    def create_import_csv_tab(self):
        import_frame = ttk.Frame(self.notebook)
        self.notebook.add(import_frame, text='นำเข้า CSV')
        
        ttk.Label(import_frame, text="เลือกไฟล์ CSV สำหรับนำเข้าข้อมูล").pack(pady=20)
        ttk.Button(import_frame, text="เลือกไฟล์", command=self.import_csv).pack(pady=10)
        
    def create_view_students_tab(self):
        view_frame = ttk.Frame(self.notebook)
        self.notebook.add(view_frame, text='รายชื่อนักศึกษา')
        
        # สร้างตารางแสดงข้อมูล
        columns = ('รหัสนักศึกษา', 'ชื่อ', 'นามสกุล', 'คณะ', 'สาขา')
        self.tree = ttk.Treeview(view_frame, columns=columns, show='headings')
        
        # กำหนดหัวข้อคอลัมน์
        for col in columns:
            self.tree.heading(col, text=col)
            self.tree.column(col, width=100)
        
        self.tree.pack(expand=True, fill='both', padx=10, pady=5)
        
        # ปุ่มรีเฟรชข้อมูล
        ttk.Button(view_frame, text="รีเฟรช", command=self.refresh_student_list).pack(pady=10)
        
        # โหลดข้อมูลครั้งแรก
        self.refresh_student_list()
        
    def add_student(self):
        # ตรวจสอบข้อมูลที่กรอก
        if not all([self.student_id_entry.get(), self.first_name_entry.get(),
                   self.last_name_entry.get(), self.faculty_entry.get(),
                   self.major_entry.get()]):
            messagebox.showerror("Error", "กรุณากรอกข้อมูลให้ครบทุกช่อง")
            return
            
        result = self.student_manager.add_single_student(
            student_id=self.student_id_entry.get(),
            first_name=self.first_name_entry.get(),
            last_name=self.last_name_entry.get(),
            faculty=self.faculty_entry.get(),
            major=self.major_entry.get()
        )
        
        if result['status'] in ['created', 'updated']:
            messagebox.showinfo("Success", "บันทึกข้อมูลสำเร็จ")
            # ล้างข้อมูลในฟอร์ม
            for entry in [self.student_id_entry, self.first_name_entry,
                         self.last_name_entry, self.faculty_entry,
                         self.major_entry]:
                entry.delete(0, END)
            # รีเฟรชรายการนักศึกษา
            self.refresh_student_list()
        else:
            messagebox.showerror("Error", f"เกิดข้อผิดพลาด: {result.get('message', 'Unknown error')}")
            
    def import_csv(self):
        filename = filedialog.askopenfilename(
            filetypes=[("CSV Files", "*.csv")],
            title="เลือกไฟล์ CSV"
        )
        if filename:
            result = self.student_manager.import_from_csv(filename)
            if 'error' in result:
                messagebox.showerror("Error", result['error'])
            else:
                messagebox.showinfo("Success", 
                    f"นำเข้าข้อมูลสำเร็จ\n"
                    f"สำเร็จ: {result['success_count']}\n"
                    f"ผิดพลาด: {result['error_count']}\n"
                    f"รวม: {result['total']}"
                )
                self.refresh_student_list()
                
    def refresh_student_list(self):
        # ล้างข้อมูลเก่า
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        # โหลดข้อมูลใหม่
        students = self.student_manager.list_all_students()
        for student in students:
            self.tree.insert('', END, values=(
                student['student_id'],
                student['first_name'],
                student['last_name'],
                student['faculty'],
                student['major']
            ))
            
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = StudentManagementGUI()
    app.run()