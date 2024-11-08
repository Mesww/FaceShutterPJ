import { useState } from 'react';
import { Search, File, FileSpreadsheet } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import THSarabunNew from "/font/THSarabunNew.ttf";
import * as XLSX from 'xlsx';
import Sidebar from '../sidebar/Sidebar';
import Header from '../header/Header';

interface AttendanceRecord {
  id: number;
  name: string;
  date: string;
  checkIn: string;
  checkOut: string;
  checkInStatus: string;
  checkOutStatus: string;
  note: string;
}

const AdminReports= () => {
  const [searchReportName, setSearchReportName] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const notificationCount = 3;
  const [attendanceRecords] = useState<AttendanceRecord[]>([
    {
      id: 1,
      name: "John Doe",
      date: "2024-11-01",
      checkIn: "08:45",
      checkOut: "17:30",
      checkInStatus: "เข้าปกติ",
      checkOutStatus: "ออกปกติ",
      note: "-"
    },
    {
      id: 2,
      name: "Jane Smith",
      date: "2024-11-15",
      checkIn: "09:00",
      checkOut: "-",
      checkInStatus: "เข้าปกติ",
      checkOutStatus: "ไม่ได้ลงเวลาออก",
      note: "-"
    },
    {
      id: 3,
      name: "Bob Johnson",
      date: "2024-11-20",
      checkIn: "-",
      checkOut: "-",
      checkInStatus: "-",
      checkOutStatus: "-",
      note: "วันหยุด"
    }
  ]);

  const getCurrentDate = () => {
    const date = new Date();
    date.setHours(date.getHours() + 7); // ปรับเวลาเป็น UTC+7 สำหรับเขตเวลาไทย
    return date.toISOString().split("T")[0]; // แปลงเป็นรูปแบบ YYYY-MM-DD
  };

  const [startDate, setStartDate] = useState(getCurrentDate());
  const [endDate, setEndDate] = useState(getCurrentDate());

  const filteredAttendanceRecords = attendanceRecords.filter(
    (record) =>
      record.name.toLowerCase().includes(searchReportName.toLowerCase()) &&
      record.date >= startDate &&
      record.date <= endDate
  );

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

  const downloadAttendanceExcel = () => {
    // สร้างข้อมูลสำหรับ Excel
    const excelData = filteredAttendanceRecords.map(record => ({
      'วันที่': formatDateForDisplay(record.date),
      'ชื่อ-นามสกุล': record.name,
      'เวลาเข้า': record.checkIn,
      'เวลาออก': record.checkOut,
      'สถานะ': getCombinedStatus(record.checkInStatus, record.checkOutStatus, record.note),
      'หมายเหตุ': record.note
    }));

    // สร้าง workbook และ worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // ตั้งค่าความกว้างของคอลัมน์
    const columnWidths = [
      { wch: 20 }, // วันที่
      { wch: 25 }, // ชื่อ-นามสกุล
      { wch: 10 }, // เวลาเข้า
      { wch: 10 }, // เวลาออก
      { wch: 15 }, // สถานะ
      { wch: 15 }  // หมายเหตุ
    ];
    ws['!cols'] = columnWidths;

    // เพิ่ม worksheet ลงใน workbook
    XLSX.utils.book_append_sheet(wb, ws, "รายงานการเข้าออกงาน");

    // บันทึกไฟล์
    const formattedStartDate = formatDateForDisplay(startDate);
    const formattedEndDate = formatDateForDisplay(endDate);
    XLSX.writeFile(wb, `รายงานการเข้าออกงาน_${formattedStartDate}_ถึง_${formattedEndDate}.xlsx`);
  };

  const downloadAttendancePDF = () => {
    const doc = new jsPDF();

    // Add Thai font support
    doc.addFont(THSarabunNew, "THSarabun", "normal");
    doc.setFont("THSarabun");

    const formattedStartDate = formatDateForDisplay(startDate);
    const formattedEndDate = formatDateForDisplay(endDate);

    // Set title
    doc.setFontSize(18);
    doc.text(`รายงานการเข้าออกงาน`, 14, 15);
    doc.setFontSize(14);
    doc.text(`วันที่ ${formattedStartDate} ถึง ${formattedEndDate}`, 14, 22);

    const tableData = filteredAttendanceRecords.map((record) => {
      const status = getCombinedStatus(record.checkInStatus, record.checkOutStatus, record.note);
      const formattedDate = formatDateForDisplay(record.date);
      return [
        formattedDate,
        record.name,
        record.checkIn,
        record.checkOut,
        status,
        record.note,
      ];
    });

    autoTable(doc, {
      startY: 30,
      head: [["วันที่", "ชื่อ-นามสกุล", "เวลาเข้า", "เวลาออก", "สถานะ", "หมายเหตุ"]],
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
        0: { halign: 'left' },  // วันที่
        1: { halign: 'left' },  // ชื่อ-นามสกุล
        2: { halign: 'center' }, // เวลาเข้า
        3: { halign: 'center' }, // เวลาออก
        4: { halign: 'center' }, // สถานะ
        5: { halign: 'left' }   // หมายเหตุ
      }
    });

    doc.save(`รายงานการเข้าออกงาน_${formattedStartDate}_ถึง_${formattedEndDate}.pdf`);
  };

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
      path: "/admin/AdminDashboard",
      title: "Dashboard",
      description: "หน้าแดชบอร์ดหลัก",
    },
    {
      path: "/admin/AdminManage",
      title: "จัดการผู้ใช้งาน",
      description: "เพิ่ม ลบ แก้ไขข้อมูลผู้ใช้",
    },
    {
      path: "/admin/AdminAccess",
      title: "สิทธิ์การเข้าถึง",
      description: "กำหนดสิทธิ์การเข้าถึงระบบ",
    },
    {
      path: "/admin/AdminReports",
      title: "รายงาน",
      description: "ดูรายงานการเข้าออกงาน",
    },
    {
      path: "/admin/AdminSettings",
      title: "ตั้งค่าระบบ",
      description: "ตั้งค่าทั่วไปของระบบ",
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
        />

        <div className="w-full p-2 md:p-4 bg-white">
          {/* Filter Section */}
          <div className="bg-white rounded-lg shadow p-4">
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
                  min={startDate}
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ค้นหาชื่อ
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ค้นหาชื่อ"
                    value={searchReportName}
                    onChange={(e) => setSearchReportName(e.target.value)}
                    className="w-full p-2 pl-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="w-4 h-4 text-gray-500 absolute left-2 top-3" />
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">วันที่</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">ชื่อ-นามสกุล</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">เวลาเข้า</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">เวลาออก</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">สถานะ</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAttendanceRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDateForDisplay(record.date)}</td>
                      <td className="px-4 py-3 text-sm">{record.name}</td>
                      <td className="px-4 py-3 text-sm text-center">{record.checkIn}</td>
                      <td className="px-4 py-3 text-sm text-center">{record.checkOut}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        {getCombinedStatus(record.checkInStatus, record.checkOutStatus, record.note)}
                      </td>
                      <td className="px-4 py-3 text-sm text-center">{record.note}</td>
                    </tr>
                  ))}
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
              <span>ดาวน์โหลด Excel</span>
            </button>
            <button
              onClick={downloadAttendancePDF}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <File className="w-4 h-4 mr-2" />
              <span>ดาวน์โหลด PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;