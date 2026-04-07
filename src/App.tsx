import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  DashboardOutlined,
  FileAddOutlined,
  FileTextOutlined,
  BookOutlined,
  UserOutlined,
  CalendarOutlined,
  WarningOutlined,
  UnorderedListOutlined,
  CheckCircleOutlined,
  BankOutlined,
  TeamOutlined,
  NotificationOutlined,
  ExclamationCircleOutlined,
  BarChartOutlined,
  BellOutlined,
  MedicineBoxOutlined,
  AuditOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';

import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AppLayout from './components/layout/AppLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import PlaceholderPage from './pages/PlaceholderPage';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import SubmitLeave from './pages/employee/SubmitLeave';
import MyLeaves from './pages/employee/MyLeaves';
import LeaveDetail from './pages/employee/LeaveDetail';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import ReviewQueue from './pages/doctor/ReviewQueue';
import LeaveReview from './pages/doctor/LeaveReview';
import { useAuthStore } from './store/authStore';
import type { UserRole } from './types';

const getDashboard = (role: UserRole): string => {
  if (role === 'EMPLOYEE') return '/employee/dashboard';
  if (role === 'COMPANY_DOCTOR') return '/doctor/dashboard';
  return '/admin/dashboard';
};

const DefaultRedirect: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  if (user) return <Navigate to={getDashboard(user.role)} replace />;
  return <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const { i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <ConfigProvider
      direction={isAr ? 'rtl' : 'ltr'}
      theme={{ token: { colorPrimary: '#D4AF37', borderRadius: 8 } }}
    >
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected app shell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Default index redirect */}
          <Route index element={<DefaultRedirect />} />

          {/* Employee routes */}
          <Route
            path="employee/dashboard"
            element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="employee/submit-leave"
            element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                <SubmitLeave />
              </ProtectedRoute>
            }
          />
          <Route
            path="employee/my-leaves"
            element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                <MyLeaves />
              </ProtectedRoute>
            }
          />
          <Route
            path="employee/leave/:id"
            element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                <LeaveDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="employee/balance"
            element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                <PlaceholderPage title="Leave Balance" icon={<CalendarOutlined />} />
              </ProtectedRoute>
            }
          />
          <Route
            path="employee/violations"
            element={
              <ProtectedRoute allowedRoles={['EMPLOYEE']}>
                <PlaceholderPage title="My Violations" icon={<WarningOutlined />} />
              </ProtectedRoute>
            }
          />

          {/* Doctor routes */}
          <Route
            path="doctor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['COMPANY_DOCTOR']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="doctor/queue"
            element={
              <ProtectedRoute allowedRoles={['COMPANY_DOCTOR']}>
                <ReviewQueue />
              </ProtectedRoute>
            }
          />
          <Route
            path="doctor/review/:id"
            element={
              <ProtectedRoute allowedRoles={['COMPANY_DOCTOR']}>
                <LeaveReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="doctor/decisions"
            element={
              <ProtectedRoute allowedRoles={['COMPANY_DOCTOR']}>
                <PlaceholderPage title="My Decisions" icon={<CheckCircleOutlined />} />
              </ProtectedRoute>
            }
          />
          <Route
            path="doctor/facilities"
            element={
              <ProtectedRoute allowedRoles={['COMPANY_DOCTOR']}>
                <PlaceholderPage title="Facilities Analysis" icon={<BankOutlined />} />
              </ProtectedRoute>
            }
          />
          <Route
            path="doctor/doctors"
            element={
              <ProtectedRoute allowedRoles={['COMPANY_DOCTOR']}>
                <PlaceholderPage title="Doctors Analysis" icon={<TeamOutlined />} />
              </ProtectedRoute>
            }
          />

          {/* Admin routes */}
          <Route
            path="admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['HR_MANAGER', 'HR_OFFICER']}>
                <PlaceholderPage title="Admin Dashboard" icon={<DashboardOutlined />} />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/leaves"
            element={
              <ProtectedRoute allowedRoles={['HR_MANAGER', 'HR_OFFICER']}>
                <PlaceholderPage title="All Leaves" icon={<FileTextOutlined />} />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/employees"
            element={
              <ProtectedRoute allowedRoles={['HR_MANAGER', 'HR_OFFICER']}>
                <PlaceholderPage title="Employees" icon={<TeamOutlined />} />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/facilities"
            element={
              <ProtectedRoute allowedRoles={['HR_MANAGER', 'HR_OFFICER']}>
                <PlaceholderPage title="Facilities" icon={<BankOutlined />} />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/doctors"
            element={
              <ProtectedRoute allowedRoles={['HR_MANAGER', 'HR_OFFICER']}>
                <PlaceholderPage title="Doctors" icon={<MedicineBoxOutlined />} />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/circulars"
            element={
              <ProtectedRoute allowedRoles={['HR_MANAGER', 'HR_OFFICER']}>
                <PlaceholderPage title="Circulars" icon={<NotificationOutlined />} />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/penalties"
            element={
              <ProtectedRoute allowedRoles={['HR_MANAGER', 'HR_OFFICER']}>
                <PlaceholderPage title="Penalties" icon={<ExclamationCircleOutlined />} />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/reports"
            element={
              <ProtectedRoute allowedRoles={['HR_MANAGER', 'HR_OFFICER']}>
                <PlaceholderPage title="Reports" icon={<BarChartOutlined />} />
              </ProtectedRoute>
            }
          />

          {/* Shared routes */}
          <Route
            path="rules"
            element={
              <ProtectedRoute>
                <PlaceholderPage title="Company Rules" icon={<BookOutlined />} />
              </ProtectedRoute>
            }
          />
          <Route
            path="notifications"
            element={
              <ProtectedRoute>
                <PlaceholderPage title="Notifications" icon={<BellOutlined />} />
              </ProtectedRoute>
            }
          />
          <Route
            path="profile"
            element={
              <ProtectedRoute>
                <PlaceholderPage title="My Profile" icon={<UserOutlined />} />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ConfigProvider>
  );
};

export default App;
