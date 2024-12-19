import { useEffect, useState } from 'react';
import Sidebar from '../sidebar/Sidebar';
import Header from '../header/Header';
// import "../admin_dashboard/Admin_dashboard.css";
import { useUserData } from '@/containers/provideruserdata';
import { myUser } from '@/interfaces/admininterface';

const AdminSettings = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const notificationCount = 3;
  const {userData} = useUserData();

   const [user , setUser] = useState<myUser | null>(null);
 

    // Map paths to titles and descriptions
    const menuItems = [
       
        {
            path: "/admin/AdminManage",
            title: "User Management",
            description: "Add, delete, edit user information",
        },
    
        {
            path: "/admin/AdminReports",
            title: "Reports",
            description: "View work entry and exit reports",
        },
        {
            path: "/admin/AdminSettings",
            title: "System Settings",
            description: "Configure general system settings",
        },
    ];

    const currentMenuItem = menuItems.find((item) => item.path === location.pathname);
    useEffect(() => {
        setUser(userData);
    }, [userData]);
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
                    employee_id={user?.employee_id}
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