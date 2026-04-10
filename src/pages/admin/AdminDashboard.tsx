import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Typography,
  Tag,
  Table,
  Badge,
  Timeline,
  Progress,
  Tabs,
  Button,
  Divider,
  notification,
  Statistic,
} from 'antd';
import {
  TeamOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
  WarningOutlined,
  AlertFilled,
  SendOutlined,
  MailOutlined,
  StopOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import type { SickLeave } from '../../types';
import { mockSickLeaves } from '../../services/mockData';
import SendResultModal from '../../components/admin/SendResultModal';

const { Text } = Typography;

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const StatCard: React.FC<{
  title: string;
  value: React.ReactNode;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
}> = ({ title, value, subtitle, icon, accentColor }) => (
  <Card
    style={{
      borderRadius: 12,
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      borderTop: `4px solid ${accentColor}`,
      height: '100%',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <Text
          type="secondary"
          style={{ fontSize: 12, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          {title}
        </Text>
        <div style={{ fontSize: 32, fontWeight: 800, color: accentColor, lineHeight: 1.2, marginTop: 4 }}>
          {value}
        </div>
        <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
          {subtitle}
        </Text>
      </div>
      <div style={{ fontSize: 36, color: accentColor, opacity: 0.15, lineHeight: 1 }}>{icon}</div>
    </div>
  </Card>
);

const deptData = [
  { dept: 'Flight Ops', leaves: 8 },
  { dept: 'Cabin Crew', leaves: 6 },
  { dept: 'Engineering', leaves: 5 },
  { dept: 'Ground', leaves: 4 },
  { dept: 'Commercial', leaves: 3 },
  { dept: 'Others', leaves: 4 },
];

const monthlyData = [
  { month: 'Jan', leaves: 5 },
  { month: 'Feb', leaves: 8 },
  { month: 'Mar', leaves: 12 },
  { month: 'Apr', leaves: 6 },
  { month: 'May', leaves: 9 },
  { month: 'Jun', leaves: 10 },
];

const recentActivity = [
  { color: 'green', text: "Dr. Jalal approved Ahmed's leave (SL-2024-00089)", time: '2h ago' },
  { color: 'orange', text: "Dr. Jalal partially approved Fatima's leave (SL-2024-00088)", time: '5h ago' },
  { color: 'blue', text: 'Result email sent to Ahmed for SL-2024-00086', time: '1 day ago' },
  { color: 'red', text: 'Penalty applied: Ahmed — 1st violation (SL-2024-00084)', time: '2 days ago' },
  { color: 'red', text: "Dr. Jalal rejected Ahmed's leave (SL-2024-00084)", time: '2 days ago' },
  { color: 'cyan', text: 'Sara submitted new leave (SL-2024-00080)', time: '3 days ago' },
  { color: 'purple', text: 'New circular published: Updated sick leave policy', time: '1 week ago' },
  { color: 'purple', text: "Omar's documents requested (SL-2024-00081)", time: '1 week ago' },
];

const pendingExamEmails = [
  {
    key: 'exam-1',
    ref: 'SL-2024-00087',
    employee: 'Omar Khalil',
    examDate: 'Jun 22, 2024',
    examTime: '10:00 AM',
    location: 'Company Clinic',
  },
];

const blacklistRecs = [
  {
    key: 'bl-1',
    type: 'facility',
    name: 'Night Care Center',
    recommendedBy: 'Dr. Jalal',
    reason: '24h center, 10 flagged leaves out of 15',
  },
];

const AdminDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const user = useAuthStore((s) => s.user);
  const displayName = user ? (isAr ? user.nameAr : user.nameEn) : '';
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<SickLeave | null>(null);
  const [sentLeaves, setSentLeaves] = useState<Set<string>>(new Set());

  const today = new Date().toLocaleDateString(isAr ? 'ar-JO' : 'en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const pendingResultLeaves = mockSickLeaves.filter(
    (l) =>
      (l.companyDoctorDecision === 'APPROVED' ||
        l.companyDoctorDecision === 'PARTIALLY_APPROVED' ||
        l.companyDoctorDecision === 'REJECTED') &&
      !sentLeaves.has(l.id)
  );

  const openModal = (leave: SickLeave) => {
    setSelectedLeave(leave);
    setModalVisible(true);
  };

  const handleSent = (leaveId: string) => {
    setSentLeaves((prev) => new Set([...prev, leaveId]));
  };

  const handleExecuteBlacklist = () => {
    notification.success({
      message: t('adminDash.blacklistExecuted'),
      description: 'Night Care Center has been blacklisted.',
    });
  };

  const resultEmailColumns = [
    {
      title: t('adminDash.refNum'),
      dataIndex: 'refNumber',
      key: 'ref',
      render: (ref: string) => <Text style={{ color: '#D4AF37', fontWeight: 600 }}>{ref}</Text>,
    },
    {
      title: t('adminDash.employee'),
      key: 'employee',
      render: (_: unknown, r: SickLeave) => (isAr ? r.employee.nameAr : r.employee.nameEn),
    },
    {
      title: t('adminDash.doctorDecision'),
      dataIndex: 'companyDoctorDecision',
      key: 'decision',
      render: (d: string) => (
        <Tag color={d === 'APPROVED' ? 'green' : d === 'PARTIALLY_APPROVED' ? 'gold' : 'red'}>
          {d === 'APPROVED'
            ? t('statuses.approved')
            : d === 'PARTIALLY_APPROVED'
            ? t('statuses.partiallyApproved')
            : t('statuses.rejected')}
        </Tag>
      ),
    },
    {
      title: t('adminDash.decisionDate'),
      key: 'date',
      render: (_: unknown, r: SickLeave) => formatDate(r.toDate),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, r: SickLeave) => (
        <Button
          size="small"
          icon={<SendOutlined />}
          style={{ background: '#D4AF37', borderColor: '#D4AF37', color: '#fff', fontWeight: 600 }}
          onClick={() => openModal(r)}
        >
          {t('adminDash.sendResult')}
        </Button>
      ),
    },
  ];

  const examEmailColumns = [
    {
      title: t('adminDash.refNum'),
      dataIndex: 'ref',
      key: 'ref',
      render: (ref: string) => <Text style={{ color: '#D4AF37', fontWeight: 600 }}>{ref}</Text>,
    },
    { title: t('adminDash.employee'), dataIndex: 'employee', key: 'employee' },
    { title: t('adminDash.examDate'), dataIndex: 'examDate', key: 'examDate' },
    { title: t('adminDash.examTime'), dataIndex: 'examTime', key: 'examTime' },
    { title: t('adminDash.location'), dataIndex: 'location', key: 'location' },
    {
      title: t('common.actions'),
      key: 'actions',
      render: () => (
        <Button size="small" type="primary" icon={<MailOutlined />}>
          {t('adminDash.sendExamEmail')}
        </Button>
      ),
    },
  ];

  const blacklistColumns = [
    {
      title: t('adminDash.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'facility' ? 'purple' : 'blue'}>
          {type === 'facility' ? t('adminDash.facility') : t('adminDash.doctor')}
        </Tag>
      ),
    },
    { title: t('adminDash.name'), dataIndex: 'name', key: 'name', render: (n: string) => <Text strong>{n}</Text> },
    { title: t('adminDash.recommendedBy'), dataIndex: 'recommendedBy', key: 'by' },
    {
      title: t('adminDash.reason'),
      dataIndex: 'reason',
      key: 'reason',
      render: (r: string) => (
        <Text ellipsis style={{ maxWidth: 200, display: 'block' }} title={r}>
          {r}
        </Text>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: () => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            size="small"
            danger
            icon={<StopOutlined />}
            onClick={handleExecuteBlacklist}
          >
            {t('adminDash.executeBlacklist')}
          </Button>
          <Button size="small">{t('adminDash.dismiss')}</Button>
        </div>
      ),
    },
  ];

  const tabItems = [
    {
      key: '1',
      label: (
        <Badge count={pendingResultLeaves.length} size="small" offset={[4, 0]}>
          <span>{t('adminDash.pendingResultEmails')}</span>
        </Badge>
      ),
      children: (
        <Table
          dataSource={pendingResultLeaves}
          columns={resultEmailColumns}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 600 }}
        />
      ),
    },
    {
      key: '2',
      label: (
        <Badge count={pendingExamEmails.length} size="small" offset={[4, 0]}>
          <span>{t('adminDash.pendingExamEmails')}</span>
        </Badge>
      ),
      children: (
        <Table
          dataSource={pendingExamEmails}
          columns={examEmailColumns}
          rowKey="key"
          pagination={false}
          size="small"
          scroll={{ x: 500 }}
        />
      ),
    },
    {
      key: '3',
      label: (
        <Badge count={blacklistRecs.length} size="small" offset={[4, 0]}>
          <span>{t('adminDash.blacklistRecs')}</span>
        </Badge>
      ),
      children: (
        <Table
          dataSource={blacklistRecs}
          columns={blacklistColumns}
          rowKey="key"
          pagination={false}
          size="small"
          scroll={{ x: 600 }}
        />
      ),
    },
  ];

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
          <Col xs={24} md={16}>
            <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, display: 'block', marginBottom: 4 }}>
              {today}
            </Text>
            <div style={{ color: '#fff', fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
              {isAr
                ? `مرحباً، ${displayName.split(' ')[0]}`
                : `Welcome back, ${displayName.split(' ')[0]}`} 👋
            </div>
            <Badge
              color="#D4AF37"
              text={
                <span style={{ color: '#D4AF37', fontWeight: 600, fontSize: 13 }}>
                  {t('roles.hrManager')}
                </span>
              }
            />
          </Col>
          <Col xs={24} md={8} style={{ textAlign: isAr ? 'left' : 'right' }}>
            <Button
              size="large"
              icon={<DownloadOutlined />}
              style={{ borderRadius: 10, fontWeight: 600, height: 44, color: '#D4AF37', borderColor: '#D4AF37' }}
            >
              {t('adminDash.exportReport')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Row 1 - Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title={t('adminDash.totalEmployees')}
            value={<Statistic value={2000} valueStyle={{ color: '#1890ff', fontWeight: 800, fontSize: 32 }} />}
            subtitle={t('adminDash.activeWorkforce')}
            icon={<TeamOutlined />}
            accentColor="#1890ff"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title={t('adminDash.pendingActions')}
            value={<Statistic value={pendingResultLeaves.length} valueStyle={{ color: '#fa8c16', fontWeight: 800, fontSize: 32 }} />}
            subtitle={t('adminDash.requiresAttention')}
            icon={<ExclamationCircleOutlined />}
            accentColor="#fa8c16"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title={t('adminDash.leavesThisMonth')}
            value={<Statistic value={10} valueStyle={{ color: '#52c41a', fontWeight: 800, fontSize: 32 }} />}
            subtitle={t('adminDash.submitted')}
            icon={<FileTextOutlined />}
            accentColor="#52c41a"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title={t('adminDash.activePenalties')}
            value={<Statistic value={2} valueStyle={{ color: '#ff4d4f', fontWeight: 800, fontSize: 32 }} />}
            subtitle={t('adminDash.penaltiesApplied')}
            icon={<WarningOutlined />}
            accentColor="#ff4d4f"
          />
        </Col>
      </Row>

      {/* Row 2 - Needs Your Action */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 24,
          border: '2px solid #ff4d4f',
          boxShadow: '0 2px 16px rgba(255,77,79,0.12)',
        }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertFilled style={{ color: '#ff4d4f', fontSize: 18 }} />
            <span style={{ fontWeight: 700, color: '#ff4d4f', fontSize: 16 }}>
              {t('adminDash.needsAction')}
            </span>
          </div>
        }
      >
        <Tabs items={tabItems} />
      </Card>

      {/* Row 3 - Activity + System Overview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontWeight: 700, color: '#001529' }}>
                {t('adminDash.recentActivity')}
              </span>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}
          >
            <Timeline
              items={recentActivity.map((a) => ({
                color: a.color,
                children: (
                  <div>
                    <Text style={{ fontSize: 13 }}>{a.text}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>{a.time}</Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontWeight: 700, color: '#001529' }}>
                {t('adminDash.systemOverview')}
              </span>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', height: '100%' }}
          >
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 13 }}>{t('statuses.approved')}</Text>
                <Text strong style={{ color: '#52c41a' }}>45</Text>
              </div>
              <Progress percent={60} showInfo={false} strokeColor="#52c41a" size="small" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 13 }}>{t('statuses.partiallyApproved')}</Text>
                <Text strong style={{ color: '#fa8c16' }}>8</Text>
              </div>
              <Progress percent={10} showInfo={false} strokeColor="#fa8c16" size="small" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 13 }}>{t('statuses.rejected')}</Text>
                <Text strong style={{ color: '#ff4d4f' }}>12</Text>
              </div>
              <Progress percent={16} showInfo={false} strokeColor="#ff4d4f" size="small" />
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 13 }}>{t('adminDash.pending')}</Text>
                <Text strong style={{ color: '#1890ff' }}>10</Text>
              </div>
              <Progress percent={14} showInfo={false} strokeColor="#1890ff" size="small" />
            </div>

            <Divider style={{ margin: '12px 0' }} />

            <div style={{ marginBottom: 12 }}>
              <Text strong style={{ fontSize: 13, color: '#001529' }}>
                {t('adminDash.topFlaggedFacilities')}
              </Text>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: '🚫', name: 'Night Care Center', flags: 10, color: '#ff4d4f' },
                  { icon: '🚫', name: 'Al-Shifa 24h Center', flags: 8, color: '#ff4d4f' },
                  { icon: '⚠️', name: 'Zarqa Health Center', flags: 2, color: '#fa8c16' },
                ].map((f) => (
                  <div key={f.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13 }}>{f.icon} {f.name}</Text>
                    <Tag color={f.color === '#ff4d4f' ? 'red' : 'orange'}>{f.flags} flags</Tag>
                  </div>
                ))}
              </div>
            </div>

            <Divider style={{ margin: '10px 0' }} />

            <div>
              <Text strong style={{ fontSize: 13, color: '#001529' }}>
                {t('adminDash.topFlaggedDoctors')}
              </Text>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { icon: '🚨', name: 'Dr. Unknown Night Center', flags: 10, trust: '0.30', color: 'red' },
                  { icon: '⚠️', name: 'Dr. Noor Ibrahim', flags: 3, trust: '0.75', color: 'orange' },
                ].map((d) => (
                  <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 13 }}>{d.icon} {d.name}</Text>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <Tag color={d.color}>{d.flags} flags</Tag>
                      <Tag>Trust {d.trust}</Tag>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 4 - Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontWeight: 700, color: '#001529' }}>
                {t('adminDash.leavesByDept')}
              </span>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
          >
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="dept" tick={{ fontSize: 12 }} width={80} />
                <Tooltip />
                <Bar dataKey="leaves" fill="#003a70" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={
              <span style={{ fontWeight: 700, color: '#001529' }}>
                {t('adminDash.monthlyTrend')}
              </span>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
          >
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="leaves"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  dot={{ fill: '#D4AF37', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <SendResultModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        leave={selectedLeave}
        onSent={handleSent}
      />
    </div>
  );
};

export default AdminDashboard;
