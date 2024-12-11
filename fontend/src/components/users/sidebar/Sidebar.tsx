// import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
import {
    Scan,
    History,
    Bell,
    User,
    ChevronLeft,
    ChevronRight,
    // Menu
} from 'lucide-react';
import Swal from 'sweetalert2';
import { User as Users } from '@/interfaces/users_facescan.interface';
import "../sidebar/Sidebar.css";


interface SidebarProps {
    isSidebarCollapsed: boolean;
    setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    isLogined: boolean;
    logout: () => void;
    setName?: React.Dispatch<React.SetStateAction<string>>;
    setUserDetails?: React.Dispatch<React.SetStateAction<Users>>;
}

const Sidebar = ({ isSidebarCollapsed, setIsSidebarCollapsed, isLogined, logout, setName, setUserDetails }: SidebarProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    // const [setIsMobileMenuOpen] = useState(false);



    // ============= Provider =============== 

    const menuItems = isLogined ? [
        {
            path: '/users/UsersFacescan',
            title: 'สแกนใบหน้า',
            icon: <Scan size={20} />,
            description: 'บันทึกเวลาด้วยการสแกนใบหน้า'
        },
        {
            path: '/users/UsersEditprofile',
            title: 'แก้ไขข้อมูลส่วนตัว',
            icon: <User size={20} />,
            description: 'อัพเดตข้อมูลส่วนตัว เช่น ชื่อ อีเมล'
        },
        {
            path: '/users/UsersHistory',
            title: 'ประวัติการเข้างาน',
            icon: <History size={20} />,
            description: 'ตรวจสอบประวัติการเข้า-ออกงาน'
        },
        {
            path: '/users/UsersNotification',
            title: 'การแจ้งเตือน',
            icon: <Bell size={20} />,
            description: 'รับการแจ้งเตือนเมื่อมีการเปลี่ยนแปลง'
        }
    ] : [
        {
            path: '/users/UsersFacescan',
            title: 'สแกนใบหน้า',
            icon: <Scan size={20} />,
            description: 'บันทึกเวลาด้วยการสแกนใบหน้า'
        },
    ];

    const handleNavigate = (path: string) => {
        navigate(path);
        // setIsMobileMenuOpen(false);
    };

    const handleLogout = () => {
        Swal.fire({
            title: 'คุณต้องการออกจากระบบหรือไม่?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ออกจากระบบ',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            reverseButtons: false, // ไม่ต้องสลับปุ่ม
            width: '90%', // ปรับขนาดสำหรับมือถือ
            customClass: {
                popup: 'mobile-popup',
                title: 'mobile-title',
                confirmButton: 'mobile-btn confirm-btn-left', // เพิ่มคลาสสำหรับตำแหน่งปุ่ม
                cancelButton: 'mobile-btn',
            },
        }).then((result) => {
            if (result.isConfirmed) {
                if (setName !== undefined) {
                    setName('');
                } else if (setUserDetails !== undefined) {
                    setUserDetails({
                        employee_id: '',
                        name: '',
                        email: '',
                        password: '',
                        tel: '',
                    });
                }
                logout();
                // setIsMobileMenuOpen(false);
                navigate('/users/');
                window.location.reload(); // รีโหลดหน้า
            }
        });
    };


    // Desktop Sidebar
    const DesktopMenu = () => (
        <div
            className={`hidden md:block fixed top-0 left-0 h-full bg-gray-800 transition-all duration-300 ease-in-out z-20 
            ${isSidebarCollapsed ? 'w-16' : 'w-72'}`}
        >
            <div className="bg-blue-700 px-4 py-4 flex items-center justify-between min-h-[64px]">
                {!isSidebarCollapsed && (
                    <h1 className="text-white text-xl font-semibold truncate">
                        USERS SYSTEM
                    </h1>
                )}
                <button
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="p-2 bg-blue-700 rounded-md transition-colors"
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
                        ${location.pathname === item.path ? 'bg-blue-700' : 'text-gray-300 hover:bg-gray-700'}`}
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

            {/* Desktop Logout */}

            {/* Sidebar Logout - Positioned at the Bottom */}
            {isLogined && <div className="absolute bottom-4 w-full">
                <button className="w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-blue-700 rounded flex items-center justify-start" onClick={handleLogout}>
                    <LogOut size={20} className={`${!isSidebarCollapsed && 'mr-2'}`} />
                    {!isSidebarCollapsed && "ออกจากระบบ"}
                </button>
            </div>}
        </div>
    );

    // Mobile Floating Button and Menu
    const MobileMenu = () => (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-500 z-20">
            <div className="grid grid-cols-5 h-16">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className={`flex flex-col items-center justify-center py-2 relative 
                        ${location.pathname === item.path
                                ? 'text-blue-700'
                                : 'text-black hover:text-blue-700'
                            }`}
                    >
                        <div className="absolute h-1 w-full top-0 left-0">
                            {location.pathname === item.path && (
                                <div className="h-full bg-blue-700 mx-auto w-8 rounded-b-full"></div>
                            )}
                        </div>
                        {item.icon}
                        <span className={`text-xs font-semibold mt-1 ${location.pathname === item.path ? '' : 'text-[10px]'}`}>
                            {item.title}
                        </span>
                    </button>
                ))}
                {isLogined && (
                    <button
                        onClick={handleLogout}
                        className="flex flex-col items-center justify-center text-black hover:text-blue-700 py-2 relative"
                    >
                        <div className="absolute h-1 w-full top-0 left-0"></div>
                        <LogOut size={20} />
                        <span className="text-xs mt-1">Logout</span>
                    </button>
                )}
            </div>
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