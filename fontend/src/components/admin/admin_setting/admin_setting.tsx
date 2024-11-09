import { useState } from 'react';
import Sidebar from '../sidebar/Sidebar';
import Header from '../header/Header';
import "../admin_dashboard/Admin_dashboard.css";

const AdminSettings = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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

                {/* Main content area with proper margin for sidebar */}
                <div className="w-full p-2 md:p-4 bg-white">
                    <div className="p-3 md:p-6 bg-white rounded-lg shadow overflow-hidden"></div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;