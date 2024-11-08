import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../sidebar/Sidebar";
import Header from "../header/Header";
import "./Admin_dashboard.css";

const AdminDashboard: React.FC = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const notificationCount = 3;

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
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        isSidebarCollapsed={isSidebarCollapsed}
        setIsSidebarCollapsed={setIsSidebarCollapsed}
      />
      
      {/* Main Content */}
      <div className={`flex-1 ${isSidebarCollapsed ? 'ml-16' : 'ml-72'} transition-all duration-300`}>
        <Header
          currentMenuItem={currentMenuItem}
          notificationCount={notificationCount}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
        />

        <main className="container mx-auto p-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;