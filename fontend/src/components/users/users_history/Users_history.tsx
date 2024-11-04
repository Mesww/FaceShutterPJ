import { useState } from 'react';

interface AttendanceRecord {
  id: number;
  date: string;
  checkIn: string;
  checkOut: string;
  checkInStatus: string;
  checkOutStatus: string;
  note: string;
}

const AttendanceHistoryPage = () => {
  // ฟังก์ชันสำหรับหาวันแรกของเดือนปัจจุบัน
  const getFirstDayOfCurrentMonth = () => {
    const date = new Date();
    date.setDate(1);
    return date.toISOString().split('T')[0];
  };

  // ฟังก์ชันสำหรับหาวันสุดท้ายของเดือนปัจจุบัน
  const getLastDayOfCurrentMonth = () => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    return date.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth());
  const [endDate, setEndDate] = useState(getLastDayOfCurrentMonth());

  // Mock data สำหรับประวัติการเข้างาน
  const attendanceData: AttendanceRecord[] = [
    {
      id: 1,
      date: '2024-10-01',
      checkIn: '8:30',
      checkOut: '17:30',
      checkInStatus: 'เข้าปกติ',
      checkOutStatus: 'ออกปกติ',
      note: '-'
    },
    {
      id: 2,
      date: '2024-10-15',
      checkIn: '8:15',
      checkOut: '-',
      checkInStatus: 'เข้าปกติ',
      checkOutStatus: 'ไม่ได้ลงเวลาออก',
      note: '-'
    },
    {
      id: 3,
      date: '2024-10-20',
      checkIn: '-',
      checkOut: '-',
      checkInStatus: '-',
      checkOutStatus: '-',
      note: 'วันหยุด'
    }
  ];

  // ฟังก์ชันสำหรับตรวจสอบและแสดงสถานะรวม
  const getCombinedStatus = (checkInStatus: string, checkOutStatus: string, note: string): string => {
    if (checkInStatus === '-' && checkOutStatus === '-' && note === 'วันหยุด') {
      return 'นอกเวลา';
    }
    if (checkInStatus === 'เข้าปกติ' && checkOutStatus === 'ออกปกติ') {
      return 'มาปกติ';
    }
    if (checkInStatus === 'เข้าปกติ' && checkOutStatus === 'ไม่ได้ลงเวลาออก') {
      return 'ขาดงาน';
    }
    return `${checkInStatus} - ${checkOutStatus}`;
  };

  // ฟังก์ชันสำหรับกรองข้อมูลตามช่วงวันที่
  const getFilteredData = (): AttendanceRecord[] => {
    if (!startDate && !endDate) {
      return attendanceData;
    }
  
    return attendanceData.filter(record => {
      // แปลง string เป็น Date object และ reset เวลาเป็น 00:00:00
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
  
      const filterStartDate = startDate ? new Date(startDate) : null;
      if (filterStartDate) {
        filterStartDate.setHours(0, 0, 0, 0);
      }
  
      const filterEndDate = endDate ? new Date(endDate) : null;
      if (filterEndDate) {
        filterEndDate.setHours(0, 0, 0, 0);
      }
  
      // ตรวจสอบว่าวันที่อยู่ในช่วงที่เลือกหรือไม่
      if (filterStartDate && filterEndDate) {
        return recordDate >= filterStartDate && recordDate <= filterEndDate;
      } else if (filterStartDate) {
        return recordDate >= filterStartDate;
      } else if (filterEndDate) {
        return recordDate <= filterEndDate;
      }
      
      return true;
    });
  };

  // ฟังก์ชันสำหรับแปลงรูปแบบวันที่
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // กรองข้อมูลตามช่วงวันที่
  const filteredData = getFilteredData();

  return (
    <div className="space-y-6">
      {/* ส่วนตัวกรองข้อมูล */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">ตัวกรองข้อมูล</h2>
          <p className="text-sm text-gray-600">เลือกช่วงวันที่ที่ต้องการดูข้อมูล</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันที่เริ่มต้น
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="w-full md:w-1/2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              วันที่สิ้นสุด
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* ตารางประวัติการเข้างาน */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">ลำดับที่</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">วันที่</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">เวลาเข้า</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">เวลาออก</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">สถานะเข้า - ออก</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">สถานะเข้า</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">สถานะออก</th>
                <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-center text-sm">{record.id}</td>
                  <td className="px-4 py-3 text-center text-sm">{formatDate(record.date)}</td>
                  <td className="px-4 py-3 text-center text-sm">{record.checkIn}</td>
                  <td className="px-4 py-3 text-center text-sm">{record.checkOut}</td>
                  <td className="px-4 py-3 text-center text-sm">
                    {getCombinedStatus(record.checkInStatus, record.checkOutStatus, record.note)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{record.checkInStatus}</td>
                  <td className="px-4 py-3 text-center text-sm">{record.checkOutStatus}</td>
                  <td className="px-4 py-3 text-center text-sm">{record.note}</td>
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
            <span className="text-sm text-gray-600">
              หน้า 1 จาก {Math.ceil(filteredData.length / 10)}
            </span>
          </div>
          <div className="text-sm text-gray-600 hidden md:block">
            แสดง 1-{Math.min(10, filteredData.length)} จาก {filteredData.length} รายการ
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceHistoryPage;