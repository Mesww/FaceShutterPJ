// import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
    Users,
    FileText,
    Settings,
    LogOut,
    Monitor,
    Home,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

interface SidebarProps {
    isSidebarCollapsed: boolean;
    setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar = ({ isSidebarCollapsed, setIsSidebarCollapsed }: SidebarProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            path: "/admin/AdminDashboard",
            title: "Dashboard",
            icon: <Home size={20} />,
            description: "หน้าแดชบอร์ดหลัก",
        },
        {
            path: "/admin/AdminManage",
            title: "จัดการผู้ใช้งาน",
            icon: <Users size={20} />,
            description: "เพิ่ม ลบ แก้ไขข้อมูลผู้ใช้",
        },
        {
            path: "/admin/AdminAccess",
            title: "สิทธิ์การเข้าถึง",
            icon: <Monitor size={20} />,
            description: "กำหนดสิทธิ์การเข้าถึงระบบ",
        },
        {
            path: "/admin/AdminReports",
            title: "รายงาน",
            icon: <FileText size={20} />,
            description: "ดูรายงานการเข้าออกงาน",
        },
        {
            path: "/admin/AdminSettings",
            title: "ตั้งค่าระบบ",
            icon: <Settings size={20} />,
            description: "ตั้งค่าทั่วไปของระบบ",
        },
    ];

    const handleLogout = () => {
        // เพิ่มโลจิกการ logout ที่นี่
        navigate("/admin/Login");
    };

    const handleNavigate = (path: string) => {
        navigate(path);
    };

    return (
        <div
            className={`fixed top-0 left-0 h-full bg-gray-800 transition-all duration-300 ease-in-out z-20 
        ${isSidebarCollapsed ? "w-16" : "w-72"}`}
        >
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

            <nav className="py-2">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className={`w-full text-left transition-colors duration-200 
              ${location.pathname === item.path ? "bg-red-600" : "text-gray-300 hover:bg-gray-700"}`}
                    >
                        <div className="px-4 py-3 flex items-center space-x-3">
                            <span className={`flex-shrink-0 ${location.pathname === item.path ? "text-white" : "text-gray-300"}`}>
                                {item.icon}
                            </span>
                            {!isSidebarCollapsed && (
                                <div className="flex flex-col">
                                    <span className={`truncate font-medium ${location.pathname === item.path ? "text-white" : "text-gray-300"}`}>
                                        {item.title}
                                    </span>
                                    <span className={`text-sm ${location.pathname === item.path ? "text-white" : "text-gray-400"}`}>
                                        {item.description}
                                    </span>
                                </div>
                            )}
                        </div>
                    </button>
                ))}
            </nav>

            <div className="absolute bottom-0 w-full p-4">
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center space-x-2 px-4 py-3 text-gray-300 hover:bg-gray-700 rounded-md transition-colors`}
                >
                    <LogOut size={20} className="text-white"/>
                    {!isSidebarCollapsed && <span className="font-medium">ออกจากระบบ</span>}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;