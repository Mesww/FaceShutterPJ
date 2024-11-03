import { useState } from 'react';

// Define the PageId type to match the parent component
type PageId = "face-scan" | "edit-profile" | "attendance-history" | "notifications";

// Interface for menu item using the PageId type
interface MenuItem {
  id: PageId;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// Props interface using the PageId type
interface MobileMenuProps {
  menuItems: MenuItem[];
  activePage: PageId;
  onMenuItemClick: (pageId: PageId) => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ menuItems, activePage, onMenuItemClick }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleMenuItemClick = (pageId: PageId) => {
    onMenuItemClick(pageId);
    setIsOpen(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed right-4 bottom-4 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          className="w-6 h-6"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4 6h16M4 12h16M4 18h16" 
          />
        </svg>
      </button>

      {/* Bottom Sheet Menu */}
      <div
        className={`md:hidden fixed inset-0 bg-black bg-opacity-50 transition-opacity z-50 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      >
        <div
          className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-xl transition-transform duration-300 ease-out transform ${
            isOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          {/* Bottom Sheet Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">เมนู</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                className="w-6 h-6"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M6 18L18 6M6 6l12 12" 
                />
              </svg>
            </button>
          </div>

          {/* Menu Items */}
          <div className="p-2 max-h-[70vh] overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuItemClick(item.id)}
                className={`w-full text-left mb-2 p-3 rounded-lg transition-colors ${
                  activePage === item.id
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    {item.icon}
                  </div>
                  <div className="ml-3">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-gray-500">{item.description}</div>
                  </div>
                </div>
              </button>
            ))}

            {/* Logout Button */}
            <button 
              className="w-full mt-2 p-3 text-left text-red-600 rounded-lg hover:bg-red-50 flex items-center"
              onClick={() => setIsOpen(false)}
            >
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  className="w-5 h-5"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
                  />
                </svg>
              </div>
              <span className="ml-3">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MobileMenu;