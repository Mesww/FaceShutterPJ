import { useNavigate, useLocation } from "react-router-dom";
import {
    Users,
    FileText,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { removeLogined } from "@/containers/userLogin";
import Swal from "sweetalert2";

interface SidebarProps {
    isSidebarCollapsed: boolean;
    setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar = ({ isSidebarCollapsed, setIsSidebarCollapsed }: SidebarProps) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            path: "/admin/AdminManage",
            title: "User Management",
            icon: <Users size={20} />,
            description: "Add, delete, edit user information",
        },
        {
            path: "/admin/AdminReports",
            title: "Reports",
            icon: <FileText size={20} />,
            description: "View work entry and exit reports",
        },
        {
            path: "/admin/AdminSettings",
            title: "System Settings",
            icon: <Settings size={20} />,
            description: "Configure general system settings",
        },
        {
            title: 'Logout',
            path: '/admin/login',
            icon: <LogOut size={20} />
        }
    ];

    const handleLogout = () => {
        Swal.fire({
            title: "Confirm Logout",
            text: "Are you sure you want to log out?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Logout",
            cancelButtonText: "Cancel",
        }).then((result) => {
            if (result.isConfirmed) {
                removeLogined();
                navigate("/admin/Login");
                window.location.reload(); // Reload page
            }
        });
    };

    const handleNavigate = (path: string) => {
        if (path === '/admin/login') {
            handleLogout();
        } else {
            navigate(path);
        }
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
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-500 z-20">
            <div className="grid grid-cols-4 h-16">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path)}
                        className={`flex flex-col items-center justify-center py-2 relative 
                        ${location.pathname === item.path
                                ? 'text-red-700'
                                : 'text-black hover:text-red-700'
                            }`}
                    >
                        <div className="absolute h-1 w-full top-0 left-0">
                            {location.pathname === item.path && (
                                <div className="h-full bg-red-700 mx-auto w-8 rounded-b-full"></div>
                            )}
                        </div>
                        {item.icon}
                        {location.pathname === item.path && (
                            <span className="text-xs font-semibold mt-1">
                                {item.title}
                            </span>
                        )}
                    </button>
                ))}
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