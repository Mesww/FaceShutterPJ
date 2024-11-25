import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserData } from '../interfaces/users_facescan.interface';
import { getuserdata } from './getUserdata';
import { checkisLogined } from './userLogin';
import Cookies from 'js-cookie';

interface UserContextType {
  userData: UserData | null;
  profileImage: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  setProfileImage: React.Dispatch<React.SetStateAction<string | null>>;
  refreshUserData: () => Promise<void>;
  isLogined:boolean;
  setIsLogined: React.Dispatch<React.SetStateAction<boolean>>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLogined, setIsLogined] = useState<boolean>(false);

  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = Cookies.get('token');
      if (token === undefined) {
        throw new Error('No token found');
      }
      const data = await getuserdata(token);
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
    console.log(checkisLogined);
    setIsLogined(checkisLogined);
    if (isLogined) {
      fetchUserData();
    }else{
      setIsLogined(false);
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
    refreshUserData,
    isLogined,
    setIsLogined
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