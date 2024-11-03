import { useState } from 'react';
import { Search, Download, File } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { UserOptions } from 'jspdf-autotable';
// import autoTable from 'jspdf-autotable';
// import 'jspdf-autotable';
import THSarabunNew from "../../../../public/font/THSarabunNew.ttf";

const AdminReports = () => {
  const [searchReportName, setSearchReportName] = useState("");
  const [attendanceRecords] = useState([
    {
      id: 1,
      name: "John Doe",
      date: "2024-11-02",
      checkIns: [
        { time: "08:45:23", type: "เข้างาน" },
        { time: "12:30:11", type: "พักเที่ยง" },
        { time: "13:15:45", type: "กลับเข้างาน" },
        { time: "17:30:00", type: "ออกงาน" },
      ],
    },
    {
      id: 2,
      name: "Jane Smith",
      date: "2024-11-02", 
      checkIns: [
        { time: "09:00:00", type: "เข้างาน" },
        { time: "12:15:33", type: "พักเที่ยง" },
        { time: "13:00:22", type: "กลับเข้างาน" },
        { time: "18:00:15", type: "ออกงาน" },
      ],
    },
  ]);

  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const filteredAttendanceRecords = attendanceRecords.filter(
    (record) =>
      record.name.toLowerCase().includes(searchReportName.toLowerCase()) &&
      record.date >= startDate &&
      record.date <= endDate
  );

interface CheckIn {
  time: string;
  type: string;  // Changed from union type to string since that's what your data has
}

interface AttendanceRecord {
  id: number;    // Added this field
  date: string;
  name: string;
  checkIns: CheckIn[];
}

interface CheckInAccumulator {
  [key: string]: string | undefined;
}

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}


const downloadAttendanceRecords = () => {
  const csvContent = [
    "วันที่,ชื่อ-นามสกุล,เวลาเข้างาน,เวลาพักเที่ยง,กลับเข้างาน,เวลาออกงาน",
    ...filteredAttendanceRecords.map((record: AttendanceRecord) => {
      const checkIns = record.checkIns.reduce<CheckInAccumulator>((acc, check) => {
        acc[check.type] = check.time;
        return acc;
      }, {});

      // Format the date here
      const formattedDate = formatDateForDisplay(record.date);

      return `${formattedDate},${record.name},${checkIns["เข้างาน"] || "-"},${
        checkIns["พักเที่ยง"] || "-"
      },${checkIns["กลับเข้างาน"] || "-"},${checkIns["ออกงาน"] || "-"}`;
    }),
  ].join("\n");

  const blob = new Blob(["\ufeff" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `attendance_report_${startDate}_to_${endDate}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadAttendancePDF = () => {
  const doc = new jsPDF("p", "mm", "a4") as jsPDFWithAutoTable;
  
  doc.addFont(THSarabunNew, "THSarabun", "normal");
  doc.setFont("THSarabun");
  
  // Format dates for the header
  const formattedStartDate = formatDateForDisplay(startDate);
  const formattedEndDate = formatDateForDisplay(endDate);
  
  doc.setFontSize(18);
  doc.text(`รายงานการเข้าออกงาน วันที่ ${formattedStartDate} ถึง ${formattedEndDate}`, 14, 22);
  
  const tableData = filteredAttendanceRecords.map((record: AttendanceRecord) => {
    const checkIns = record.checkIns.reduce<CheckInAccumulator>((acc, check) => {
      acc[check.type] = check.time;
      return acc;
    }, {});

    // Format the date for table data
    const formattedDate = formatDateForDisplay(record.date);

    return [
      formattedDate,  // Use formatted date here
      record.name,
      checkIns["เข้างาน"] || "-",
      checkIns["พักเที่ยง"] || "-",
      checkIns["กลับเข้างาน"] || "-",
      checkIns["ออกงาน"] || "-",
    ];
  });

  doc.autoTable({
    startY: 30,
    head: [
      [
        "วันที่",
        "ชื่อ-นามสกุล",
        "เวลาเข้างาน",
        "เวลาพักเที่ยง",
        "กลับเข้างาน",
        "เวลาออกงาน",
      ],
    ],
    body: tableData,
    theme: "striped",
    styles: {
      font: "THSarabun",
      fontSize: 12,
      cellPadding: 3,
    },
    headStyles: {
      font: "THSarabun",
      fillColor: [31, 41, 55],
    },
  });

  doc.save(`attendance_report_${formattedStartDate}_to_${formattedEndDate}.pdf`);
};

  const formatDateForDisplay = (dateString:string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <label htmlFor="start-date" className="mr-3">
              วันที่เริ่มต้น:
            </label>
            <input
              type="date"
              id="start-date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-2 border rounded"
            />
          </div>
          <div className="flex items-center">
            <label htmlFor="end-date" className="mr-3">
              วันที่สิ้นสุด:
            </label>
            <input
              type="date"
              id="end-date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="p-2 border rounded"
              min={startDate}
            />
          </div>
        </div>

        <div className="flex items-center bg-gray-100 rounded p-2">
          <Search className="w-5 h-5 text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ"
            value={searchReportName}
            onChange={(e) => setSearchReportName(e.target.value)}
            className="bg-transparent border-none focus:outline-none w-48"
          />
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left font-semibold border-b">วันที่</th>
              <th className="p-3 text-left font-semibold border-b">ชื่อ-นามสกุล</th>
              <th className="p-3 text-left font-semibold border-b">เวลาเข้างาน</th>
              <th className="p-3 text-left font-semibold border-b">เวลาพักเที่ยง</th>
              <th className="p-3 text-left font-semibold border-b">กลับเข้างาน</th>
              <th className="p-3 text-left font-semibold border-b">เวลาออกงาน</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendanceRecords.map((record) => (
              <tr key={record.id} className="border-b">
                <td className="p-3">{formatDateForDisplay(record.date)}</td>
                <td className="p-3">{record.name}</td>
                {["เข้างาน", "พักเที่ยง", "กลับเข้างาน", "ออกงาน"].map(
                  (type) => (
                    <td key={type} className="p-3">
                      {record.checkIns.find(
                        (check) => check.type === type
                      )?.time || "-"}
                    </td>
                  )
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end mt-6 space-x-4">
        <button
          onClick={downloadAttendanceRecords}
          className="bg-green-600 text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-green-700"
        >
          <Download className="w-5 h-5" />
          <span>ดาวน์โหลดรายงาน Excel</span>
        </button>
        <button
          onClick={downloadAttendancePDF}
          className="bg-red-600 text-white px-4 py-2 rounded flex items-center space-x-2 hover:bg-red-700"
        >
          <File className="w-5 h-5" />
          <span>ดาวน์โหลดรายงาน PDF</span>
        </button>
      </div>
    </div>
  );
};

export default AdminReports;