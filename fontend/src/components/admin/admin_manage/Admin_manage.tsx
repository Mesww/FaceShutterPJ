import { useState } from 'react';
import { Search, Plus, Edit, Trash2, Upload } from 'lucide-react';
import Sidebar from '../sidebar/Sidebar';
import Header from '../header/Header';
import { Outlet } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
}

const AdminManage: React.FC = () => {
  const [searchUserTerm, setSearchUserTerm] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const notificationCount = 3;
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "081-234-5678",
      avatar: "https://via.placeholder.com/150",
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@example.com",
      phone: "089-876-5432",
      avatar: "https://via.placeholder.com/150",
    },
  ]);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditFormVisible, setIsEditFormVisible] = useState(false);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter((user) => user.id !== userId));
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsAddingUser(false);
    setIsEditFormVisible(true);
  };

  const handleAddUser = () => {
    setEditingUser({
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      name: "",
      email: "",
      phone: "",
      avatar: "https://via.placeholder.com/150",
    });
    setPreviewImage(null);
    setIsAddingUser(true);
    setIsEditFormVisible(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateUser = (updatedUser: User) => {
    const userWithNewImage = {
      ...updatedUser,
      avatar: previewImage || updatedUser.avatar,
    };

    if (isAddingUser) {
      setUsers([...users, userWithNewImage]);
    } else {
      setUsers(users.map(user =>
        user.id === userWithNewImage.id ? userWithNewImage : user
      ));
    }
    setEditingUser(null);
    setIsEditFormVisible(false);
    setIsAddingUser(false);
    setPreviewImage(null);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setIsEditFormVisible(false);
    setIsAddingUser(false);
    setPreviewImage(null);
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
    user.phone.includes(searchUserTerm)
  );

  // Map paths to titles and descriptions
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
        <main className="w-full p-2 md:p-4 bg-white">
          <div className="p-3 md:p-6 bg-white rounded-lg shadow overflow-hidden">
            {/* Search and Add User Section */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center bg-gray-100 rounded-md p-2 w-full md:w-96">
                <Search className="w-5 h-5 text-gray-500 mr-2" />
                <input
                  type="text"
                  placeholder="ค้นหาตามชื่อ, อีเมล, หรือเบอร์โทร"
                  value={searchUserTerm}
                  onChange={(e) => setSearchUserTerm(e.target.value)}
                  className="bg-transparent border-none outline-none flex-1"
                />
              </div>
              <button
                onClick={handleAddUser}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                เพิ่มผู้ใช้
              </button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">รูปโปรไฟล์</TableHead>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>เบอร์โทรศัพท์</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        </TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.phone}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="flex items-center gap-1 bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-900 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              แก้ไข
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              ลบ
                            </button>
                          </div>
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

            {/* Edit Form Modal */}
            {isEditFormVisible && editingUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-full max-w-md">
                  <h2 className="text-xl font-semibold mb-4">
                    {isAddingUser ? 'เพิ่มผู้ใช้' : 'แก้ไขผู้ใช้'}
                  </h2>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdateUser({
                      ...editingUser,
                      name: (e.currentTarget.elements.namedItem('name') as HTMLInputElement).value,
                      email: (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value,
                      phone: (e.currentTarget.elements.namedItem('phone') as HTMLInputElement).value,
                    });
                  }}>
                    <div className="space-y-4">
                      {/* Image Upload Section */}
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative w-32 h-32">
                          <img
                            src={previewImage || editingUser.avatar}
                            alt="Profile preview"
                            className="w-full h-full rounded-full object-cover"
                          />
                          <label className="absolute bottom-0 right-0 bg-blue-600 p-2 rounded-full cursor-pointer hover:bg-blue-700">
                            <Upload className="w-4 h-4 text-white" />
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageChange}
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">ชื่อ</label>
                        <input
                          type="text"
                          name="name"
                          defaultValue={editingUser.name}
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">อีเมล</label>
                        <input
                          type="email"
                          name="email"
                          defaultValue={editingUser.email}
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">เบอร์โทรศัพท์</label>
                        <input
                          type="tel"
                          name="phone"
                          defaultValue={editingUser.phone}
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          ยกเลิก
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          บันทึก
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminManage;