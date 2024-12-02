import React, { useState } from 'react';
import { Camera, Zap, User, Clock, AlertTriangle } from 'lucide-react';
import Sidebar from '../sidebar/Sidebar';
import Header from '../header/Header.js';
import { useUserData } from '@/containers/provideruserdata.js';

type NotificationType = 'error' | 'warning' | 'success';
type NotificationStatus = 'รอการแก้ไข' | 'แก้ไขแล้ว' | 'สำเร็จ';

interface Notification {
  id: number;
  time: string;
  problem: string;
  status: NotificationStatus;
  icon: React.ReactNode;
  type: NotificationType;
}

const notifications: Notification[] = [

  {
    id: 1,
    time: "09:15:23",
    problem: "ไม่สามารถตรวจจับใบหน้าได้ กล้องอาจมีปัญหา",
    status: "รอการแก้ไข",
    icon: <Camera className="w-5 h-5 md:w-6 md:h-6 text-red-500" />,
    type: "error"
  },
  {
    id: 2,
    time: "08:30:45",
    problem: "ระบบออฟไลน์ชั่วคราว อาจเกิดจากปัญหาการเชื่อมต่อ",
    status: "แก้ไขแล้ว",
    icon: <Zap className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />,
    type: "warning"
  },
  {
    id: 3,
    time: "13:45:12",
    problem: "การยืนยันตัวตนล้มเหลว โปรดลองใหม่อีกครั้ง",
    status: "รอการแก้ไข",
    icon: <User className="w-5 h-5 md:w-6 md:h-6 text-red-500" />,
    type: "error"
  },
  {
    id: 4,
    time: "10:30:15",
    problem: "บันทึกเวลาเข้างานเรียบร้อยแล้ว",
    status: "สำเร็จ",
    icon: <Clock className="w-5 h-5 md:w-6 md:h-6 text-green-500" />,
    type: "success"
  },
  {
    id: 5,
    time: "14:20:33",
    problem: "แสงสว่างไม่เพียงพอ กรุณาสแกนในที่ที่มีแสงสว่างมากกว่านี้",
    status: "รอการแก้ไข",
    icon: <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />,
    type: "warning"
  }
];

const UserNotificationProblem: React.FC = () => {

  const {
    isLogined,
    userData,
  } = useUserData();

  const [name, setName] = useState(userData?.name || '');
  // const [email, setEmail] = useState(userData?.email || '');
  // const [phone, setPhone] = useState(userData?.tel || '');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const getNotificationStyles = (type: NotificationType): string => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-100';
      case 'warning':
        return 'bg-yellow-50 border-yellow-100';
      case 'success':
        return 'bg-green-50 border-green-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  const getStatusStyles = (status: NotificationStatus): string => {
    switch (status) {
      case 'รอการแก้ไข':
        return 'bg-red-500 text-white';
      case 'แก้ไขแล้ว':
        return 'bg-green-500 text-white';
      case 'สำเร็จ':
        return 'bg-blue-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const handleNotificationClick = (id: number): void => {
    console.log(`Action for notification ${id}`);
  };

  const menuItems = [
    {
      path: "/UsersFacescan",
      title: "สแกนใบหน้า",
      description: "บันทึกเวลาด้วยการสแกนใบหน้า",
    },
    {
      path: "/UsersEditprofile",
      title: "แก้ไขข้อมูลส่วนตัว",
      description: "อัพเดตข้อมูลส่วนตัว เช่น ชื่อ อีเมล",
    },
    {
      path: "/UsersHistory",
      title: "ประวัติการเข้างาน",
      description: "ตรวจสอบประวัติการเข้า-ออกงาน",
    },
    {
      path: "/UsersNotification",
      title: "การแจ้งเตือน",
      description: "รับการแจ้งเตือนเมื่อมีการเปลี่ยนแปลง",
    },
  ];

  const currentMenuItem = menuItems.find((item) => item.path === location.pathname);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">

      {/* Mobile Sidebar */}
      <div className={`md:hidden`}>
        <Sidebar
          isLogined={isLogined}
          isSidebarCollapsed={false}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          isLogined={isLogined}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
        />
      </div>

      {/* Main Content */}
      <div className={`flex-1 w-full md:w-auto transition-all duration-300 
        ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-72'}`}>
        <Header currentMenuItem={currentMenuItem} name={name} />

        <div className="w-full p-2 md:p-4 bg-white">
          <div className="p-3 md:p-6 bg-white rounded-lg shadow overflow-hidden">
            <h2 className="text-lg font-semibold mb-4">การแจ้งเตือนและสถานะ</h2>
            <div className="space-y-3 md:space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 md:p-4 rounded-lg border shadow-sm transition-all hover:shadow-md ${getNotificationStyles(notification.type)}`}
                >
                  <div className="flex flex-col md:flex-row md:items-start space-y-2 md:space-y-0 md:space-x-4">
                    <div className="flex-shrink-0">
                      {notification.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row justify-between items-start">
                        <div className="w-full md:pr-4">
                          <p className="text-sm text-gray-600 mb-1 md:mb-0">{notification.problem}</p>
                        </div>
                        <span className="text-xs md:text-sm text-gray-500 whitespace-nowrap">{notification.time}</span>
                      </div>

                      <div className="mt-2 flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
                        <span className={`px-2 md:px-3 py-1 text-xs md:text-sm font-medium rounded-full ${getStatusStyles(notification.status)}`}>
                          {notification.status}
                        </span>

                        <button
                          className="text-xs md:text-sm text-gray-500 hover:text-gray-700"
                          onClick={() => handleNotificationClick(notification.id)}
                        >
                          ดูรายละเอียด
                        </button>
                      </div>
                    </div>
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

export default UserNotificationProblem;