import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const getDashboard = (role: UserRole): string => {
  if (role === 'EMPLOYEE') return '/employee/dashboard';
  if (role === 'COMPANY_DOCTOR') return '/doctor/dashboard';
  return '/admin/dashboard';
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboard(user.role)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
