import React from "react";
import { User } from "lucide-react";

interface MenuItem {
  path: string;
  title: string;
  description: string;
}

interface AdminHeaderProps {
  currentMenuItem: MenuItem | undefined;
  name:string | null
  profileimage:string | null
  children?: React.ReactNode;
}

const Header: React.FC<AdminHeaderProps> = ({
  currentMenuItem,
  name,
  profileimage,
  children
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
            {children}
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              {profileimage != null ? 
                <img src={profileimage} alt="Profile" className="w-10 h-10 rounded-full object-cover" /> : 
                <User size={20} className="text-red-600" />
              }
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-medium text-gray-900">พนักงาน</div>
              <div className="text-sm text-gray-500 truncate max-w-[150px]">{name ? name : ""}</div>
            </div>
            <div className="text-left sm:hidden">
              <div className="font-medium text-gray-900 text-sm truncate max-w-[100px]">{name ? name : ""}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;