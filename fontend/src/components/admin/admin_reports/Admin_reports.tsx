import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, File, FileSpreadsheet } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import THSarabunNew from "/font/THSarabunNew.ttf";
import * as XLSX from 'xlsx';
import Sidebar from '../sidebar/Sidebar';
import Header from '../header/Header';
import { BACKEND_URL } from '@/configs/backend';
import { myUser } from '@/interfaces/admininterface';
import { useUserData } from '@/containers/provideruserdata';
import { getLogined } from '@/containers/userLogin';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

// Updated interface to match API response
interface AttendanceRecord {
  _id: { $oid: string };
  employee_id: string;
  date: string;
  check_in_time: string;
  check_out_time: string;
  status: string;
  // location: string | null;
  created_at: { $date: string };
  updated_at: { $date: string };
}

const AdminReports = () => {
  const [searchReportName, setSearchReportName] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const notificationCount = 3;
  const [user , setUser] = useState<myUser | null>(null);
  const {userData} = useUserData();
  
  // State for attendance records
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentDate = () => {
    const date = new Date();
    date.setHours(date.getHours() + 7); // Adjust to UTC+7 for Thailand
    return date.toISOString().split("T")[0];
  };

  const [startDate, setStartDate] = useState(getCurrentDate());
  const [endDate, setEndDate] = useState(getCurrentDate());
  const navigate = useNavigate();

  // Fetch attendance records
  useEffect(() => {
    const fetchAttendanceRecords = async () => {
      setLoading(true);
      setError(null);
      try {
          const token = getLogined();
              if(token === undefined){
                Swal.fire({
                  title: 'Unauthorized',
                  text: 'You are not authorized to access this page',
                  icon: 'error',
                  timer: 1500
                });
                navigate('/admin/login');
                return;
              }
        const response = await axios.get(
          `${BACKEND_URL}/api/history/get_all_history_records/${startDate}/${endDate}`,{
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        // แก้ไขการดึงข้อมูล
        const records = response.data.data || [];

        // console.log('API Response:', response.data);
        // console.log('Records count:', records.length);

        setAttendanceRecords(records);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        setError('Failed to fetch attendance records');
        // console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceRecords();
    setUser(userData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, userData]);

  // Filter records
  const filteredAttendanceRecords = Array.isArray(attendanceRecords)
    ? attendanceRecords.filter(
      (record) =>
      (searchReportName === "" ||
        record.employee_id.toLowerCase().includes(searchReportName.toLowerCase()))
    )
    : [];
  // console.log('Filtered Records:', filteredAttendanceRecords);

  // Determine combined status
  const getCombinedStatus = (record: AttendanceRecord): string => {
    if (record.status === 'Incomplete') {
      return 'Absent';
    }
    if (record.status === 'Outcomplete') {
      return 'Absent';
    }
    if (record.status === 'Complete') {
      return 'Present';
    }
    return 'Absent';
  };

  // Download Excel
  const downloadAttendanceExcel = () => {
    const excelData = filteredAttendanceRecords.map(record => ({
      'Date': formatDateForDisplay(record.date),
      'Employee ID': record.employee_id,
      'Check-in time': record.check_in_time,
      'Check-out time': record.check_out_time,
      'Status': getCombinedStatus(record),
      // 'สถานที่': record.location || '-'
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    const columnWidths = [
      { wch: 20 }, // วันที่
      { wch: 15 }, // รหัสพนักงาน
      { wch: 10 }, // เวลาเข้า
      { wch: 10 }, // เวลาออก
      { wch: 15 }, // สถานะ
      { wch: 15 }  // สถานที่
    ];
    ws['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(wb, ws, "Attendance report");

    const formattedStartDate = formatDateForDisplay(startDate);
    const formattedEndDate = formatDateForDisplay(endDate);
    XLSX.writeFile(wb, `Attendance report_${formattedStartDate}_to_${formattedEndDate}.xlsx`);
  };

  // Download PDF
  const downloadAttendancePDF = () => {
    const doc = new jsPDF();

    doc.addFont(THSarabunNew, "THSarabun", "normal");
    doc.setFont("THSarabun");

    const formattedStartDate = formatDateForDisplay(startDate);
    const formattedEndDate = formatDateForDisplay(endDate);

    doc.setFontSize(18);
    doc.text(`Attendance report`, 14, 15);
    doc.setFontSize(14);
    doc.text(`Date ${formattedStartDate} to ${formattedEndDate}`, 14, 22);

    const tableData = filteredAttendanceRecords.map((record) => [
      formatDateForDisplay(record.date),
      record.employee_id,
      record.check_in_time,
      record.check_out_time,
      getCombinedStatus(record),
      // record.location || '-'
    ]);

    autoTable(doc, {
      startY: 30,
      head: [["Date", "Employee ID", "Check-in time", "Check-out time", "Status"]],
      body: tableData,
      theme: "grid",
      styles: {
        font: "THSarabun",
        fontSize: 14,
        cellPadding: 4,
        overflow: 'linebreak',
        halign: 'center'
      },
      headStyles: {
        font: "THSarabun",
        fillColor: [31, 41, 55],
        fontSize: 14,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left' },   // วันที่
        1: { halign: 'left' },   // รหัสพนักงาน
        2: { halign: 'center' }, // เวลาเข้า
        3: { halign: 'center' }, // เวลาออก
        4: { halign: 'center' }, // สถานะ
        // 5: { halign: 'left' }    // สถานที่
      }
    });

    doc.save(`Attendance report_${formattedStartDate}_to_${formattedEndDate}.pdf`);
  };

  // Format date for display
  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Map paths to titles and descriptions
  const menuItems = [
    {
      path: "/admin/AdminManage",
      title: "User Management",
      description: "Add, delete, edit user information",
    },
    // {
    //   path: "/admin/AdminAccess",
    //   title: "สิทธิ์การเข้าถึง",
    //   description: "กำหนดสิทธิ์การเข้าถึงระบบ",
    // },
    {
      path: "/admin/AdminReports",
      title: "Reports",
      description: "View work entry and exit reports",
    },
    {
      path: "/admin/AdminSettings",
      title: "System Settings",
      description: "Configure general system settings",
    },
  ];

  const currentMenuItem = menuItems.find((item) => item.path === location.pathname);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">

      {/* Mobile Sidebar */}
      <div className={`md:hidden`}>
        <Sidebar
          isSidebarCollapsed={false}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
      </div>

      {/* Main Content */}
      <div className={`flex-1 w-full md:w-auto transition-all duration-300 
        ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-72'}`}>
        <Header currentMenuItem={currentMenuItem}
          notificationCount={notificationCount}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          employee_id={user?.employee_id}
  />

        <div className="w-full p-2 md:p-4 bg-white">
          {/* Filter Section */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start date
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
                  End date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  min={startDate}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search by employee ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by employee ID"
                    value={searchReportName}
                    onChange={(e) => setSearchReportName(e.target.value)}
                    className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-4 h-4 text-gray-500 absolute left-2 top-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Loading and Error Handling */}
          {loading && (
            <div className="text-center py-4 text-gray-600">
              Loading information...
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              {error}
            </div>
          )}

          {/* Table Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Employee ID</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Check-in time</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Check-out time</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Status</th>
                    {/* <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">สถานที่</th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAttendanceRecords.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-4 text-gray-600">
                        No data found for the selected time period.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendanceRecords.map((record, index) => (
                      <tr
                        key={record._id.$oid || `record-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 text-sm">{formatDateForDisplay(record.date)}</td>
                        <td className="px-4 py-3 text-sm">{record.employee_id}</td>
                        <td className="px-4 py-3 text-sm text-center">{record.check_in_time}</td>
                        <td className="px-4 py-3 text-sm text-center">{record.check_out_time}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          {getCombinedStatus(record)}
                        </td>
                        {/* <td className="px-4 py-3 text-sm text-center">{record.location || '-'}</td> */}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center justify-end space-x-4">
            <button
              onClick={downloadAttendanceExcel}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              <span>Download Excel</span>
            </button>
            <button
              onClick={downloadAttendancePDF}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <File className="w-4 h-4 mr-2" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;