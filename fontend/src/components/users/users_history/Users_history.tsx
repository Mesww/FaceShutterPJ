import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import Sidebar from '../sidebar/Sidebar';
import Header from '../header/Header.js';
import { useUserData } from '@/containers/provideruserdata.js';
import axios from 'axios';
import {BACKEND_URL} from '@/configs/backend';
interface AttendanceRecord {
  _id: { $oid: string };
  employee_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  status: string;
  location: string | null;
  created_at: { $date: string };
  updated_at: { $date: string };
}

const AttendanceHistoryPage = () => {

  // ====== Provider Data ======
  const {
    isLogined,
    userData,
    logout,
    profileImage
  } = useUserData();

  // State for form fields and data fetching
  const [name, setName] = useState(userData?.name || '');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getFirstDayOfCurrentMonth = () => {
    const date = new Date();
    date.setHours(date.getHours() + 7); // เพิ่ม 7 ชั่วโมงให้เป็นเวลาของไทย
    date.setDate(1);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const getLastDayOfCurrentMonth = () => {
    const date = new Date();
    date.setHours(date.getHours() + 7); // เพิ่ม 7 ชั่วโมงให้เป็นเวลาของไทย
    date.setMonth(date.getMonth() + 1);
    date.setDate(0);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth());
  const [endDate, setEndDate] = useState(getLastDayOfCurrentMonth());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);


  const getCombinedStatus = (record: AttendanceRecord): string => {
    if (record.status === 'Incomplete') {
      return 'ขาดงาน';
    }
    if (record.status === 'Outcomplete') {
      return 'ขาดงาน';
    }
    if (record.status === 'Complete') {
      return 'มาปกติ';
    }
    return 'ขาดงาน';
  };

  const getFilteredData = (): AttendanceRecord[] => {
    if (!startDate && !endDate) {
      return attendanceData;
    }

    return attendanceData.filter(record => {
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredData = getFilteredData();
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Map paths to titles and descriptions
  const menuItems = [
    {
      path: "/UsersFacescan",
      title: "สแกนใบหน้า",
      description: "บันทึกเวลาด้วยการสแกนใบหน้า",
    },
    {
      path: "/UsersEditprofile",
      title: "แก้ไขข้อมูลส่วนตัว",
      description: "อัพเดตข้อมูลส่วนตัว เช่น ชื่อ อีเมล",
    },
    {
      path: "/UsersHistory",
      title: "ประวัติการเข้างาน",
      description: "ตรวจสอบประวัติการเข้า-ออกงาน",
    },
    {
      path: "/UsersNotification",
      title: "การแจ้งเตือน",
      description: "รับการแจ้งเตือนเมื่อมีการเปลี่ยนแปลง",
    },
  ];

  const currentMenuItem = menuItems.find((item) => item.path === location.pathname);


  // Fetch records when component mounts or dates change
  useEffect(() => {
    fetchAttendanceRecords();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, userData?.employee_id]);
  const fetchAttendanceRecords = async () => {
    if (!userData?.employee_id) return;

    setLoading(true);
    setError(null);

    try { 
      const response = await axios.get(`${BACKEND_URL}/api/history/get_history_records`, {
        params: {
          employee_id: userData.employee_id,
          start_date: startDate,
          end_date: endDate
        }
      });

      // Extract the array from response.data
      const records = response.data.data || response.data;

      console.log('Fetched records:', records);

      // Ensure you're setting an array
      setAttendanceData(Array.isArray(records) ? records : []);

      console.log('Attendance records:', attendanceData);

    } catch (err) {
      setError('Failed to fetch attendance records');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    setName(userData?.name || '');
  }, [userData?.name]);


  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">

      {/* Mobile Sidebar */}
      <div className={`md:hidden`}>
        <Sidebar
          isLogined={isLogined}
          isSidebarCollapsed={false}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          logout={logout}
          setName={setName}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          isLogined={isLogined}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          logout={logout}
          setName={setName}
        />
      </div>

      {/* Main Content */}
      <div className={`flex-1 w-full md:w-auto transition-all duration-300 
        ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-72'}`}>
        <Header profileimage={profileImage} currentMenuItem={currentMenuItem} name={name} />

        <div className="w-full p-2 md:p-4 bg-white">
          {/* Filter Section */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold">ตัวกรองข้อมูล</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่เริ่มต้น
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>


          {/* Loading and Error States */}
          {loading && (
            <div className="text-center py-4 text-gray-600">
              กำลังโหลดข้อมูล...
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              {error}
            </div>
          )}

          {/* Mobile Card View */}
          {!loading && !error && (
            <>
              <div className="md:hidden space-y-4">
                {paginatedData.map((record, index) => (
                  <div key={index + 1} className="bg-white rounded-lg shadow p-4">
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-lg font-medium">{formatDate(record.date)}</div>
                      <div className="text-sm text-gray-500">{index + 1}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="text-sm text-gray-600">เวลาเข้า:</div>
                        <div className="text-sm font-medium">{record.check_in_time || '-'}</div>
                        <div className="text-sm text-gray-600">เวลาออก:</div>
                        <div className="text-sm font-medium">{record.check_out_time || '-'}</div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="text-sm text-gray-600 mb-1">สถานะ:</div>
                        <div className="text-sm font-medium">
                          {getCombinedStatus(record)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ลำดับที่</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">วันที่</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">เวลาเข้า</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">เวลาออก</th>
                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">สถานะ</th>
                        {/* <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">หมายเหตุ</th> */}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {paginatedData.map((record, index) => (
                        <tr key={index + 1} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm">{index + 1}</td>
                          <td className="px-4 py-3 text-sm">{formatDate(record.date)}</td>
                          <td className="px-4 py-3 text-sm text-center">{record.check_in_time || '-'}</td>
                          <td className="px-4 py-3 text-sm text-center">{record.check_out_time || '-'}</td>
                          <td className="px-4 py-3 text-sm text-center">
                            {getCombinedStatus(record)}
                          </td>
                          {/* <td className="px-4 py-3 text-sm text-center">Note</td> */}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded-md hover:bg-gray-100 disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <span className="text-sm text-gray-600">
                    หน้า {currentPage} จาก {totalPages}
                  </span>
                </div>
                <div className="text-sm text-gray-600 hidden sm:block">
                  แสดง {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredData.length)} จาก {filteredData.length} รายการ
                </div>
              </div>




            </>
          )}


        </div>
      </div>
    </div>
  );
};

export default AttendanceHistoryPage;