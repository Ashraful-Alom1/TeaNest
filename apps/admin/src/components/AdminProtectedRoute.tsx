import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTeaNestStore } from '@tea-nest/shared';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { state } = useTeaNestStore();
  const location = useLocation();

  const admin = state.currentAdmin;

  if (!admin || !admin.isActive) {
    // Redirect to /login while preserving the attempt location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
