import React, { useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Button, ConfigProvider } from 'antd';
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
  GlobalOutlined,
  RocketOutlined,
  LogoutOutlined,
  SettingOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import type { UserRole } from '../../types';

const { Sider, Header, Content } = Layout;

type MenuItem = {
  key: string;
  icon: React.ReactNode;
  label: string;
  path: string;
};

const getMenuItems = (role: UserRole, t: (k: string) => string): MenuItem[] => {
  if (role === 'EMPLOYEE') {
    return [
      { key: '/employee/dashboard', icon: <DashboardOutlined />, label: t('sidebar.dashboard'), path: '/employee/dashboard' },
      { key: '/employee/submit-leave', icon: <FileAddOutlined />, label: t('sidebar.submitLeave'), path: '/employee/submit-leave' },
      { key: '/employee/my-leaves', icon: <FileTextOutlined />, label: t('sidebar.myLeaves'), path: '/employee/my-leaves' },
      { key: '/employee/balance', icon: <CalendarOutlined />, label: t('sidebar.balance'), path: '/employee/balance' },
      { key: '/employee/violations', icon: <WarningOutlined />, label: t('sidebar.violations'), path: '/employee/violations' },
      { key: '/rules', icon: <BookOutlined />, label: t('sidebar.companyRules'), path: '/rules' },
      { key: '/profile', icon: <UserOutlined />, label: t('sidebar.profile'), path: '/profile' },
    ];
  }
  if (role === 'COMPANY_DOCTOR') {
    return [
      { key: '/doctor/dashboard', icon: <DashboardOutlined />, label: t('sidebar.doctorDashboard'), path: '/doctor/dashboard' },
      { key: '/doctor/queue', icon: <UnorderedListOutlined />, label: t('sidebar.reviewQueue'), path: '/doctor/queue' },
      { key: '/doctor/decisions', icon: <CheckCircleOutlined />, label: t('sidebar.myDecisions'), path: '/doctor/decisions' },
      { key: '/doctor/facilities', icon: <BankOutlined />, label: t('sidebar.facilitiesAnalysis'), path: '/doctor/facilities' },
      { key: '/doctor/doctors', icon: <TeamOutlined />, label: t('sidebar.doctorsAnalysis'), path: '/doctor/doctors' },
      { key: '/rules', icon: <BookOutlined />, label: t('sidebar.companyRules'), path: '/rules' },
    ];
  }
  return [
    { key: '/admin/dashboard', icon: <DashboardOutlined />, label: t('sidebar.adminDashboard'), path: '/admin/dashboard' },
    { key: '/admin/leaves', icon: <FileTextOutlined />, label: t('sidebar.allLeaves'), path: '/admin/leaves' },
    { key: '/admin/employees', icon: <TeamOutlined />, label: t('sidebar.employees'), path: '/admin/employees' },
    { key: '/admin/facilities', icon: <BankOutlined />, label: t('sidebar.facilities'), path: '/admin/facilities' },
    { key: '/admin/doctors', icon: <MedicineBoxOutlined />, label: t('sidebar.doctors'), path: '/admin/doctors' },
    { key: '/admin/circulars', icon: <NotificationOutlined />, label: t('sidebar.circulars'), path: '/admin/circulars' },
    { key: '/admin/penalties', icon: <ExclamationCircleOutlined />, label: t('sidebar.penalties'), path: '/admin/penalties' },
    { key: '/admin/reports', icon: <BarChartOutlined />, label: t('sidebar.reports'), path: '/admin/reports' },
    { key: '/rules', icon: <BookOutlined />, label: t('sidebar.companyRules'), path: '/rules' },
  ];
};

const AppLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [collapsed, setCollapsed] = useState(false);

  const isAr = i18n.language === 'ar';

  const toggleLanguage = () => {
    i18n.changeLanguage(isAr ? 'en' : 'ar');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = user ? getMenuItems(user.role, t) : [];
  const selectedKey = menuItems.find((m) => location.pathname.startsWith(m.key))?.key || location.pathname;

  const userDropdownItems = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: t('sidebar.profile'),
        onClick: () => navigate('/profile'),
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: t('sidebar.settings'),
      },
      { type: 'divider' as const },
      {
        key: 'logout',
        icon: <LogoutOutlined style={{ color: '#ff4d4f' }} />,
        label: <span style={{ color: '#ff4d4f' }}>{t('auth.logout')}</span>,
        onClick: handleLogout,
      },
    ],
  };

  const displayName = isAr ? user?.nameAr : user?.nameEn;

  return (
    <ConfigProvider
      direction={isAr ? 'rtl' : 'ltr'}
      theme={{ token: { colorPrimary: '#D4AF37', borderRadius: 8 } }}
    >
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={260}
          collapsedWidth={80}
          style={{
            background: '#001529',
            position: 'fixed',
            height: '100vh',
            zIndex: 100,
            [isAr ? 'right' : 'left']: 0,
            top: 0,
            bottom: 0,
            overflowY: 'auto',
          }}
        >
          {/* Logo */}
          <div
            style={{
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? 0 : '0 20px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              gap: 10,
            }}
          >
            <RocketOutlined style={{ color: '#D4AF37', fontSize: 24, flexShrink: 0 }} />
            {!collapsed && (
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 0.5 }}>
                JA SLMS
              </span>
            )}
          </div>

          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[selectedKey]}
            style={{ background: '#001529', border: 'none', marginTop: 8 }}
            items={menuItems.map((item) => ({
              key: item.key,
              icon: item.icon,
              label: item.label,
              onClick: () => navigate(item.path),
              style:
                selectedKey === item.key
                  ? { background: '#D4AF37', color: '#001529', fontWeight: 600 }
                  : {},
            }))}
          />
        </Sider>

        <Layout
          style={{
            marginLeft: isAr ? 0 : collapsed ? 80 : 260,
            marginRight: isAr ? (collapsed ? 80 : 260) : 0,
            transition: 'margin 0.2s',
          }}
        >
          <Header
            style={{
              background: '#fff',
              padding: '0 24px',
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              position: 'sticky',
              top: 0,
              zIndex: 99,
            }}
          >
            <div style={{ fontWeight: 600, color: '#001529', fontSize: 16 }}>
              {menuItems.find((m) => location.pathname.startsWith(m.key))?.label || 'Jordan Aviation SLMS'}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <Badge count={unreadCount} size="small">
                <Button
                  type="text"
                  icon={<BellOutlined style={{ fontSize: 18, color: '#001529' }} />}
                  onClick={() => navigate('/notifications')}
                />
              </Badge>

              <Button
                type="text"
                icon={<GlobalOutlined />}
                onClick={toggleLanguage}
                style={{ color: '#001529', fontWeight: 500 }}
              >
                {isAr ? 'EN' : 'ع'}
              </Button>

              <Dropdown menu={userDropdownItems} placement={isAr ? 'bottomLeft' : 'bottomRight'} trigger={['click']}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: 8,
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <Avatar
                    style={{ background: '#001529', color: '#D4AF37', fontWeight: 700 }}
                    size="small"
                  >
                    {displayName?.[0] || 'U'}
                  </Avatar>
                  <span style={{ fontWeight: 500, color: '#001529', fontSize: 14 }}>
                    {displayName}
                  </span>
                </div>
              </Dropdown>
            </div>
          </Header>

          <Content
            style={{
              padding: 24,
              minHeight: 'calc(100vh - 64px)',
              background: '#f0f2f5',
            }}
          >
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default AppLayout;
