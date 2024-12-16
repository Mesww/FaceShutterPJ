import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../interfaces/users_facescan.interface';
import { getcheckinorouttime, getisCheckin, getuserdata } from './getUserdata';
import { checkisLogined, removeLogined } from './userLogin';
import Cookies from 'js-cookie';

interface UserContextType {
  userData: User | null;
  profileImage: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  setProfileImage: React.Dispatch<React.SetStateAction<string | null>>;
  refreshUserData: () => Promise<void>;
  isLogined: boolean;
  setIsLogined: React.Dispatch<React.SetStateAction<boolean>>;
  fetchCheckinoroutTime: () => Promise<void>;
  isCheckinroute: string | null;
  disableCheckinorout: boolean;
  disableCheckinorouttext: string | null;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLogined, setIsLogined] = useState<boolean>(false);
  const [isCheckinroute, setIsCheckinroute] = useState<string | null>(null);
  const [disableCheckinorout, setDisableCheckinorout] = useState<boolean>(false);
  const [disableCheckinorouttext, setDisableCheckinorouttext] = useState<string | null>(null);

  const fetchUserData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('Fetching user data');
      const token = Cookies.get('token');
      if (!token || token === 'undefined') {
        removeLogined();
        throw new Error('No token found');
      }
      const data = await getuserdata(token);
      if (!data) {
        throw new Error('No user data received');
      }
      console.log('User data:', data);
      setUserData(data);
      console.log(data.images_profile !== null);
      if (data.images_profile) {
        setProfileImage(`data:image/jpeg;base64,${data.images_profile}`);
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

  const fetchCheckinoroutTime = useCallback(async () => {
    try {
      const token = Cookies.get('token');
      const data = await getcheckinorouttime();
      if (!data) {
        throw new Error('No checkinorout time received');
      }

      setIsCheckinroute(data.data as string);

      if (data.data && token) {
        const isCheckin = await getisCheckin(token, data.data as string);
        setDisableCheckinorout(isCheckin.data ?? false);
        setDisableCheckinorouttext(isCheckin.message ?? null);
      }
    } catch (error) {
      console.error('Error fetching checkinorout time:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch checkinorout time');
      setIsCheckinroute(null);
    }
  }, []);

  const refreshUserData = async () => {
    await fetchUserData();
  };

  const logout = () => {  
    removeLogined();
    setIsLogined(false);
    setUserData(null);
    
  }


  // Initial data fetch
  useEffect(() => {
    const initializeData = async () => {
      await fetchCheckinoroutTime();
      
      const isUserLoggedIn = checkisLogined;
      setIsLogined(isUserLoggedIn);
      
      if (isUserLoggedIn) {
        await fetchUserData();
      }
    };

    initializeData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array for initialization only

  // Handle login state changes
  useEffect(() => {
    if (isLogined) {
      console.log('User logged in, fetching user data');
      fetchUserData();
    }
  }, [isLogined]); // Only re-run if login state changes

  const value = {
    userData,
    profileImage,
    isLoading,
    isInitialized,
    error,
    setProfileImage,
    refreshUserData,
    isLogined,
    setIsLogined,
    fetchCheckinoroutTime,
    isCheckinroute,
    disableCheckinorout,
    disableCheckinorouttext,
    logout
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUserData = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserData must be used within a UserProvider");
  }
  return context;
};