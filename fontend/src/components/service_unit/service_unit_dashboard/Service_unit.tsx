import { useState } from "react";
import {
  UserCheck,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import NotificationProblem from "../service_unit_notification/NotificationProblem";
import AdminReports from "../../admin/admin_reports/Admin_reports";
import AttendanceTable from "../service_unit_check_attandend/Service_check-attandend";

const ServiceUnit = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState("check-attandend");

  const menuItems = [
    {
      id: "check-attandend",
      title: "ตรวจสอบและอนุมัติการเข้า-ออก",
      icon: <UserCheck size={20} />,
    },
    {
      id: "notification-problem",
      title: "แจ้งเตือนปัญหาการสแกน",
      icon: <AlertCircle size={20} />,
    },
    {
      id: "reports",
      title: "ดาวน์โหลดรายงาน",
      icon: <Clock size={20} />,
    },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-gray-800 transition-all duration-300 ease-in-out z-20
          ${isSidebarCollapsed ? 'w-16' : 'w-72'}`}
      >
        {/* Logo/Header */}
        <div className="bg-red-600 px-4 py-4 flex items-center justify-between min-h-[64px]">
          {!isSidebarCollapsed && (
            <h1 className="text-white text-xl font-semibold truncate">
              SERVICE UNIT
            </h1>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-red-700 rounded-md transition-colors"
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="text-white" size={20} />
            ) : (
              <ChevronLeft className="text-white" size={20} />
            )}
          </button>
        </div>

        {/* Menu Items */}
        <nav className="py-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`w-full text-left transition-colors duration-200 
                ${activePage === item.id ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
            >
              <div className="px-4 py-3 flex items-center space-x-3">
                <span className="flex-shrink-0">{item.icon}</span>
                {!isSidebarCollapsed && (
                  <span className="truncate font-medium">{item.title}</span>
                )}
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'ml-16' : 'ml-72'}`}
      >
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {menuItems.find((item) => item.id === activePage)?.title}
            </h2>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            {activePage === "reports" && <AdminReports />}
            {activePage === "notification-problem" && <NotificationProblem />}
            {activePage === "check-attandend" && <AttendanceTable />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ServiceUnit;