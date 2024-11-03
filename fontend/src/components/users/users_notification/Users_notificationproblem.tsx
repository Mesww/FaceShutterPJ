import React from 'react';
import { Camera, Zap, User, Clock, AlertTriangle } from 'lucide-react';

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
    icon: <Camera className="w-6 h-6 text-red-500" />,
    type: "error"
  },
  {
    id: 2,
    time: "08:30:45",
    problem: "ระบบออฟไลน์ชั่วคราว อาจเกิดจากปัญหาการเชื่อมต่อ",
    status: "แก้ไขแล้ว",
    icon: <Zap className="w-6 h-6 text-yellow-500" />,
    type: "warning"
  },
  {
    id: 3,
    time: "13:45:12",
    problem: "การยืนยันตัวตนล้มเหลว โปรดลองใหม่อีกครั้ง",
    status: "รอการแก้ไข",
    icon: <User className="w-6 h-6 text-red-500" />,
    type: "error"
  },
  {
    id: 4,
    time: "10:30:15",
    problem: "บันทึกเวลาเข้างานเรียบร้อยแล้ว",
    status: "สำเร็จ",
    icon: <Clock className="w-6 h-6 text-green-500" />,
    type: "success"
  },
  {
    id: 5,
    time: "14:20:33",
    problem: "แสงสว่างไม่เพียงพอ กรุณาสแกนในที่ที่มีแสงสว่างมากกว่านี้",
    status: "รอการแก้ไข",
    icon: <AlertTriangle className="w-6 h-6 text-yellow-500" />,
    type: "warning"
  }
];

const UserNotificationProblem: React.FC = () => {
  // Function to get notification styles based on type
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

  // Function to get status button styles
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

  return (
    <div className="p-6 bg-white rounded-lg shadow overflow-hidden">
      <h2 className="text-lg font-semibold mb-4">การแจ้งเตือนและสถานะ</h2>
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg border shadow-sm transition-all hover:shadow-md ${getNotificationStyles(notification.type)}`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {notification.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <div className="pr-4">
                    <p className="text-sm text-gray-600">{notification.problem}</p>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">{notification.time}</span>
                </div>
                
                <div className="mt-2 flex justify-between items-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyles(notification.status)}`}
                  >
                    {notification.status}
                  </span>
                  
                  <button 
                    className="text-sm text-gray-500 hover:text-gray-700"
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
  );
};

export default UserNotificationProblem;