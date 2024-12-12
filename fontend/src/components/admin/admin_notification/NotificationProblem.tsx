import { useState, useEffect } from 'react';
import { AlertTriangle, Zap } from 'lucide-react';
import axios from 'axios';

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

const NotificationProblem = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [logEntries, setLogEntries] = useState<Log[]>([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/logs/getlogs`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        const logs = Array.isArray(response.data) ? response.data : 
                    Array.isArray(response.data.data) ? response.data.data : [];
        
        setLogEntries(logs);
      } catch (error) {
        console.error('Error fetching logs:', error);
      }
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, []);

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
      case 'stopped':
        return 'หยุดทำงาน';
      default:
        return status;
    }
  };

  // กรอง logs ตาม employee_id
  const filteredLogs = logEntries.filter(log =>
    log.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // เพิ่มฟังก์ชันสำหรับจัดเรียงข้อมูล
  const getSortedLogs = (logs: Log[]) => {
    return logs
      .map(entry => {
        return entry.logs.map(logItem => ({
          ...logItem,
          employee_id: entry.employee_id,
          _id: entry._id
        }));
      })
      .flat()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  };

  return (
    <div className="max-h-[80vh] overflow-y-auto">
      <div className="p-3 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">การแจ้งเตือน</h3>
        <input
          type="text"
          placeholder="ค้นหาด้วยรหัสพนักงาน"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full mt-2 px-3 py-1.5 text-sm rounded-md border border-gray-200 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
      </div>

      <div className="space-y-2">
        {filteredLogs.length > 0 ? (
          getSortedLogs(filteredLogs).map((logItem, index) => (
            <div
              key={`${logItem._id}-${index}`}
              className={`p-4 hover:bg-gray-50 transition-colors ${getNotificationStyles(logItem.log.status)} space-y-1.5 border rounded-lg`}
            >
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getIcon(logItem.log.status)}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      รหัส: {logItem.employee_id}
                    </p>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {new Date(logItem.created_at).toLocaleString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {logItem.log.message}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusStyles(logItem.log.status)}`}>
                      {getStatusText(logItem.log.status)}
                    </span>
                    {logItem.log.confidence && (
                      <span className="text-xs text-gray-500">
                        ความแม่นยำ {(logItem.log.confidence * 100).toFixed(0)}%
                      </span>
                    )}
                    {logItem.log.attempt && (
                      <span className="text-xs text-gray-500">
                        ครั้งที่ {logItem.log.attempt}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-sm text-gray-500">
            ไม่พบข้อมูล
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationProblem;