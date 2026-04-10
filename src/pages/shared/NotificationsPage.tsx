import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  List,
  Tag,
  Button,
  Badge,
  Typography,
  Empty,
  Spin,
} from 'antd';
import {
  BellOutlined,
  CheckOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  MailOutlined,
  FileSearchOutlined,
  CalendarOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { notificationsAPI } from '../../services/api';

const { Text, Title } = Typography;

interface AppNotification {
  id: string;
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  category: 'leave' | 'docs' | 'exam' | 'penalty' | 'circular' | 'result' | 'general';
}

const ICON_MAP: Record<string, React.ReactNode> = {
  leave: <FileTextOutlined />,
  docs: <FileSearchOutlined />,
  exam: <CalendarOutlined />,
  penalty: <ExclamationCircleOutlined />,
  circular: <BellOutlined />,
  result: <MailOutlined />,
  general: <InfoCircleOutlined />,
  review: <CheckCircleOutlined />,
};

const COLOR_MAP: Record<string, string> = {
  SUCCESS: '#52c41a',
  INFO: '#1890ff',
  WARNING: '#fa8c16',
  ERROR: '#ff4d4f',
};

const _getMockNotifications = (userId: string): AppNotification[] => {
  const base: AppNotification[] = [
    {
      id: 'n1',
      type: 'SUCCESS',
      title: 'Sick Leave Approved',
      message: 'Your sick leave SL-2024-00089 has been approved. 3 days added to used balance.',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: true,
      category: 'leave',
    },
    {
      id: 'n2',
      type: 'ERROR',
      title: 'Sick Leave Rejected',
      message: 'Your sick leave SL-2024-00084 has been rejected. Blocked facility detected.',
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      read: true,
      category: 'leave',
    },
    {
      id: 'n3',
      type: 'INFO',
      title: 'New Company Circular',
      message: 'New policy circular: Updated Sick Leave Policy 2024. Please review.',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      read: false,
      category: 'circular',
    },
    {
      id: 'n4',
      type: 'WARNING',
      title: 'Additional Documents Required',
      message: 'Your leave SL-2024-00092 requires additional documents. Please submit within 5 days.',
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
      read: false,
      category: 'docs',
    },
    {
      id: 'n5',
      type: 'WARNING',
      title: 'Medical Examination Scheduled',
      message: 'Company doctor has requested a personal examination. Appointment: March 20, 2024 at 9:00 AM.',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      read: false,
      category: 'exam',
    },
    {
      id: 'n6',
      type: 'ERROR',
      title: 'Penalty Applied',
      message: 'A 1st violation penalty (2 days salary deduction) has been applied to your account.',
      timestamp: new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000),
      read: true,
      category: 'penalty',
    },
    {
      id: 'n7',
      type: 'SUCCESS',
      title: 'Leave Result Email Sent',
      message: 'The HR department has sent you the official decision email for SL-2024-00089.',
      timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000),
      read: false,
      category: 'result',
    },
    {
      id: 'n8',
      type: 'INFO',
      title: 'Leave Balance Update',
      message: 'Your sick leave balance has been updated. Remaining: 8 days out of 14.',
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      read: true,
      category: 'general',
    },
    {
      id: 'n9',
      type: 'INFO',
      title: 'Leave Under Review',
      message: 'Your leave SL-2024-00095 is now under review by the company doctor.',
      timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
      read: false,
      category: 'leave',
    },
    {
      id: 'n10',
      type: 'SUCCESS',
      title: 'Account Verified',
      message: 'Your Jordan Aviation employee account has been verified and is active.',
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      read: true,
      category: 'general',
    },
  ];
  return userId === 'user-1' ? base : base.slice(0, 4);
};

