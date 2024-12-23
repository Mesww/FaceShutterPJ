import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getuserdata } from '@/containers/getUserdata';
import { getLogined } from '@/containers/userLogin';
import LoadingSpinner from './loading/loading';

interface ProtectmapRouteProps {
  children: React.ReactNode;
  requireRoles: string[];
}


const ProtectmapRoute: React.FC<ProtectmapRouteProps> = ({ 
  children, 
  requireRoles 
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const getCurrentUserRole = async (): Promise<string> => {
    const token = getLogined();
    if (token) {
      const userData = await getuserdata(token);
      // console.log('User Data:', userData);
      return userData.roles; // Assuming `userData` has a `roles` property
    }
    return '';
  };

  useEffect(() => {
    const checkAccess = async () => {
      const token = getLogined();
      // console.log('Token:', token);

      if (!token) {
        setIsAuthenticated(false);
        setHasAccess(false);
        return;
      }

      setIsAuthenticated(true);

      const role = await getCurrentUserRole();
      // console.log('User Role:', role);
      // console.log('Required Roles:', requireRoles);
      setUserRole(role);
      const access = requireRoles.includes(role);
      setHasAccess(access);
    };

    checkAccess();
  }, [requireRoles]); // Only run this effect when `requireRoles` changes

  // Logging outside of the effect to track state after updates
  useEffect(() => {
    // console.log('isAuthenticated:', isAuthenticated);
    // console.log('hasAccess:', hasAccess);
  }, [isAuthenticated, hasAccess]);

  // Show loading state if authentication and role check are in progress
  if (isAuthenticated === null || hasAccess === null) {
    return <LoadingSpinner />;
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !hasAccess) {
    switch (userRole) {
      case "ADMIN":
        return <Navigate to="/admin/login" replace />;
      case "USER":
        return <Navigate to="/" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  // If authenticated but doesn't have required role, redirect to unauthorized page
  // if (!hasAccess) {
  //   return <Navigate to="/" replace />;
  // }

  // If authenticated and has required role, render children
  return <>{children}</>;
};

export default ProtectmapRoute;
