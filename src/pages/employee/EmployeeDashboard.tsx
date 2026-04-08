import React, { useEffect, useMemo } from 'react';
import {
  Row,
  Col,
  Card,
  Button,
  Tag,
  Table,
  Progress,
  List,
  Typography,
  Badge,
  Alert,
} from 'antd';
import {
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FileAddOutlined,
  FileTextOutlined,
  BookOutlined,
  UserOutlined,
  BellOutlined,
  CheckOutlined,
  FileOutlined,
  MedicineBoxOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../../store/authStore';
import { useLeaveStore } from '../../store/leaveStore';
import { useNotificationStore } from '../../store/notificationStore';
import { getUserViolations } from '../../services/mockData';
import type { SickLeave, Notification } from '../../types';

const { Text } = Typography;

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: 'cyan',
  PROCESSING: 'blue',
  UNDER_REVIEW: 'orange',
  DOCS_REQUESTED: 'purple',
  EXAMINATION_REQUESTED: 'magenta',
  APPROVED: 'green',
  PARTIALLY_APPROVED: 'gold',
  REJECTED: 'red',
  PENDING_COMMITTEE: 'geekblue',
};

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const timeAgo = (timestamp: Date, t: (k: string) => string, isAr: boolean): string => {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return t('dashboard.justNow');
  if (hours < 1) return isAr ? `منذ ${mins} دقيقة` : `${mins} minutes ago`;
  if (days < 1) return isAr ? `منذ ${hours} ساعة` : `${hours} hours ago`;
  return isAr ? `منذ ${days} يوم` : `${days} days ago`;
};

const notifIcon = (notif: Notification) => {
  const base = { fontSize: 20 };
  switch (notif.type) {
    case 'SUCCESS': return <CheckOutlined style={{ ...base, color: '#52c41a' }} />;
    case 'ERROR': return <WarningOutlined style={{ ...base, color: '#ff4d4f' }} />;
    case 'WARNING': return <MedicineBoxOutlined style={{ ...base, color: '#fa8c16' }} />;
    default: return <FileOutlined style={{ ...base, color: '#1890ff' }} />;
  }
};

const StatCard: React.FC<{
  title: string;
  value: React.ReactNode;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  extra?: React.ReactNode;
}> = ({ title, value, subtitle, icon, accentColor, extra }) => (
  <Card
    style={{
      borderRadius: 12,
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      borderTop: `4px solid ${accentColor}`,
      height: '100%',
    }}
    className="fade-in"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {title}
        </Text>
        <div style={{ fontSize: 32, fontWeight: 800, color: accentColor, lineHeight: 1.2, marginTop: 4 }}>
          {value}
        </div>
        <Text type="secondary" style={{ fontSize: 13, marginTop: 4, display: 'block' }}>
          {subtitle}
        </Text>
        {extra && <div style={{ marginTop: 8 }}>{extra}</div>}
      </div>
      <div
        style={{
          fontSize: 36,
          color: accentColor,
          opacity: 0.15,
          lineHeight: 1,
        }}
      >
        {icon}
      </div>
    </div>
  </Card>
);

const EmployeeDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { leaves, loadUserLeaves } = useLeaveStore();
  const { notifications, loadNotifications } = useNotificationStore();

  const isAr = i18n.language === 'ar';

  useEffect(() => {
    if (user) {
      loadUserLeaves(user.id);
      loadNotifications(user.id);
    }
  }, [user, loadUserLeaves, loadNotifications]);

  const violations = useMemo(() => (user ? getUserViolations(user.id) : []), [user]);

  const approved = useMemo(() => leaves.filter((l) => l.status === 'APPROVED'), [leaves]);
  const pending = useMemo(
    () => leaves.filter((l) => ['SUBMITTED', 'PROCESSING', 'UNDER_REVIEW'].includes(l.status)),
    [leaves]
  );
  const usedDays = (user?.sickLeaveTotal ?? 0) - (user?.sickLeaveBalance ?? 0);
  const totalDays = user?.sickLeaveTotal ?? 14;
  const remainingDays = user?.sickLeaveBalance ?? 0;
  const usedPercent = totalDays > 0 ? Math.round((usedDays / totalDays) * 100) : 0;

  const recentLeaves = useMemo(() => [...leaves].sort((a, b) =>
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  ).slice(0, 5), [leaves]);

  const recentNotifications = useMemo(
    () => [...notifications].sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 5),
    [notifications]
  );

  const pieData = [
    { name: t('statuses.approved'), value: approved.reduce((s, l) => s + (l.approvedDays ?? l.totalDays), 0), color: '#52c41a' },
    { name: t('statuses.partiallyApproved'), value: leaves.filter(l => l.status === 'PARTIALLY_APPROVED').reduce((s, l) => s + (l.approvedDays ?? 0), 0), color: '#fa8c16' },
    { name: t('dashboard.pendingReview'), value: pending.length, color: '#1890ff' },
    { name: t('dashboard.remainingDays'), value: remainingDays, color: '#d9d9d9' },
  ].filter((d) => d.value > 0);

  const examLeaves = leaves.filter(
    (l) => l.status === 'EXAMINATION_REQUESTED' && l.examinationDetails
  );
  const docsLeaves = leaves.filter((l) => l.status === 'DOCS_REQUESTED');

  const displayName = isAr ? user?.nameAr : user?.nameEn;
  const dept = isAr ? user?.department?.nameAr : user?.department?.nameEn;

  const tableColumns = [
    {
      title: t('dashboard.refNum'),
      dataIndex: 'refNumber',
      key: 'ref',
      render: (ref: string, record: SickLeave) => (
        <Link to={`/employee/leave/${record.id}`} style={{ color: '#D4AF37', fontWeight: 600 }}>
          {ref}
        </Link>
      ),
    },
    {
      title: t('dashboard.period'),
      key: 'period',
      render: (_: unknown, record: SickLeave) =>
        `${formatDate(record.fromDate)} — ${formatDate(record.toDate)}`,
    },
    {
      title: t('common.days'),
      dataIndex: 'totalDays',
      key: 'days',
      render: (d: number) => `${d}`,
    },
    {
      title: t('submitLeave.doctorName'),
      key: 'doctor',
      render: (_: unknown, record: SickLeave) =>
        isAr ? record.doctor.nameAr : record.doctor.nameEn,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status] ?? 'default'}>
          {t(`statuses.${status.toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase())}`)}
        </Tag>
      ),
    },
    {
      title: t('dashboard.submittedOn'),
      key: 'submitted',
      render: (_: unknown, record: SickLeave) => formatDate(record.submittedAt),
    },
  ];

  const today = new Date().toLocaleDateString(isAr ? 'ar-JO' : 'en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fade-in" style={{ padding: '0 0 32px' }}>
      {/* Welcome Banner */}
      <Card
        style={{
          background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)',
          borderRadius: 16,
          marginBottom: 24,
          border: 'none',
          boxShadow: '0 4px 20px rgba(0,21,41,0.25)',
        }}
        bodyStyle={{ padding: '28px 32px' }}
      >
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={14}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, display: 'block', marginBottom: 4 }}>
              {today}
            </Text>
            <div style={{ color: '#fff', fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
              {isAr
                ? `مرحباً، ${displayName?.split(' ')[0] ?? ''}`
                : `Welcome back, ${displayName?.split(' ')[0] ?? ''}`} 👋
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <Badge
                color="#D4AF37"
                text={
                  <span style={{ color: '#D4AF37', fontWeight: 600 }}>
                    {user?.role === 'EMPLOYEE' ? t('roles.employee') : user?.role}
                  </span>
                }
              />
              <Text style={{ color: 'rgba(255,255,255,0.5)' }}>•</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{dept}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)' }}>•</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>{user?.employeeNumber}</Text>
            </div>
          </Col>
          <Col xs={24} md={10} style={{ textAlign: isAr ? 'left' : 'right' }}>
            <Button
              size="large"
              className="btn-gold"
              icon={<FileAddOutlined />}
              onClick={() => navigate('/employee/submit-leave')}
              style={{ borderRadius: 10, fontWeight: 600, height: 44 }}
            >
              {t('dashboard.submitLeave')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Row 1 — Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={12} lg={6}>
          <StatCard
            title={t('dashboard.sickLeaveBalance')}
            value={`${remainingDays}/${totalDays}`}
            subtitle={`${usedDays} ${t('common.days')} ${t('common.remaining')}`}
            icon={<CalendarOutlined />}
            accentColor="#1890ff"
            extra={
              <Progress
                percent={usedPercent}
                showInfo={false}
                strokeColor="#1890ff"
                trailColor="#e8f4fd"
                size="small"
              />
            }
          />
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <StatCard
            title={t('dashboard.approvedLeaves')}
            value={approved.length}
            subtitle={t('dashboard.thisMonth')}
            icon={<CheckCircleOutlined />}
            accentColor="#52c41a"
          />
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <StatCard
            title={t('dashboard.pendingReview')}
            value={pending.length}
            subtitle={t('dashboard.awaitingDecision')}
            icon={<ClockCircleOutlined />}
            accentColor="#fa8c16"
          />
        </Col>
        <Col xs={24} sm={12} md={12} lg={6}>
          <StatCard
            title={t('dashboard.violations')}
            value={violations.length}
            subtitle={violations.length > 0 ? t('dashboard.beCareful') : t('dashboard.cleanRecord')}
            icon={<WarningOutlined />}
            accentColor={violations.length > 0 ? '#ff4d4f' : '#52c41a'}
          />
        </Col>
      </Row>

      {/* Row 2 — Recent Leaves + Pie Chart */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ fontWeight: 700, color: '#001529' }}>
                {t('dashboard.recentLeaves')}
              </span>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}
            extra={
              <Link to="/employee/my-leaves" style={{ color: '#D4AF37', fontWeight: 500 }}>
                {t('dashboard.viewAllLeaves')}
              </Link>
            }
          >
            {recentLeaves.length > 0 ? (
              <Table
                dataSource={recentLeaves}
                columns={tableColumns}
                rowKey="id"
                pagination={false}
                size="small"
                scroll={{ x: 600 }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#8c8c8c' }}>
                <FileTextOutlined style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }} />
                <div>{t('dashboard.noLeavesYet')}</div>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card
            title={
              <span style={{ fontWeight: 700, color: '#001529' }}>
                {t('dashboard.leaveUsage')}
              </span>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 13, color: '#8c8c8c' }}>
                {isAr
                  ? `${usedDays} من ${totalDays} يوم مستخدم`
                  : `${usedDays} of ${totalDays} days used`}
              </Text>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} ${t('common.days')}`]} />
                <Legend
                  iconSize={10}
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Row 3 — Notifications + Quick Actions */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card
            title={
              <span style={{ fontWeight: 700, color: '#001529' }}>
                <BellOutlined style={{ marginInlineEnd: 8 }} />
                {t('dashboard.notifications')}
              </span>
            }
            extra={
              <Link to="/notifications" style={{ color: '#D4AF37', fontWeight: 500 }}>
                {t('dashboard.viewAllNotifications')}
              </Link>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}
          >
            {recentNotifications.length > 0 ? (
              <List
                dataSource={recentNotifications}
                renderItem={(item: Notification) => (
                  <List.Item style={{ padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background:
                              item.type === 'SUCCESS' ? '#f6ffed' :
                              item.type === 'ERROR' ? '#fff1f0' :
                              item.type === 'WARNING' ? '#fff7e6' : '#e6f7ff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {notifIcon(item)}
                        </div>
                      }
                      title={
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text strong style={{ fontSize: 13 }}>{item.title}</Text>
                          {!item.read && <Badge color="#D4AF37" />}
                        </div>
                      }
                      description={
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>{item.message}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            {timeAgo(item.timestamp, t, isAr)}
                          </Text>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#8c8c8c' }}>
                <BellOutlined style={{ fontSize: 32, opacity: 0.3, marginBottom: 8 }} />
                <div>{t('dashboard.noNotifications')}</div>
              </div>
            )}
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <span style={{ fontWeight: 700, color: '#001529' }}>
                {t('dashboard.quickActions')}
              </span>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}
          >
            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Button
                  block
                  size="large"
                  className="btn-gold"
                  icon={<FileAddOutlined />}
                  onClick={() => navigate('/employee/submit-leave')}
                  style={{ borderRadius: 10, height: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, display: 'block', lineHeight: 1.3 }}>
                    {t('dashboard.submitNewLeave')}
                  </span>
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  block
                  size="large"
                  icon={<FileTextOutlined />}
                  onClick={() => navigate('/employee/my-leaves')}
                  style={{ borderRadius: 10, height: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, borderColor: '#d9d9d9' }}
                >
                  <span style={{ fontSize: 11, display: 'block', lineHeight: 1.3 }}>
                    {t('dashboard.viewMyLeaves')}
                  </span>
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  block
                  size="large"
                  icon={<BookOutlined />}
                  onClick={() => navigate('/rules')}
                  style={{ borderRadius: 10, height: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, borderColor: '#d9d9d9' }}
                >
                  <span style={{ fontSize: 11, display: 'block', lineHeight: 1.3 }}>
                    {t('dashboard.companyRules')}
                  </span>
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  block
                  size="large"
                  icon={<UserOutlined />}
                  onClick={() => navigate('/profile')}
                  style={{ borderRadius: 10, height: 72, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, borderColor: '#d9d9d9' }}
                >
                  <span style={{ fontSize: 11, display: 'block', lineHeight: 1.3 }}>
                    {t('dashboard.myProfile')}
                  </span>
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Row 4 — Upcoming (conditional) */}
      {(examLeaves.length > 0 || docsLeaves.length > 0) && (
        <Card
          title={
            <span style={{ fontWeight: 700, color: '#001529' }}>
              {t('dashboard.upcomingSection')}
            </span>
          }
          style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
        >
          <Row gutter={[16, 16]}>
            {examLeaves.map((leave) => (
              <Col xs={24} md={12} key={leave.id}>
                <Alert
                  type="warning"
                  icon={<MedicineBoxOutlined />}
                  showIcon
                  style={{ borderRadius: 10 }}
                  message={
                    <div>
                      <Text strong style={{ color: '#eb2f96' }}>
                        {t('dashboard.examScheduled')}
                      </Text>
                      <Text style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
                        📅 {isAr
                          ? `${formatDate(leave.examinationDetails!.date)} الساعة ${leave.examinationDetails!.time}`
                          : `Date: ${formatDate(leave.examinationDetails!.date)} at ${leave.examinationDetails!.time}`}
                      </Text>
                      <Text style={{ display: 'block', fontSize: 12, color: '#8c8c8c' }}>
                        📍 {leave.examinationDetails!.location}
                      </Text>
                      <Button
                        size="small"
                        type="link"
                        icon={<RightOutlined />}
                        onClick={() => navigate(`/employee/leave/${leave.id}`)}
                        style={{ color: '#D4AF37', padding: '4px 0', marginTop: 4 }}
                      >
                        {leave.refNumber}
                      </Button>
                    </div>
                  }
                />
              </Col>
            ))}
            {docsLeaves.map((leave) => (
              <Col xs={24} md={12} key={leave.id}>
                <Alert
                  type="info"
                  icon={<FileOutlined />}
                  showIcon
                  style={{ borderRadius: 10 }}
                  message={
                    <div>
                      <Text strong style={{ color: '#722ed1' }}>
                        {t('dashboard.docsNeeded')}
                      </Text>
                      <Text style={{ display: 'block', fontSize: 13, marginTop: 4 }}>
                        {isAr
                          ? `يرجى تحميل المستندات المطلوبة للإجازة ${leave.refNumber}`
                          : `Please upload the requested documents for leave ${leave.refNumber}`}
                      </Text>
                      <Button
                        size="small"
                        type="link"
                        icon={<RightOutlined />}
                        onClick={() => navigate(`/employee/leave/${leave.id}`)}
                        style={{ color: '#D4AF37', padding: '4px 0', marginTop: 4 }}
                      >
                        {leave.refNumber}
                      </Button>
                    </div>
                  }
                />
              </Col>
            ))}
          </Row>
        </Card>
      )}
    </div>
  );
};

export default EmployeeDashboard;
