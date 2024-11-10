import { useState } from 'react';
import { Search, Edit, X } from 'lucide-react';
import Sidebar from '../sidebar/Sidebar';
import Header from '../header/Header';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

const AdminAccess = () => {
  const [searchAccessTerm, setSearchAccessTerm] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const notificationCount = 3;

  const [accessRoles, setAccessRoles] = useState([
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

  const menuItems = [
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

  const handleEditAccess = (id: number, newDescription: string) => {
    setAccessRoles(prevRoles =>
      prevRoles.map(role =>
        role.id === id
          ? { ...role, description: newDescription }
          : role
      )
    );
    setEditingId(null);
  };

  const filteredAccessRoles = accessRoles.filter(role =>
    role.name.toLowerCase().includes(searchAccessTerm.toLowerCase()) ||
    role.email.toLowerCase().includes(searchAccessTerm.toLowerCase()) ||
    role.phone.includes(searchAccessTerm)
  );

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Mobile Sidebar */}
      <div className="md:hidden">
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
        <Header
          currentMenuItem={currentMenuItem}
          notificationCount={notificationCount}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
        />

        <div className="w-full p-2 md:p-4 bg-white">
          <div className="p-3 md:p-6 bg-white rounded-lg shadow">
            {/* Search Section */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center bg-gray-100 rounded-md p-2 w-full md:w-96">
                <Search className="w-5 h-5 text-gray-500 mr-2" />
                <input
                  type="text"
                  placeholder="ค้นหาตามชื่อ, อีเมล, หรือเบอร์โทร"
                  value={searchAccessTerm}
                  onChange={(e) => setSearchAccessTerm(e.target.value)}
                  className="bg-transparent border-none outline-none flex-1"
                />
                {searchAccessTerm && (
                  <button
                    onClick={() => setSearchAccessTerm('')}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Table */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ผู้ใช้งาน</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>เบอร์โทร</TableHead>
                  <TableHead>สิทธิ์การเข้าถึง</TableHead>
                  <TableHead>การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccessRoles.length > 0 ? (
                  filteredAccessRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <img className="h-10 w-10 rounded-full" src={role.avatar} alt="" />
                          <div className="ml-4">
                            <div className="font-medium">{role.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{role.email}</TableCell>
                      <TableCell>{role.phone}</TableCell>
                      <TableCell>
                        {editingId === role.id ? (
                          <select
                            className="border rounded p-1"
                            defaultValue={role.description}
                            onChange={(e) => handleEditAccess(role.id, e.target.value)}
                          >
                            <option value="มีสิทธิ์จำกัด">มีสิทธิ์จำกัด</option>
                            <option value="มีสิทธิ์เข้าถึงทุกระบบ">มีสิทธิ์เข้าถึงทุกระบบ</option>
                          </select>
                        ) : (
                          <div>{role.description}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === role.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingId(role.id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      <div className="px-6 py-4 text-center text-gray-500">ไม่พบข้อมูลที่ค้นหา</div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAccess;