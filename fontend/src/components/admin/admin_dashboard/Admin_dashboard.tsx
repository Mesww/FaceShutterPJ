import { useState } from "react";
import {
  Users,
  FileText,
  Settings,
  LogOut,
  Monitor,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import AdminManage from "../admin_manage/Admin_manage";
import AdminAccess from "../admin_access/Admin_access";
import AdminReports from "../admin_reports/Admin_reports";
import "../admin_dashboard/Admin_dashboard.css";

const AdminDashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState("user-management");

  const menuItems = [
    {
      id: "user-management",
      title: "จัดการผู้ใช้งาน",
      icon: <Users size={20} />,
      description: "เพิ่ม ลบ แก้ไขข้อมูลผู้ใช้",
    },
    {
      id: "system-access",
      title: "สิทธิ์การเข้าถึง",
      icon: <Monitor size={20} />,
      description: "กำหนดสิทธิ์การเข้าถึงระบบ",
    },
    {
      id: "reports",
      title: "รายงาน",
      icon: <FileText size={20} />,
      description: "ดูรายงานการเข้าออกงาน",
    },
    {
      id: "settings",
      title: "ตั้งค่าระบบ",
      icon: <Settings size={20} />,
      description: "ตั้งค่าทั่วไปของระบบ",
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
              ADMIN SYSTEM
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
                ${activePage === item.id ? 'bg-red-600' : 'text-gray-300 hover:bg-gray-700'}`}
            >
              <div className="px-4 py-3 flex items-center space-x-3">
                <span className={`flex-shrink-0 ${activePage === item.id ? 'text-white' : 'text-gray-300'}`}>
                  {item.icon}
                </span>
                {!isSidebarCollapsed && (
                  <div className="flex flex-col">
                    <span className={`truncate font-medium ${activePage === item.id ? 'text-white' : 'text-gray-300'}`}>
                      {item.title}
                    </span>
                    <span className={`text-sm ${activePage === item.id ? 'text-white' : 'text-gray-400'}`}>
                      {item.description}
                    </span>
                  </div>
                )}
              </div>
            </button>
          ))}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-0 w-full p-4">
          <button
            className={`w-full flex items-center space-x-2 px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-md transition-colors`}
          >
            <LogOut size={20} />
            {!isSidebarCollapsed && (
              <span className="font-medium">ออกจากระบบ</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 transition-all duration-300 ease-in-out
          ${isSidebarCollapsed ? 'ml-16' : 'ml-72'}`}
      >
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {menuItems.find((item) => item.id === activePage)?.title}
              </h2>
              <p className="text-sm text-gray-500">
                {menuItems.find((item) => item.id === activePage)?.description}
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <User size={20} className="text-red-600" />
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">ผู้ดูแลระบบ</div>
                <div className="text-sm text-gray-500">admin@example.com</div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="container mx-auto p-6"> {/* Added container and mx-auto */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            {activePage === "user-management" && <AdminManage />}
            {activePage === "system-access" && <AdminAccess />}
            {activePage === "reports" && <AdminReports />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;