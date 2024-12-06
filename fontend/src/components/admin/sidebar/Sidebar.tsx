import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { X, Menu } from 'lucide-react';
import {
    Users,
    FileText,
    Settings,
    LogOut,
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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const menuItems = [
        {
            path: "/admin/AdminManage",
            title: "จัดการผู้ใช้งาน",
            icon: <Users size={20} />,
            description: "เพิ่ม ลบ แก้ไขข้อมูลผู้ใช้",
        },
        // {
        //     path: "/admin/AdminAccess",
        //     title: "สิทธิ์การเข้าถึง",
        //     icon: <Monitor size={20} />,
        //     description: "กำหนดสิทธิ์การเข้าถึงระบบ",
        // },
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
        }, {
            title: 'Logout',
            description: 'ออกจากระบบ',
            path: '/admin/login',
            icon: <LogOut size={24} />
        }
    ];

    const handleLogout = () => {
        // เพิ่มโลจิกการ logout ที่นี่
        navigate("/admin/Login");
    };

    const handleNavigate = (path: string) => {
        navigate(path);
        setIsMobileMenuOpen(false);
    };

    // Desktop Sidebar
    const DesktopMenu = () => (
        <div
            className={`hidden md:block fixed top-0 left-0 h-full bg-gray-800 transition-all duration-300 ease-in-out z-20 
            ${isSidebarCollapsed ? 'w-16' : 'w-72'}`}
        >
            <div className="bg-red-700 px-4 py-4 flex items-center justify-between min-h-[64px]">
                {!isSidebarCollapsed && (
                    <h1 className="text-white text-xl font-semibold truncate">
                        ADMIN SYSTEM
                    </h1>
                )}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="p-2 bg-red-700 rounded-md transition-colors"
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
                        onClick={() => {
                            if (item.path === '/admin/login') {
                                handleLogout();
                            } else {
                                handleNavigate(item.path);
                            }
                        }}
                        className={`w-full text-left transition-colors duration-200 
                        ${location.pathname === item.path ? 'bg-red-700' : 'text-gray-300 hover:bg-gray-700'}`}
                    >
                        <div className="px-4 py-3 flex items-center space-x-3">
                            <span
                                className={`flex-shrink-0 ${location.pathname === item.path ? 'text-white' : 'text-gray-300'
                                    }`}
                            >
                                {item.icon}
                            </span>
                            {!isSidebarCollapsed && (
                                <div className="flex flex-col">
                                    <span
                                        className={`truncate font-medium ${location.pathname === item.path ? 'text-white' : 'text-gray-300'
                                            }`}
                                    >
                                        {item.title}
                                    </span>
                                    <span
                                        className={`text-sm ${location.pathname === item.path ? 'text-white' : 'text-gray-400'
                                            }`}
                                    >
                                        {item.description}
                                    </span>
                                </div>
                            )}
                        </div>
                    </button>
                ))}
            </nav>
        </div>
    );

    // Mobile Floating Button and Menu
    const MobileMenu = () => (
        <div className="md:hidden fixed bottom-4 right-4 z-20">
            <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="bg-gradient-to-r from-red-600 to-red-800 text-white p-4 rounded-full shadow-lg 
                   hover:shadow-xl transform hover:scale-105 transition-all duration-300
                   flex items-center justify-center"
                whileTap={{ scale: 0.95 }}
                animate={{
                    rotate: isMobileMenuOpen ? 180 : 0
                }}
                transition={{ duration: 0.2 }}
            >
                {isMobileMenuOpen ? (
                    <X size={24} className="text-white" />
                ) : (
                    <Menu size={24} className="text-white" />
                )}
            </motion.button>

            <AnimatePresence mode="wait">
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ 
                            opacity: 0, 
                            scale: 0.95, 
                            y: 20,
                            transition: { 
                                duration: 0.2,
                                ease: "easeInOut" 
                            }
                        }}
                        transition={{ 
                            duration: 0.2,
                            ease: "easeOut"
                        }}
                        className="absolute bottom-16 right-0 w-72 bg-gray-900 rounded-xl shadow-2xl overflow-hidden
                       border border-gray-700"
                    >
                        <nav className="py-2">
                            {menuItems.map((item, index) => (
                                <motion.button
                                    key={item.path}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ 
                                        opacity: 0, 
                                        x: -20,
                                        transition: {
                                            duration: 0.15,
                                            delay: (menuItems.length - index - 1) * 0.05
                                        }
                                    }}
                                    transition={{ 
                                        delay: index * 0.1,
                                        duration: 0.2
                                    }}
                                    onClick={() => {
                                        if (item.path === '/admin/login') {
                                            handleLogout();
                                        } else {
                                            handleNavigate(item.path);
                                        }
                                    }}
                                    className={`w-full text-left transition-all duration-200 
                                        ${location.pathname === item.path
                                            ? 'bg-red-600 bg-opacity-20'
                                            : 'hover:bg-gray-800'
                                        } group`}
                                >
                                    <div className="px-4 py-3 flex items-center space-x-4">
                                        <span
                                            className={`flex-shrink-0 transform transition-transform group-hover:scale-110
                                                ${location.pathname === item.path
                                                    ? 'text-red-400'
                                                    : 'text-gray-400 group-hover:text-red-400'
                                                }`}
                                        >
                                            {item.icon}
                                        </span>
                                        <div className="flex flex-col">
                                            <span
                                                className={`font-medium transition-colors
                                                    ${location.pathname === item.path
                                                        ? 'text-red-400'
                                                        : 'text-gray-300 group-hover:text-red-400'
                                                    }`}
                                            >
                                                {item.title}
                                            </span>
                                            <span
                                                className={`text-sm transition-colors
                                                    ${location.pathname === item.path
                                                        ? 'text-gray-300'
                                                        : 'text-gray-500 group-hover:text-gray-300'
                                                    }`}
                                            >
                                                {item.description}
                                            </span>
                                        </div>
                                    </div>
                                </motion.button>
                            ))}
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    return (
        <>
            <DesktopMenu />
            <MobileMenu />
        </>
    );
};

export default Sidebar;