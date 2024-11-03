import { useState } from 'react';
import { Search, Plus, Edit, Trash2 } from 'lucide-react';

// Define the User interface
interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
}

const AdminManage: React.FC = () => {
  const [searchUserTerm, setSearchUserTerm] = useState('');
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

  // State for editing mode with proper typing
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // State for edit form visibility
  const [isEditFormVisible, setIsEditFormVisible] = useState(false);

  const handleDeleteUser = (userId: number) => {
    setUsers(users.filter((user) => user.id !== userId));
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditFormVisible(true);
  };

  const handleAddUser = () => {
    const newUser: User = {
      id: users.length + 1,
      name: "New User",
      email: "new.user@example.com",
      phone: "",
      avatar: "https://via.placeholder.com/150",
    };
    setUsers([...users, newUser]);
    setEditingUser(newUser);
    setIsEditFormVisible(true);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ));
    setEditingUser(null);
    setIsEditFormVisible(false);
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setIsEditFormVisible(false);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchUserTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchUserTerm.toLowerCase())
  );

  return (
    <div className="w-full p-4">
      {/* Search and Add User Section */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center bg-gray-100 rounded-md p-2">
          <Search className="w-5 h-5 text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="ค้นหาผู้ใช้"
            value={searchUserTerm}
            onChange={(e) => setSearchUserTerm(e.target.value)}
            className="bg-transparent border-none outline-none w-64"
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

      {/* Edit Form */}
      {isEditFormVisible && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingUser.id === users.length + 1 ? 'เพิ่มผู้ใช้' : 'แก้ไขผู้ใช้'}
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
                <div>
                  <label className="block text-sm font-medium mb-1">ชื่อ</label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingUser.name}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">อีเมล</label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={editingUser.email}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">เบอร์โทรศัพท์</label>
                  <input
                    type="tel"
                    name="phone"
                    defaultValue={editingUser.phone}
                    className="w-full p-2 border rounded"
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

      {/* User Cards Grid */}
      <div className="user-cards-container">
        {filteredUsers.map((user) => (
          <div
            key={user.id}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
          >
            <div className="flex items-center mb-4">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-20 h-20 rounded-full mr-4 object-cover"
              />
              <div>
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <p className="text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="mb-4">
              <p>
                <span className="font-semibold">โทรศัพท์:</span> {user.phone}
              </p>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => handleEditUser(user)}
                className="flex items-center gap-2 bg-gray-800 text-white px-3 py-2 rounded hover:bg-gray-900 transition-colors"
              >
                <Edit className="w-4 h-4" />
                แก้ไข
              </button>
              <button
                onClick={() => handleDeleteUser(user.id)}
                className="flex items-center gap-2 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                ลบ
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminManage;