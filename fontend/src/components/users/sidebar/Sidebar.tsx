import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Scan,
    History,
    Bell,
    User,
    ChevronLeft,
    ChevronRight,
    Menu
} from 'lucide-react';
import Swal from 'sweetalert2';
import { User as Users } from '@/interfaces/users_facescan.interface';


interface SidebarProps {
    isSidebarCollapsed: boolean;
    setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
    isLogined:boolean;
    logout: () => void;
    setName?: React.Dispatch<React.SetStateAction<string  >>;
    setUserDetails?: React.Dispatch<React.SetStateAction<Users>>;
}

const Sidebar = ({ isSidebarCollapsed, setIsSidebarCollapsed,isLogined,logout,setName,setUserDetails }: SidebarProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);



 // ============= Provider =============== 
 
    const menuItems = isLogined? [
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
    ]:[
        {
            path: '/users/UsersFacescan',
            title: 'สแกนใบหน้า',
            icon: <Scan size={20} />,
            description: 'บันทึกเวลาด้วยการสแกนใบหน้า'
        }, 
    ];

    const handleNavigate = (path: string) => {
        navigate(path);
        setIsMobileMenuOpen(false);
    };

    const handleLogout = () => {
        Swal.fire({
            title: 'คุณต้องการออกจากระบบหรือไม่?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ใช่',
            cancelButtonText: 'ไม่',
            confirmButtonColor: '#2563eb',
            cancelButtonColor: '#d33',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                if (setName !== undefined) {
                    setName('');
                }else if (setUserDetails !== undefined) {
                    setUserDetails({ employee_id: "",
                        name: "",
                        email: "",
                        password: "",
                        tel: "",});
                }   
                logout();
                setIsMobileMenuOpen(false);
                navigate('/users/');
                
            }
        });
        
    }

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
     {isLogined&& <div className="absolute bottom-4 w-full">
            <button className="w-full px-4 py-3 text-gray-300 hover:text-white hover:bg-blue-700 rounded flex items-center justify-start" onClick={handleLogout}>
                <LogOut size={20} className={`${!isSidebarCollapsed && 'mr-2'}`} />
                {!isSidebarCollapsed && "ออกจากระบบ"}
            </button>
        </div>}
        </div>
    );

    // Mobile Floating Button and Menu
    const MobileMenu = () => (
        <div className="md:hidden fixed bottom-4 right-4 z-20">
            <motion.button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 rounded-full shadow-lg 
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
                                    onClick={() => handleNavigate(item.path)}
                                    className={`w-full text-left transition-all duration-200 
                                        ${location.pathname === item.path
                                            ? 'bg-blue-600 bg-opacity-20'
                                            : 'hover:bg-gray-800'
                                        } group`}
                                >
                                    <div className="px-4 py-3 flex items-center space-x-4">
                                        <span
                                            className={`flex-shrink-0 transform transition-transform group-hover:scale-110
                                                ${location.pathname === item.path
                                                    ? 'text-blue-400'
                                                    : 'text-gray-400 group-hover:text-blue-400'
                                                }`}
                                        >
                                            {item.icon}
                                        </span>
                                        <div className="flex flex-col">
                                            <span
                                                className={`font-medium transition-colors
                                                    ${location.pathname === item.path
                                                        ? 'text-blue-400'
                                                        : 'text-gray-300 group-hover:text-blue-400'
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
                            
                            {/* Mobile Logout */}
                            
                            {isLogined&& <motion.button  initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ 
                                        opacity: 0, 
                                        x: -20,
                                        transition: {
                                            duration: 0.15,
                                            delay: (menuItems.length - 1) * 0.05
                                        }
                                    }}
                                    transition={{ 
                                        delay: 0.1,
                                        duration: 0.2
                                    }} className="py-2 w-full text-left transition-all duration-200 group hover:bg-gray-800" onClick={handleLogout}>
                                         <div className="px-4 py-3 flex items-center space-x-4">
                                         <LogOut size={20} className="flex-shrink-0 transform transition-transform group-hover:scale-110 text-gray-400 group-hover:text-blue-400" />

                                        <div className="flex flex-col">
                                            <span
                                                className={`font-medium transition-colors text-gray-400 group-hover:text-blue-400
                                                 `}
                                            >
                                                ออกจากระบบ
                                            </span>
                                            
                                        </div>
                                    </div>
                                
                            </motion.button>}
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