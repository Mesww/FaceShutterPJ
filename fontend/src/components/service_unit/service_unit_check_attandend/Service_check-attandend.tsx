import React, { useState } from 'react';

interface AttendanceRecord {
  id: number;
  imageUrl: string;
  name: string;
  email: string;
  phone: string;
  checkIn: string;
  checkOut: string;
  status: 'not_checked_in' | 'checked_in' | 'checked_out';
}

const AttendanceTable: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([
    {
      id: 1,
      imageUrl: "https://via.placeholder.com/150",
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "081-234-5678",
      checkIn: "",
      checkOut: "",
      status: "not_checked_in",
    },
    {
      id: 2,
      imageUrl: "https://via.placeholder.com/150",
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "089-876-5432",
      checkIn: "",
      checkOut: "",
      status: "not_checked_in",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleCheckIn = (id: number) => {
    setAttendanceData(
      attendanceData.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "checked_in",
              checkIn: getCurrentTime(),
            }
          : item
      )
    );
  };

  const handleCheckOut = (id: number) => {
    setAttendanceData(
      attendanceData.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "checked_out",
              checkOut: getCurrentTime(),
            }
          : item
      )
    );
  };

  const filteredData = attendanceData.filter((record) =>
    record.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'not_checked_in':
        return 'text-blue-600';
      case 'checked_in':
        return 'text-green-600';
      case 'checked_out':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusText = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'not_checked_in':
        return 'ยังไม่เข้างาน';
      case 'checked_in':
        return 'เข้างาน';
      case 'checked_out':
        return 'ออกงาน';
    }
  };

  return (
    <div className="w-full p-4 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">ระบบบันทึกเวลาทำงาน</h2>
        <div className="flex items-center justify-between">
          <div className="w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาจากชื่อ..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="text-sm font-medium">{getCurrentDate()}</div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs uppercase bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3">รูปภาพ</th>
              <th scope="col" className="px-6 py-3">ชื่อ-นามสกุล</th>
              <th scope="col" className="px-6 py-3">อีเมล</th>
              <th scope="col" className="px-6 py-3">เบอร์โทรศัพท์</th>
              <th scope="col" className="px-6 py-3">เวลาเข้างาน</th>
              <th scope="col" className="px-6 py-3">เวลาออกงาน</th>
              <th scope="col" className="px-6 py-3">สถานะ</th>
              <th scope="col" className="px-6 py-3">การดำเนินการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((record) => (
              <tr key={record.id} className="bg-white border-b">
                <td className="px-6 py-4">
                  <img
                    src={record.imageUrl}
                    alt={record.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                </td>
                <td className="px-6 py-4 font-medium">{record.name}</td>
                <td className="px-6 py-4">{record.email}</td>
                <td className="px-6 py-4">{record.phone}</td>
                <td className="px-6 py-4">{record.checkIn}</td>
                <td className="px-6 py-4">{record.checkOut}</td>
                <td className="px-6 py-4">
                  <span className={getStatusColor(record.status)}>
                    {getStatusText(record.status)}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex justify-center gap-2">
                    {record.status === "not_checked_in" && (
                      <button
                        onClick={() => handleCheckIn(record.id)}
                        className="px-4 py-2 text-white bg-green-600 rounded hover:bg-green-700 transition-colors"
                      >
                        เข้างาน
                      </button>
                    )}
                    {record.status === "checked_in" && (
                      <button
                        onClick={() => handleCheckOut(record.id)}
                        className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                      >
                        ออกงาน
                      </button>
                    )}
                    {record.status === "checked_out" && (
                      <span className="text-gray-500 font-medium">เสร็จสิ้น</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceTable;