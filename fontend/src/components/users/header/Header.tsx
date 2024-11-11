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
}

const Header: React.FC<AdminHeaderProps> = ({
  currentMenuItem,
  name
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
            
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <User size={20} className="text-red-600" />
            </div>
            <div className="text-left">
              <div className="font-medium text-gray-900">พนักงาน</div>
              <div className="text-sm text-gray-500">{name ? name :""}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;