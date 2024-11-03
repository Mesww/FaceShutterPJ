const EditProfilePage = () => (
    <div className="w-full mx-auto">
      <div className="p-4 md:p-6 bg-white rounded-lg shadow">
        <div className="mb-6 md:mb-8">
          <h3 className="text-xl md:text-2xl font-semibold mb-2">แก้ไขข้อมูลส่วนตัว</h3>
          <p className="text-gray-600">อัพเดตข้อมูลส่วนตัวของคุณ</p>
        </div>
        
        <form className="space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อ-นามสกุล
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              defaultValue="Robert Jhonson"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              อีเมล
            </label>
            <input
              type="email"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              defaultValue="robert@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              defaultValue="0812345678"
            />
          </div>

          <button 
            type="submit"
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            บันทึกข้อมูล
          </button>
        </form>
      </div>
    </div>
  );

  export default EditProfilePage