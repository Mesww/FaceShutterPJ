import React from 'react';
import { Navigate } from 'react-router-dom';

interface ProtectmapRouteProps {
  children: React.ReactNode;
  requireRoles: string[];
}

const ProtectmapRoute: React.FC<ProtectmapRouteProps> = ({ 
  children, 
  requireRoles 
}) => {
  // Function to get current user role from localStorage or your auth state management
  const getCurrentUserRole = (): string => {
    // This should be replaced with your actual auth logic
    return 'ADMIN';
  };

  // Function to check if user is authenticated
//   const isAuthenticated = (): boolean => {
//     // This should be replaced with your actual auth logic
//     const token = localStorage.getItem('authToken');
//     return !!token;
//   };

  // Check if user has required role
  const hasRequiredRole = (): boolean => {
    const currentRole = getCurrentUserRole();
    return requireRoles.includes(currentRole);
  };

  // If not authenticated, redirect to login
//   if (!isAuthenticated()) {
//     return <Navigate to="/admin/Login" replace />;
//   }

  // If authenticated but doesn't have required role, redirect to unauthorized page
  // You can create a separate unauthorized page or redirect to home
  if (!hasRequiredRole()) {
    return <Navigate to="/" replace />;
  }

  // If authenticated and has required role, render children
  return <>{children}</>;
};

export default ProtectmapRoute;