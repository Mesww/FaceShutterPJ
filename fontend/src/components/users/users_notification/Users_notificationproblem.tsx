import React, { useEffect, useState } from 'react';
import Sidebar from '../sidebar/Sidebar';
import Header from '../header/Header.js';
import { useUserData } from '@/containers/provideruserdata.js';
import axios from 'axios';
import { AlertTriangle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getLogined } from '@/containers/userLogin.js';
import Swal from 'sweetalert2';

interface Log {
  _id: string;
  employee_id: string;
  logs: Array<{
    log: {
      action: string;
      status: string;
      message: string;
      confidence?: number;
      attempt?: number;
    };
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}

const UserNotificationProblem: React.FC = () => {

 // ====== Provider Data ======
 const {
  isLogined,
  userData,
  logout,
  profileImage
} = useUserData();

// State for form fields
const [name, setName] = useState(userData?.name || '');

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [logEntries, setLogEntries] = useState<Log[]>([]);

  const getNotificationStyles = (status: string): string => {
    switch (status) {
      case 'error':
        return 'bg-red-50 border-red-100';
      case 'stopped':
        return 'bg-yellow-50 border-yellow-100';
      default:
        return 'bg-gray-50 border-gray-100';
    }
  };

  const getStatusStyles = (status: string): string => {
    switch (status) {
      case 'error':
        return 'bg-red-500 text-white';
      case 'stopped':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
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

  const currentMenuItem = menuItems.find((item) => window.location.pathname.includes(item.path));

  useEffect(() => {
    setName(userData?.name || '');
  }, [userData?.name]);
  
  const navigate = useNavigate();
  useEffect(() => {
    const fetchLogs = async () => {
      try {
         const token = getLogined();
                    if(token === undefined){
                      Swal.fire({
                        title: 'Unauthorized',
                        text: 'You are not authorized to access this page',
                        icon: 'error',
                        timer: 1500
                      });
                      navigate('/admin/login');
                      return;
                    }
        
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/logs/getlogs`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        const logs = Array.isArray(response.data) ? response.data : 
                    Array.isArray(response.data.data) ? response.data.data : [];
        
        const userLogs = logs.filter((log: Log) => {
          return log.employee_id === userData?.employee_id && 
                 log.logs.some(item => ['error', 'stopped'].includes(item.log.status));
        }).map((log: Log) => ({
          ...log,
          logs: log.logs.filter(item => ['error', 'stopped'].includes(item.log.status))
        }));

        setLogEntries(userLogs);
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };

    if (userData?.employee_id) {
      fetchLogs();
      const interval = setInterval(fetchLogs, 30000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ userData?.employee_id]);
  
  const getIcon = (status: string) => {
    switch (status) {
      case 'error':
        return <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-red-500" />;
      case 'stopped':
        return <Zap className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />;
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'error':
        return 'เกิดข้อผิดพลาด';
      case 'failed':
        return 'ไม่สำเร็จ';
      case 'success':
        return 'สำเร็จ';
      case 'progress':
        return 'กำลังดำเนินการ';
      case 'stopped':
        return 'หยุดทำงาน';
      default:
        return status;
    }
  };

  const getActionText = (action: string): string => {
    switch (action) {
      case 'face_scan':
        return 'สแกนใบหน้า';
      default:
        return action;
    }
  };

  // สร้างฟังก์ชันสำหรับจัดเรียงข้อมูล
  const getSortedLogs = (logs: Log[]) => {
    return logs
      .map(entry => {
        // แปลง logs array เป็น array ของ notifications พร้อมข้อมูล employee_id
        return entry.logs.map(logItem => ({
          ...logItem,
          employee_id: entry.employee_id,
          _id: entry._id
        }));
      })
      .flat() // รวม array ทั้งหมดเข้าด้วยกัน
      .sort((a, b) => {
        // เรียงตามเวลาล่าสุดไปเก่าสุด
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">

      {/* Mobile Sidebar */}
      <div className={`md:hidden`}>
        <Sidebar
          isLogined={isLogined}
          isSidebarCollapsed={false}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          logout={logout}
          setName={setName}
        />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          isLogined={isLogined}
          isSidebarCollapsed={isSidebarCollapsed}
          setIsSidebarCollapsed={setIsSidebarCollapsed}
          logout={logout}
          setName={setName}
        />
      </div>

      {/* Main Content */}
      <div className={`flex-1 w-full md:w-auto transition-all duration-300 
        ${isSidebarCollapsed ? 'md:ml-16' : 'md:ml-72'}`}>
        <Header 
          profileimage={profileImage} 
          currentMenuItem={currentMenuItem} 
          name={name} 
        />

        <div className="p-4 md:p-6">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm">
            <div className="p-4 space-y-3">
              {logEntries.length > 0 ? (
                getSortedLogs(logEntries).map((logItem, index) => (
                  <div
                    key={`${logItem._id}-${index}`}
                    className={`p-4 rounded-lg border transition-all hover:shadow-md ${getNotificationStyles(logItem.log.status)}`}
                  >
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {getIcon(logItem.log.status)}
                      </div>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusStyles(logItem.log.status)}`}>
                              {getStatusText(logItem.log.status)}
                            </span>
                            {logItem.log.attempt && (
                              <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                                พยายามทั้งหมด {logItem.log.attempt} ครั้ง
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(logItem.created_at).toLocaleString('th-TH')}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm text-gray-900 font-medium">
                            {getActionText(logItem.log.action)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {logItem.log.message}
                          </p>
                        </div>

                        {logItem.log.confidence && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${logItem.log.confidence * 100}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 min-w-[4rem] text-right">
                              ความแม่นยำ {(logItem.log.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">ไม่พบการแจ้งเตือน</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserNotificationProblem;