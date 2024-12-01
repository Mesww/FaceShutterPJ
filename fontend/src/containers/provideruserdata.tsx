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
  isLogined:boolean;
  setIsLogined: React.Dispatch<React.SetStateAction<boolean>>;
  fetchCheckinoroutTime: () => Promise<void>;
  isCheckinroute: string | null;
  disableCheckinorout: boolean;
  disableCheckinorouttext: string | null;
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
      const token = Cookies.get('token');
      if (token === undefined || token === '' || token === null || token === 'undefined') {
        removeLogined()
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
      const token = Cookies.get('token');
      const data = await getcheckinorouttime();
      if (!data) {
        throw new Error('No checkinorout time received');
      }
      // console.log(isCheckinroute);
      // console.log(data);
      setIsCheckinroute(data.data as string);
      // console.log(isCheckinroute);

      if (isCheckinroute && token !== undefined) {
       const isCheckin =  await getisCheckin(token,isCheckinroute);
       console.log("IsCheckin",isCheckin);
       if (isCheckin.data === undefined) {
        setDisableCheckinorout(false);
       }
       
       setDisableCheckinorout(isCheckin.data as boolean);
       setDisableCheckinorouttext(isCheckin.message as string);
      }
      // console.log('Disable: ',disableCheckinorout);
      
    } catch (error) {
      console.error('Error fetching checkinorout time:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch checkinorout time');
      setIsCheckinroute(null);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  },[isCheckinroute,setDisableCheckinorout,setDisableCheckinorouttext]);

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
    fetchCheckinoroutTime,
    isCheckinroute,
    disableCheckinorout,
    disableCheckinorouttext
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