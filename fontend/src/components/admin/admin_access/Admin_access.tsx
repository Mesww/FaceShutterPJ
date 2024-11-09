import { useState } from 'react';
import { Search, Edit } from 'lucide-react';
import "../admin_dashboard/Admin_dashboard.css";
import Sidebar from '../sidebar/Sidebar';
import Header from '../header/Header';

const AdminAccess = () => {
  const [searchAccessTerm, setSearchAccessTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const notificationCount = 3;

  // ข้อมูลตัวอย่างสำหรับสิทธิ์การเข้าถึง
  const [accessRoles] = useState([
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "081-234-5678",
      description: "มีสิทธิ์เข้าถึงทุกระบบ",
      avatar: "https://via.placeholder.com/150",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "089-876-5432",
      description: "มีสิทธิ์จำกัด",
      avatar: "https://via.placeholder.com/150",
    },
  ]);

  // ฟังก์ชันค้นหาสิทธิ์การเข้าถึง
  // const filteredAccessRoles = accessRoles.filter((role) =>
  //   role.name.toLowerCase().includes(searchAccessTerm.toLowerCase())
  // );

  // ฟังก์ชันสำหรับการกำหนดสิทธิ์
  // const handleSetPermissions = (roleId) => {
  //   console.log("Set permissions for role:", roleId);
  //   // TODO: Implement permissions management logic
  // };

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
          <div className="p-3 md:p-6 bg-white rounded-lg shadow overflow-hidden">

            {/* ส่วนค้นหา */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center bg-gray-100 rounded-md p-2">
                <Search className="w-5 h-5 text-gray-500 mr-2" />
                <input
                  type="text"
                  placeholder="ค้นหาสิทธิ์การเข้าถึง"
                  value={searchAccessTerm}
                  onChange={(e) => setSearchAccessTerm(e.target.value)}
                  className="bg-transparent border-none outline-none flex-1"
                />
              </div>
            </div>

            {/* แสดงรายการสิทธิ์การเข้าถึง */}
            <div className="user-cards-container">
              {accessRoles.map((role) => (
                <div key={role.id} className="user-card">
                  <div className="flex items-center mb-4"
                  >
                    <img
                      src={role.avatar}
                      alt={role.name}
                      className="w-20 h-20 rounded-full mr-4"
                    />
                    <div>
                      <h3 style={{ margin: 0 }}>{role.name}</h3>
                      <p style={{ margin: 0, color: "gray" }}>{role.email}</p>
                      <p style={{ margin: 0, color: "gray" }}>{role.phone}</p>
                    </div>
                  </div>
                  <div>
                    <p>
                      <strong>คำอธิบาย:</strong> {role.description}
                    </p>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "15px",
                    }}
                  >
                    <button
                      style={{
                        backgroundColor: "#1f2937",
                        color: "white",
                        border: "none",
                        padding: "8px 12px",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <Edit size={16} /> กำหนดสิทธิ์
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAccess;