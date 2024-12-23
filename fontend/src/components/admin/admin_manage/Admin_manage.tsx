import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Edit, Trash2, UserPlus } from 'lucide-react';
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
import { BACKEND_URL } from '@/configs/backend';
import Swal from 'sweetalert2';
import { addAdmin } from '@/containers/userLogin';
import forge from "node-forge";
import { useUserData } from '@/containers/provideruserdata';
import { myUser } from '@/interfaces/admininterface';


interface User {
  employee_id: string;
  name: string;
  email: string;
  tel: string;
  roles: string;
  password?: string;
  is_password:boolean;
}


// Separate component for role selection dropdown
const RoleDropdown: React.FC<{
  selectedRole: string;
  onRoleChange: (role: string) => void;
  availableRoles?: string[];
}> = ({ selectedRole, onRoleChange, availableRoles = ['ALL', 'USER', 'ADMIN'] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center bg-gray-100 rounded-md p-2 hover:bg-gray-200 transition-colors"
      >
        <span className="mr-2">{selectedRole}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4 h-4"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-40 bg-white border rounded-md shadow-lg z-10">
          {availableRoles.map((role) => (
            <div
              key={role}
              onClick={() => {
                onRoleChange(role);
                setIsOpen(false);
              }}
              className={`
                px-4 py-2 cursor-pointer hover:bg-gray-100
                ${selectedRole === role ? 'bg-blue-50 font-semibold' : ''}
              `}
            >
              {role}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminManage: React.FC = () => {
  const [searchUserTerm, setSearchUserTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const notificationCount = 3;
  const {userData} = useUserData();
  // State for users fetched from the API
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user , setUser] = useState<myUser | null>(null);
  // Fetch users from API
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/users/get_all_user`);
      // console.log(response.data);
      setUsers(response.data);
      setLoading(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError('Failed to fetch users');
      setLoading(false);
      // console.error('Error fetching users:', err);
    }
  };



  // Fetch users when component mounts
  useEffect(() => {
    fetchUsers();
    setLoading(true);
    setUser(userData);
    setLoading(false);
  }, [userData]);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditFormVisible, setIsEditFormVisible] = useState(false);
  const [originalEmployeeId, setOriginalEmployeeId] = useState<string>('');

  // New state for Add Admin modal
  const [isAddAdminModalVisible, setIsAddAdminModalVisible] = useState(false);
  const [newAdminEmployeeId, setNewAdminEmployeeId] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  const handleDeleteUser = async (userId: string) => {
    try {
      // แสดง Sweet Alert เพื่อยืนยันการลบ
      const result = await Swal.fire({
        title: 'Confirm Delete',
        text: "Are you sure you want to delete this user?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Confirm',
        cancelButtonText: 'Cancel'
      });

      // ถ้ากดยืนยัน
      if (result.isConfirmed) {
        const response = await axios.delete(`${BACKEND_URL}/api/users/delete_user/${userId}`);
        
        if (response.data.status === 200) {
          // แสดง Sweet Alert เมื่อลบสำเร็จ
          await Swal.fire({
            title: 'Success Delete',
            text: 'Delete user successfully',
            icon: 'success',
            timer: 1500
          });
          
          // อัพเดทรายการผู้ใช้ในหน้าเว็บ
          setUsers(users.filter((user) => user.employee_id !== userId));
        } else {
          throw new Error(response.data.message || 'Failed to delete user');
        }
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // console.error('Error deleting user:', err);
      // แสดง Sweet Alert เมื่อเกิดข้อผิดพลาด
      await Swal.fire({
        title: 'Error',
        text: 'Failed to delete user',
        icon: 'error'
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setOriginalEmployeeId(user.employee_id);
    setIsEditFormVisible(true);
  };

  const handleSaveUser = async (updatedUser: User) => {
    try {
      // console.log(updatedUser.password);
 
      // Prepare the request body to match the API requirements
      const requestBody = {
        name: updatedUser.name,
        email: updatedUser.email,
        tel: updatedUser.tel,
        roles: updatedUser.roles,
        images: null , // Add this if needed, or fetch from existing user data
        password: updatedUser.password?.trim() ?? null,
      };
      // encrypt password
      if (requestBody.password) {
        const { data: { public_key } } = await axios.get(BACKEND_URL+"/get_public_key");
        const publicKey = forge.pki.publicKeyFromPem(public_key);
        const encryptedPassword = publicKey.encrypt(requestBody.password, "RSA-OAEP", {
                      md: forge.md.sha256.create(),
                  });
        requestBody.password = forge.util.bytesToHex(encryptedPassword);
      }


      // Make API call to update user
      const response = await axios.put(
        `${BACKEND_URL}/api/users/update_user_by_employee_id/${originalEmployeeId}`,
        requestBody
      );

      // Update local state with the response from the server
      if (response.data.status === 200) {
        // Update the users array with the updated user
        setUsers(users.map(user =>
          user.employee_id === originalEmployeeId ? { ...updatedUser } : user
        ));

        // Close the edit form
        setIsEditFormVisible(false);
        setEditingUser(null);
        setOriginalEmployeeId('');
        Swal.fire({
          title:'Edit successfully',
          timer: 5000,
          icon:'success'

        })

      } else {
        throw new Error(response.data.message || 'Failed to update user');
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // console.error('Error updating user:', err);
      alert('Failed to update user');
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setIsEditFormVisible(false);
    setOriginalEmployeeId('');

  };

  const handleAddAdmin = async () => {
    // Find if the employee already exists
    const existingUser = users.find(user => user.employee_id === newAdminEmployeeId);

    if (existingUser) {
      // If user exists, update their role to ADMIN
      setUsers(users.map(user =>
        user.employee_id === newAdminEmployeeId
          ? { ...user, roles: 'ADMIN' }
          : user
      ));
      Swal.fire({
        title: 'User already exists',
        text: 'User already exists and has been updated to an admin.',
        icon: 'info',
        timer: 1500
      });
    } else {
      // If user doesn't exist, add a new admin with minimal information
      setUsers([...users, {
        employee_id: newAdminEmployeeId,
        name: 'New Admin',
        email: `${newAdminEmployeeId}@mfu.ac.th`,
        tel: '',
        roles: 'ADMIN',
        is_password: true
      }]);
      await addAdmin(newAdminEmployeeId, newAdminPassword);
    }
    // Close the modal and reset the input
    setIsAddAdminModalVisible(false);
    setNewAdminEmployeeId('');
  };

  const filteredUsers = users.filter(user =>
    (selectedRole === 'ALL' || user.roles === selectedRole) &&
    (
      (user.name ? user.name.toLowerCase().includes(searchUserTerm.toLowerCase()) : '' )||
      (user.email?user.email.toLowerCase().includes(searchUserTerm.toLowerCase()):'' )||
      ( user.tel?user.tel.includes(searchUserTerm):'') ||
      (user.employee_id? user.employee_id.includes(searchUserTerm):'')
    )
  );

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

  // If loading, show a loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        loading information...
      </div>
    );
  }

  // If error, show an error message
  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen text-red-500">
        {error}
      </div>
    );
  }

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
        <main className="w-full p-2 md:p-4 bg-white">
          <div className="p-3 md:p-6 bg-white rounded-lg shadow overflow-hidden">
            <div className="flex justify-between items-center mb-6 relative">
              <div className="flex items-center space-x-2 w-full">
                {/* Search Input */}
                <div className="flex items-center bg-gray-100 rounded-md p-2 flex-1 md:w-96">
                  <Search className="w-5 h-5 text-gray-500 mr-2" />
                  <input
                    type="text"
                    placeholder="Search by employee ID, name, email, or phone number."
                    value={searchUserTerm}
                    onChange={(e) => setSearchUserTerm(e.target.value)}
                    className="bg-transparent border-none outline-none flex-1"
                  />
                </div>

                {/* Role Dropdown */}
                <RoleDropdown
                  selectedRole={selectedRole}
                  onRoleChange={setSelectedRole}
                />

                {/* Add Admin Button */}
                <button
                  onClick={() => setIsAddAdminModalVisible(true)}
                  className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Add Admin
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Name Surname</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <TableRow key={user.employee_id}>
                        <TableCell className="font-medium">{user.employee_id}</TableCell>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.tel}</TableCell>
                        <TableCell>{user.roles}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-start gap-2">
                            <button
                              onClick={() => handleEditUser(user)}
                              className="flex items-center gap-1 bg-gray-800 text-white px-2 py-1 rounded hover:bg-gray-900 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.employee_id)}
                              className="flex items-center gap-1 bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        <div className="px-6 py-4 text-center text-gray-500">No users found</div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Add Admin Modal */}
            {isAddAdminModalVisible && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-full max-w-md">
                  <h2 className="text-xl font-bold mb-4">Add Admin</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Employee ID</label>
                      <input
                        type="text"
                        value={newAdminEmployeeId}
                        onChange={(e) => setNewAdminEmployeeId(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Enter employee ID."
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Password</label>
                      <input
                        type="password"
                        name="password"
                        className="w-full p-2 border rounded"
                        placeholder="Enter password."
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddAdminModalVisible(false);
                          setNewAdminEmployeeId('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                      >
                        Cancle
                      </button>
                      <button
                        type="button"
                        onClick={handleAddAdmin}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        disabled={!newAdminEmployeeId}
                      >
                        Add Admin
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Replace the existing edit form modal with this updated code */}
            {isEditFormVisible && editingUser && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg w-full max-w-md">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const updatedUser: User = {
                      employee_id: formData.get('employee_id') as string,
                      name: formData.get('name') as string,
                      email: formData.get('email') as string,
                      tel: formData.get('tel') as string,
                      roles: formData.get('roles') as string,
                      password: formData.get('password') as string,
                      is_password: formData.get('roles') as string === 'ADMIN'
                    };
                    handleSaveUser(updatedUser);
                  }}>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Employee ID</label>
                        <input
                          type="text"
                          name="employee_id"
                          defaultValue={editingUser.employee_id}
                          className="w-full p-2 border rounded"
                          readOnly
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Name Surname</label>
                        <input
                          type="text"
                          name="name"
                          defaultValue={editingUser.name}
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                          type="email"
                          name="email"
                          defaultValue={editingUser.email}
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone Number</label>
                        <input
                          type="tel"
                          name="tel"
                          defaultValue={editingUser.tel}
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Role</label>
                        <select
                          name="roles"
                          defaultValue={editingUser.roles}
                          className="w-full p-2 border rounded"
                          required
                          onChange={(e) => setEditingUser({
                            ...editingUser,
                            roles: e.target.value,
                          })}
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </div>

                      {/* Password field for ADMIN */}
                      {editingUser.roles === 'ADMIN' && (
                        <div>
                          <label className="block text-sm font-medium mb-1">Password</label>
                          <input
                            type="password"
                            name="password"
                            className="w-full p-2 border rounded"
                            placeholder="Enter password."
                            required={editingUser.roles === 'ADMIN' && !editingUser.is_password}
                          />
                        </div>
                      )}
                      <div className="flex justify-end gap-2 mt-4">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                        >
                          Cancle
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Save
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