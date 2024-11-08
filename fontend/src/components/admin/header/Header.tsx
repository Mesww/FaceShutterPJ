import React from "react";
import { Bell, User } from "lucide-react";
import NotificationProblem from "../admin_notification/NotificationProblem";

interface MenuItem {
  path: string;
  title: string;
  description: string;
}

interface AdminHeaderProps {
  currentMenuItem: MenuItem | undefined;
  notificationCount: number;
  showNotifications: boolean;
  setShowNotifications: React.Dispatch<React.SetStateAction<boolean>>;
}

const Header: React.FC<AdminHeaderProps> = ({
  currentMenuItem,
  notificationCount,
  showNotifications,
  setShowNotifications,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-6 py-4 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {currentMenuItem?.title}
          </h2>
          <p className="text-sm text-gray-500">
            {currentMenuItem?.description}
          </p>
        </div>

        <div className="flex items-center space-x-6">
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Bell size={20} className="text-gray-600" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                  {notificationCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <NotificationProblem />
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-red-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">ผู้ดูแลระบบ</div>
              <div className="text-sm text-gray-500">admin@example.com</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;