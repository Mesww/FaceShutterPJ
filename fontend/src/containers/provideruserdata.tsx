import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User } from '../interfaces/users_facescan.interface';
import { getcheckinorouttime, getuserdata } from './getUserdata';
import { checkisLogined } from './userLogin';
import Cookies from 'js-cookie';

interface UserContextType {
  userData: User | null;
  profileImage: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  setProfileImage: React.Dispatch<React.SetStateAction<string | null>>;
  refreshUserData: () => Promise<void>;
  isLogined:boolean;
  setIsLogined: React.Dispatch<React.SetStateAction<boolean>>;
  fetchCheckinoroutTime: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLogined, setIsLogined] = useState<boolean>(false);

  const [isCheckinorout, setIsCheckinorout] = useState<string | null>(null);

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

  const fetchCheckinoroutTime = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getcheckinorouttime();
      if (!data) {
        throw new Error('No checkinorout time received');
      }
      setIsCheckinorout(data.data as string);
      console.log(isCheckinorout);
      
    } catch (error) {
      console.error('Error fetching checkinorout time:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch checkinorout time');
      setIsCheckinorout(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  },[isCheckinorout]);

  // Expose refresh function
  const refreshUserData = async () => {
    await fetchUserData();
  };

  // Initial load
  useEffect(() => {
    console.log(checkisLogined);
    console.log(isLogined);
    fetchCheckinoroutTime();
    if (checkisLogined) {
      setIsLogined(checkisLogined);
      console.log('fetching user data');
      fetchUserData();
    }else{
      setIsLogined(false);
    }
  }, [isLogined, setIsLogined, fetchCheckinoroutTime]); // Only fetch on mount

 

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
    fetchCheckinoroutTime
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