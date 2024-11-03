import { useState } from 'react';

const AttendanceHistoryPage = () => {
  const [selectedMonth, setSelectedMonth] = useState('10');
  const [selectedYear, setSelectedYear] = useState('2024');

  // Mock data สำหรับประวัติการเข้างาน
  const attendanceData = [
    {
      date: '2024-10-01',
      checkIn: '08:30',
      checkOut: '17:30',
      status: 'ปกติ'
    },
    {
      date: '2024-10-02',
      checkIn: '08:45',
      checkOut: '17:45',
      status: 'เข้างานสาย'
    },
    {
      date: '2024-10-03',
      checkIn: '08:15',
      checkOut: '17:30',
      status: 'ปกติ'
    },
    {
      date: '2024-10-04',
      checkIn: '08:50',
      checkOut: '17:30',
      status: 'เข้างานสาย'
    },
    {
      date: '2024-10-05',
      checkIn: '08:20',
      checkOut: '17:30',
      status: 'ปกติ'
    }
  ];

  return (
    <div className="space-y-6">
      {/* ส่วนตัวกรองข้อมูล */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">ตัวกรองข้อมูล</h2>
          <p className="text-sm text-gray-600">เลือกเดือนและปีที่ต้องการดูข้อมูล</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          {/* เลือกเดือน */}
          <div className="w-full md:w-1/2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="1">มกราคม</option>
              <option value="2">กุมภาพันธ์</option>
              <option value="3">มีนาคม</option>
              <option value="4">เมษายน</option>
              <option value="5">พฤษภาคม</option>
              <option value="6">มิถุนายน</option>
              <option value="7">กรกฎาคม</option>
              <option value="8">สิงหาคม</option>
              <option value="9">กันยายน</option>
              <option value="10">ตุลาคม</option>
              <option value="11">พฤศจิกายน</option>
              <option value="12">ธันวาคม</option>
            </select>
          </div>

          {/* เลือกปี */}
          <div className="w-full md:w-1/2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>
        </div>
      </div>

      {/* ตารางประวัติการเข้างาน */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6">
          <h2 className="text-lg font-semibold">ประวัติการเข้างาน</h2>
          <p className="text-sm text-gray-600">แสดงข้อมูลการเข้า-ออกงานทั้งหมด</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">วันที่</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">เวลาเข้า</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">เวลาออก</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendanceData.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm whitespace-nowrap">{record.date}</td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">{record.checkIn}</td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">{record.checkOut}</td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium
                      ${record.status === 'ปกติ' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
          <div className="flex items-center gap-2">
            <button className="p-1 rounded-md hover:bg-gray-200">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button className="p-1 rounded-md hover:bg-gray-200">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
            <span className="text-sm text-gray-600">หน้า 1 จาก 10</span>
          </div>
          <div className="text-sm text-gray-600 hidden md:block">
            แสดง 1-10 จาก 100 รายการ
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistoryPage;