import React from "react";
import { Bell, User, X } from "lucide-react";
import NotificationProblem from "../admin_notification/NotificationProblem";
import { motion, AnimatePresence } from "framer-motion";

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
  employee_id: string|undefined;

}

const Header: React.FC<AdminHeaderProps> = ({
  currentMenuItem,
  notificationCount,
  showNotifications,
  setShowNotifications,
  employee_id,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="px-6 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <button
            className="md:hidden p-2 mr-4 hover:bg-gray-100 rounded-full transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X size={20} className="text-gray-600" />
            ) : (
              <Bell size={20} className="text-gray-600" />
            )}
          </button>
          <h2 className="text-lg font-semibold text-gray-900">
            {currentMenuItem?.title}
          </h2>
        </div>

        <div className="flex items-center space-x-6">
          <div className="relative hidden md:block">
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

          <div className="items-center space-x-3 hidden md:flex">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-red-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">System Administrator</div>
              <div className="text-sm text-gray-500">{employee_id ?? ""}</div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed top-0 left-0 w-full h-full bg-white z-20 overflow-y-auto"
          >
            <div className="px-6 py-4 flex justify-between items-center border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                {currentMenuItem?.title}
              </h2>
              <button
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>

            <div className="px-6 py-4 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <User size={20} className="text-red-600" />
                </div>
                <div className="text-left">
                  <div className="font-medium text-gray-900">System Administrator</div>
                  <div className="text-sm text-gray-500">{employee_id ?? ""}</div>
                </div>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative w-full p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <Bell size={20} className="text-gray-600" />
                    <span className="font-medium text-gray-900">Notifications</span>
                  </div>
                  {notificationCount > 0 && (
                    <span className="bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                      {notificationCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <NotificationProblem />
                  </div>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;