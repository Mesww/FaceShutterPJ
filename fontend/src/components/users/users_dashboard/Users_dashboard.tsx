import { useState } from "react";
import {
  User,
  Scan,
  History,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import EditProfilePage from "../users_editprofile/Users_editprofile";
import FaceScanPage from "../users_facescan/Users_facescan";
import AttendanceHistoryPage from "../users_history/Users_history.js";
import MobileMenu from "../users_mobile_menu/Users_mobilemenu.js";
import UserNotificationProblem from "../users_notification/Users_notificationproblem.js";

// Define types for the menu items
type PageId = "face-scan" | "edit-profile" | "attendance-history" | "notifications";

interface MenuItem {
  id: PageId;
  title: string;
  icon: JSX.Element;
  description: string;
}

const UserDashboard = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activePage, setActivePage] = useState<PageId>("face-scan");

  const colors = {
    primary: "#0ea5e9",
    primaryHover: "#0284c7",
    primaryLight: "#e0f2fe",
    secondary: "#1f2937",
    textLight: "#f3f4f6",
    textDark: "#111827",
    borderColor: "#e5e7eb",
  };

  const menuItems: MenuItem[] = [
    {
      id: "face-scan",
      title: "สแกนใบหน้า",
      icon: <Scan size={20} />,
      description: "บันทึกเวลาด้วยการสแกนใบหน้า",
    },
    {
      id: "edit-profile",
      title: "แก้ไขข้อมูลส่วนตัว",
      icon: <User size={20} />,
      description: "อัพเดตข้อมูลส่วนตัว เช่น ชื่อ อีเมล",
    },
    {
      id: "attendance-history",
      title: "ประวัติการเข้างาน",
      icon: <History size={20} />,
      description: "ตรวจสอบประวัติการเข้า-ออกงาน",
    },
    {
      id: "notifications",
      title: "การแจ้งเตือน",
      icon: <Bell size={20} />,
      description: "รับการแจ้งเตือนเมื่อมีการเปลี่ยนแปลง",
    },
  ];

  const handleMenuItemClick = (pageId: PageId) => {
    setActivePage(pageId);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <div
        className={`hidden md:block fixed left-0 h-full transition-width duration-300 ease-in-out ${isSidebarCollapsed ? "w-20" : "w-64"
          }`}
        style={{ backgroundColor: colors.secondary }}
      >
        {/* Logo/Header */}
        <div
          className="h-16 flex items-center justify-between px-4"
          style={{ backgroundColor: colors.primary }}
        >
          {!isSidebarCollapsed && (
            <h1 className="text-white font-bold text-xl">USERS SYSTEM</h1>
          )}
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="text-white hover:bg-blue-700 p-2 rounded"
          >
            {isSidebarCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>

        {/* Desktop Menu Items */}
        <nav className="mt-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuItemClick(item.id)}
              className={`w-full text-left mb-2 px-4 py-3 transition-colors ${activePage === item.id
                  ? "bg-blue-700 text-white"
                  : "text-gray-300 hover:bg-blue-600 hover:text-white"
                }`}
            >
              <div className="flex items-center">
                <span className="mr-3">{item.icon}</span>
                {!isSidebarCollapsed && (
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm opacity-75">{item.description}</div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </nav>

        {/* Desktop Logout */}
        <button className="absolute bottom-4 left-4 right-4 py-2 px-4 text-gray-300 hover:text-white hover:bg-blue-700 rounded flex items-center justify-center">
          <LogOut size={20} className="mr-2" />
          {!isSidebarCollapsed && "ออกจากระบบ"}
        </button>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 md:transition-margin md:duration-300 md:ease-in-out ${isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
          }`}
      >
        {/* Header */}
        <header className="h-auto md:h-16 bg-white shadow-sm px-4 md:px-6 py-3 md:py-0">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            {/* Mobile Menu Button */}
            <div className="flex items-center justify-end md:hidden mb-2">
              <div className="flex items-center space-x-2">
                <div className="text-right">
                  <div className="font-medium">Robert Jhonson</div>
                  <div className="text-sm text-gray-600">พนักงานทั่วไป</div>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: colors.primaryLight }}
                >
                  <User size={20} style={{ color: colors.primary }} />
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg md:text-xl font-semibold">
                {menuItems.find((item) => item.id === activePage)?.title}
              </h2>
            </div>
            {/* Mobile Menu */}
            <MobileMenu
              menuItems={menuItems}
              activePage={activePage}
              onMenuItemClick={setActivePage}
            />
            {/* Desktop User Info */}
            <div className="hidden md:flex items-center space-x-4 mt-2">
              <div className="text-right">
                <div className="font-medium">Robert Jhonson</div>
                <div className="text-sm text-gray-600">พนักงานทั่วไป</div>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: colors.primaryLight }}
              >
                <User size={20} style={{ color: colors.primary }} />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">
          {activePage === "edit-profile" && <EditProfilePage />}
          {activePage === "face-scan" && <FaceScanPage />}
          {activePage === "attendance-history" && <AttendanceHistoryPage />}
          {activePage === "notifications" && <UserNotificationProblem />}
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;