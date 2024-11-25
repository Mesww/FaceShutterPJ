import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserData } from '../interfaces/users_facescan.interface';
import { getuserdata } from './getUserdata';
import { checkisLogined } from './userLogin';

interface UserContextType {
  userData: UserData | null;
  profileImage: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  setProfileImage: React.Dispatch<React.SetStateAction<string | null>>;
  refreshUserData: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLogined, setIsLogined] = useState<boolean>(false);
  // Get employee_id from localStorage or another auth source
  const getEmployeeId = () => {
    // Replace this with your actual auth logic
    const employeeId = localStorage.getItem('employee_id') || "1234";
    return employeeId;
  };

  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const employeeId = getEmployeeId();
      if (!employeeId) {
        throw new Error('No employee ID found');
      }

      const data = await getuserdata(employeeId);
      if (!data) {
        throw new Error('No user data received');
      }

      setUserData(data);
      if (data.image?.data) {
        setProfileImage(`data:image/jpeg;base64,${data.image.data}`);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch user data');
      setUserData(null);
      setProfileImage(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  // Expose refresh function
  const refreshUserData = async () => {
    await fetchUserData();
  };

  // Initial load
  useEffect(() => {
    setIsLogined(checkisLogined);
    if (isLogined) {
      localStorage.setItem('employee_id', '123');
      fetchUserData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only fetch on mount

  const value = {
    userData,
    profileImage,
    isLoading,
    isInitialized,
    error,
    setProfileImage,
    refreshUserData
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook with better error handling
// eslint-disable-next-line react-refresh/only-export-components
export const useUserData = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserData must be used within a UserProvider");
  }
  return context;
};