import { Camera, Zap, User } from 'lucide-react';

const NotificationProblem = () => {
  const notifications = [
    {
      id: 1,
      name: "Robert ....",
      time: "09:15:23",
      problem: "ไม่สามารถตรวจจับใบหน้าได้ กล้องอาจมีปัญหา",
      status: "รอการแก้ไข",
      icon: <Camera className="w-6 h-6 text-red-500" />,
      type: "error"
    },
    {
      id: 2,
      name: "Holland ....",
      time: "08:30:45",
      problem: "ระบบออฟไลน์ชั่วคราว อาจเกิดจากปัญหาการเชื่อมต่อ",
      status: "แก้ไขแล้ว",
      icon: <Zap className="w-6 h-6 text-yellow-500" />,
      type: "warning"
    },
    {
      id: 3,
      name: "Curst ....",
      time: "13:45:12",
      problem: "การยืนยันตัวตนล้มเหลว โปรดลองใหม่อีกครั้ง",
      status: "รอการแก้ไข",
      icon: <User className="w-6 h-6 text-red-500" />,
      type: "error"
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <input
          type="text"
          placeholder="ค้นหาชื่อ"
          className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
      
      <div className="space-y-4">
        {notifications.map((notification) => (
          <div 
            key={notification.id}
            className={`p-4 rounded-lg border ${
              notification.type === 'error' 
                ? 'bg-red-50 border-red-100' 
                : 'bg-yellow-50 border-yellow-100'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                {notification.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{notification.name}</h3>
                    <p className="text-sm text-gray-600">{notification.problem}</p>
                  </div>
                  <span className="text-sm text-gray-500">{notification.time}</span>
                </div>
                
                <div className="mt-2 flex justify-between items-center">
                  <button 
                    className={`px-3 py-1 rounded-full text-sm ${
                      notification.status === 'รอการแก้ไข'
                        ? 'bg-red-500 text-white'
                        : 'bg-green-500 text-white'
                    }`}
                  >
                    {notification.status}
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

export default NotificationProblem;