const timeAgo = (date: Date): string => {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (mins < 60) return `${mins} min ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
};

const getGroup = (date: Date): string => {
  const now = new Date();
  const d = new Date(date);
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return 'thisWeek';
  return 'earlier';
};

const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [notifs, setNotifs] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    notificationsAPI.getAll()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setNotifs(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (user) {
          setNotifs(_getMockNotifications(user.id));
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const markAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    try { await notificationsAPI.markAllRead(); } catch { /* silent */ }
  };

  const markOneRead = async (id: string) => {
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try { await notificationsAPI.markRead(id); } catch { /* silent */ }
  };

  const grouped = useMemo(() => {
    const groups: Record<string, AppNotification[]> = {
      today: [],
      yesterday: [],
      thisWeek: [],
      earlier: [],
    };
    notifs.forEach((n) => {
      const g = getGroup(n.timestamp);
      groups[g].push(n);
    });
    return groups;
  }, [notifs]);

  const groupLabels: Record<string, string> = {
    today: t('notifs.today'),
    yesterday: t('notifs.yesterday'),
    thisWeek: t('notifs.thisWeek'),
    earlier: t('notifs.earlier'),
  };

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <div className="fade-in" style={{ padding: '0 0 32px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <Title level={3} style={{ margin: 0, color: '#001529' }}>
            <BellOutlined style={{ marginInlineEnd: 10, color: '#D4AF37' }} />
            {t('notifs.title')}
            {unreadCount > 0 && (
              <Badge
                count={unreadCount}
                style={{ marginInlineStart: 10, background: '#ff4d4f' }}
              />
            )}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('notifs.subtitle')}
          </Text>
        </div>
        {unreadCount > 0 && (
          <Button icon={<CheckOutlined />} onClick={markAllRead}>
            {t('notifs.markAllRead')}
          </Button>
        )}
      </div>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : notifs.length === 0 ? (
          <Empty description={t('notifs.empty')} style={{ padding: '40px 0' }} />
        ) : (
          ['today', 'yesterday', 'thisWeek', 'earlier'].map((group) => {
            const items = grouped[group];
            if (!items || items.length === 0) return null;
            return (
              <div key={group} style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#8c8c8c',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 10,
                    paddingBottom: 6,
                    borderBottom: '1px solid #f0f0f0',
                  }}
                >
                  {groupLabels[group]}
                </div>
                <List
                  dataSource={items}
                  renderItem={(item) => (
                    <List.Item
                      style={{
                        background: item.read ? 'transparent' : '#f0f7ff',
                        borderRadius: 10,
                        padding: '12px 16px',
                        marginBottom: 6,
                        border: item.read ? '1px solid transparent' : '1px solid #bae0ff',
                        transition: 'all 0.2s',
                        cursor: 'pointer',
                      }}
                      onClick={() => markOneRead(item.id)}
                      actions={[
                        !item.read && (
                          <Button
                            size="small"
                            type="link"
                            onClick={(e) => { e.stopPropagation(); markOneRead(item.id); }}
                            style={{ color: '#1890ff', padding: 0, fontSize: 11 }}
                          >
                            {t('notifs.markRead')}
                          </Button>
                        ),
                      ].filter(Boolean)}
                    >
                      <List.Item.Meta
                        avatar={
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: `${COLOR_MAP[item.type]}15`,
                              border: `2px solid ${COLOR_MAP[item.type]}40`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: COLOR_MAP[item.type],
                              fontSize: 16,
                              flexShrink: 0,
                              position: 'relative',
                            }}
                          >
                            {ICON_MAP[item.category] ?? <BellOutlined />}
                            {!item.read && (
                              <div
                                style={{
                                  position: 'absolute',
                                  top: -2,
                                  insetInlineEnd: -2,
                                  width: 10,
                                  height: 10,
                                  borderRadius: '50%',
                                  background: '#1890ff',
                                  border: '2px solid #fff',
                                }}
                              />
                            )}
                          </div>
                        }
                        title={
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Text strong style={{ fontSize: 13, color: '#001529' }}>{item.title}</Text>
                            <Tag
                              color={
                                item.type === 'SUCCESS' ? 'green'
                                : item.type === 'WARNING' ? 'orange'
                                : item.type === 'ERROR' ? 'red'
                                : 'blue'
                              }
                              style={{ fontSize: 10 }}
                            >
                              {item.type}
                            </Tag>
                            {!item.read && (
                              <Tag color="blue" style={{ fontSize: 10 }}>{t('notifs.new')}</Tag>
                            )}
                          </div>
                        }
                        description={
                          <div>
                            <Text style={{ fontSize: 12, color: '#595959' }}>{item.message}</Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 11 }}>{timeAgo(item.timestamp)}</Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
};

export default NotificationsPage;
