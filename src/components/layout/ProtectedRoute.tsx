import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Spin } from 'antd';
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
  const isLoading = useAuthStore((s) => s.isLoading);
  const user = useAuthStore((s) => s.user);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (token && !user && !isLoading) {
      checkAuth();
    }
  }, [token, user, isLoading, checkAuth]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f0f2f5',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboard(user.role)} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
