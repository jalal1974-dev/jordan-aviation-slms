import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import {
  Row,
  Col,
  Card,
  Button,
  Tag,
  Table,
  Timeline,
  List,
  Progress,
  Statistic,
  Typography,
  Tooltip,
} from 'antd';
import {
  UnorderedListOutlined,
  MedicineBoxOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  AlertFilled,
  WarningFilled,
  InfoCircleFilled,
  LoadingOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { leavesAPI } from '../../services/api';
import type { SickLeave } from '../../types';

const { Title, Text } = Typography;

const NAVY = '#0a1628';
const GOLD = '#D4AF37';

type Priority = 'HIGH' | 'MEDIUM' | 'NORMAL';

const calculatePriority = (leave: SickLeave): Priority => {
  const risk = leave.aiAnalysis?.riskScore ?? 0;
  if (
    leave.facility.isBlocked ||
    (leave.doctor.rank === 'GP' && leave.totalDays > 1) ||
    risk > 70 ||
    leave.totalDays > 4
  )
    return 'HIGH';
  if (
    (leave.doctor.rank === 'SPECIALIST' && leave.totalDays > 2) ||
    leave.documents.length < 2 ||
    risk > 30
  )
    return 'MEDIUM';
  return 'NORMAL';
};

const PENDING_STATUSES: SickLeave['status'][] = [
  'SUBMITTED',
  'PROCESSING',
  'UNDER_REVIEW',
  'EXAMINATION_REQUESTED',
  'DOCS_REQUESTED',
];

const priorityDot = (priority: Priority) => {
  const colors: Record<Priority, string> = {
    HIGH: '#ff4d4f',
    MEDIUM: '#faad14',
    NORMAL: '#52c41a',
  };
  return (
    <span
      style={{
        display: 'inline-block',
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: colors[priority],
      }}
    />
  );
};

const rankTagColor = (rank: string) => {
  if (rank === 'GP' || rank === 'RESIDENT') return 'default';
  if (rank === 'SPECIALIST') return 'blue';
  return 'purple';
};

const statusTagColor = (status: string) => {
  switch (status) {
    case 'SUBMITTED': return 'blue';
    case 'PROCESSING': return 'cyan';
    case 'UNDER_REVIEW': return 'orange';
    case 'EXAMINATION_REQUESTED': return 'magenta';
    case 'DOCS_REQUESTED': return 'purple';
    case 'APPROVED': return 'green';
    case 'PARTIALLY_APPROVED': return 'gold';
    case 'REJECTED': return 'red';
    default: return 'default';
  }
};

const trustStars = (score: number | null) => {
  if (score === null) return <Text type="secondary">—</Text>;
  const stars = Math.round(score * 5);
  return (
    <Text style={{ color: GOLD, fontSize: 13 }}>
      {'★'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </Text>
  );
};

const DoctorDashboard: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';
  const user = useAuthStore((s) => s.user);
  const displayName = user ? (isAr ? user.nameAr : user.nameEn) : '';

  const [allLeaves, setAllLeaves] = React.useState<SickLeave[]>([]);

  React.useEffect(() => {
    leavesAPI.getAll().then((r) => {
      const data: unknown[] = r.data?.data ?? r.data?.leaves ?? r.data ?? [];
      setAllLeaves(Array.isArray(data) ? (data as SickLeave[]) : []);
    }).catch(() => {});
  }, []);

  const pendingLeaves = allLeaves
    .filter((l) => PENDING_STATUSES.includes(l.status))
    .sort((a, b) => {
      const order: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, NORMAL: 2 };
      return order[calculatePriority(a)] - order[calculatePriority(b)];
    });

  const examinationLeaves = allLeaves.filter((l) => l.status === 'EXAMINATION_REQUESTED');
  const approvedCount = allLeaves.filter((l) => l.status === 'APPROVED' || l.status === 'PARTIALLY_APPROVED').length;
  const rejectedCount = allLeaves.filter((l) => l.status === 'REJECTED').length;

  const today = new Date().toLocaleDateString(isAr ? 'ar-JO' : 'en-GB', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const queueColumns: ColumnsType<SickLeave> = [
    {
      title: t('doctorDash.priority'),
      key: 'priority',
      width: 60,
      render: (_, r) => {
        const p = calculatePriority(r);
        const labels: Record<Priority, string> = { HIGH: t('doctorDash.high'), MEDIUM: t('doctorDash.medium'), NORMAL: t('doctorDash.normal') };
        return <Tooltip title={labels[p]}>{priorityDot(p)}</Tooltip>;
      },
    },
    {
      title: t('doctorDash.refNum'),
      dataIndex: 'refNumber',
      key: 'refNumber',
      render: (v, r) => (
        <a style={{ color: GOLD, fontWeight: 600 }} onClick={() => navigate(`/doctor/review/${r.id}`)}>
          {v}
        </a>
      ),
    },
    {
      title: t('doctorDash.employee'),
      key: 'employee',
      render: (_, r) => (
        <div>
          <Text strong>{isAr ? r.employee.nameAr : r.employee.nameEn}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {isAr ? r.employee.department.nameAr : r.employee.department.nameEn}
          </Text>
        </div>
      ),
    },
    {
      title: t('doctorDash.days'),
      dataIndex: 'totalDays',
      key: 'totalDays',
      render: (v) => (
        <Text strong style={{ color: v > 3 ? '#ff4d4f' : 'inherit' }}>
          {v}
        </Text>
      ),
    },
    {
      title: t('doctorDash.doctorRank'),
      key: 'rank',
      render: (_, r) => <Tag color={rankTagColor(r.doctor.rank)}>{t(`doctorRanks.${r.doctor.rank.toLowerCase()}`)}</Tag>,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (v) => (
        <Tag color={statusTagColor(v)} icon={v === 'PROCESSING' ? <LoadingOutlined /> : v === 'EXAMINATION_REQUESTED' ? <MedicineBoxOutlined /> : undefined}>
          {t(`statuses.${v === 'PARTIALLY_APPROVED' ? 'partiallyApproved' : v === 'UNDER_REVIEW' ? 'underReview' : v === 'DOCS_REQUESTED' ? 'docsRequested' : v === 'EXAMINATION_REQUESTED' ? 'examinationRequested' : v.toLowerCase()}`)}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, r) => (
        <Button
          size="small"
          style={{ background: GOLD, borderColor: GOLD, color: '#fff', fontWeight: 600 }}
          onClick={() => navigate(`/doctor/review/${r.id}`)}
        >
          {t('doctorDash.review')}
        </Button>
      ),
    },
  ];

  const statCards = [
    {
      title: t('doctorDash.pendingReview'),
      value: pendingLeaves.length,
      subtitle: t('doctorDash.requiresAttention'),
      color: '#fa8c16',
      icon: <UnorderedListOutlined style={{ fontSize: 28, color: '#fa8c16' }} />,
    },
    {
      title: t('doctorDash.examinationRequests'),
      value: examinationLeaves.length,
      subtitle: t('doctorDash.scheduledExaminations'),
      color: '#eb2f96',
      icon: <MedicineBoxOutlined style={{ fontSize: 28, color: '#eb2f96' }} />,
    },
    {
      title: t('doctorDash.approvedThisMonth'),
      value: approvedCount,
      subtitle: t('doctorDash.plusTwoToday'),
      color: '#52c41a',
      icon: <CheckCircleOutlined style={{ fontSize: 28, color: '#52c41a' }} />,
    },
    {
      title: t('doctorDash.rejectedThisMonth'),
      value: rejectedCount,
      subtitle: t('doctorDash.thisMonth'),
      color: '#ff4d4f',
      icon: <CloseCircleOutlined style={{ fontSize: 28, color: '#ff4d4f' }} />,
    },
  ];

  const recentDecisions = [
    {
      color: 'green',
      icon: '✅',
      text: t('doctorDash.decision1'),
      time: t('doctorDash.twoHoursAgo'),
    },
    {
      color: 'orange',
      icon: '⚠️',
      text: t('doctorDash.decision2'),
      time: t('doctorDash.fiveHoursAgo'),
    },
    {
      color: 'red',
      icon: '❌',
      text: t('doctorDash.decision3'),
      time: t('doctorDash.twoDaysAgo'),
    },
    {
      color: 'green',
      icon: '✅',
      text: t('doctorDash.decision4'),
      time: t('doctorDash.threeDaysAgo'),
    },
    {
      color: 'green',
      icon: '✅',
      text: t('doctorDash.decision5'),
      time: t('doctorDash.oneWeekAgo'),
    },
  ];

  const alerts = [
    {
      icon: <AlertFilled style={{ color: '#ff4d4f' }} />,
      text: t('doctorDash.alert1'),
      badge: t('doctorDash.highRisk'),
      badgeColor: '#ff4d4f',
      path: '/doctor/facilities',
    },
    {
      icon: <AlertFilled style={{ color: '#ff4d4f' }} />,
      text: t('doctorDash.alert2'),
      badge: t('doctorDash.lowTrust'),
      badgeColor: '#ff4d4f',
      path: '/doctor/doctors',
    },
    {
      icon: <WarningFilled style={{ color: '#faad14' }} />,
      text: t('doctorDash.alert3'),
      badge: t('doctorDash.inThreeDays'),
      badgeColor: '#faad14',
      path: `/doctor/review/leave-3`,
    },
    {
      icon: <WarningFilled style={{ color: '#faad14' }} />,
      text: t('doctorDash.alert4'),
      badge: t('doctorDash.urgent'),
      badgeColor: '#faad14',
      path: `/doctor/review/leave-9`,
    },
    {
      icon: <InfoCircleFilled style={{ color: '#1890ff' }} />,
      text: t('doctorDash.alert5'),
      badge: t('doctorDash.new'),
      badgeColor: '#1890ff',
      path: '/doctor/facilities',
    },
    {
      icon: <InfoCircleFilled style={{ color: '#1890ff' }} />,
      text: t('doctorDash.alert6'),
      badge: t('doctorDash.new'),
      badgeColor: '#1890ff',
      path: '/doctor/doctors',
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f6fa', minHeight: '100vh' }}>
      {/* Welcome Banner */}
      <Card
        style={{
          background: `linear-gradient(135deg, ${NAVY} 0%, #1a2f52 60%, #0d1f3c 100%)`,
          borderRadius: 16,
          marginBottom: 24,
          border: 'none',
          overflow: 'hidden',
        }}
        bodyStyle={{ padding: '28px 32px' }}
      >
        <Row align="middle" justify="space-between" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Tag
              style={{
                background: GOLD,
                color: '#fff',
                border: 'none',
                fontWeight: 700,
                fontSize: 12,
                marginBottom: 8,
                padding: '2px 10px',
              }}
            >
              {t('roles.companyDoctor')}
            </Tag>
            <Title level={2} style={{ color: '#fff', margin: 0, fontWeight: 700 }}>
              {isAr
                ? `مرحباً، ${displayName.split(' ')[0]}`
                : `Welcome back, ${displayName.split(' ')[0]}`} 👋
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              {today}
            </Text>
          </Col>
          <Col xs={24} md={8} style={{ textAlign: isAr ? 'left' : 'right' }}>
            <Button
              size="large"
              onClick={() => navigate('/doctor/queue')}
              style={{
                background: GOLD,
                borderColor: GOLD,
                color: '#fff',
                fontWeight: 700,
                borderRadius: 8,
              }}
              icon={<UnorderedListOutlined />}
            >
              {t('doctorDash.reviewQueue')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((s, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card
              style={{ borderRadius: 12, borderTop: `4px solid ${s.color}`, height: '100%' }}
              bodyStyle={{ padding: '20px 24px' }}
            >
              <Row align="middle" justify="space-between">
                <Col>
                  <Statistic
                    title={<Text style={{ fontSize: 13, color: '#666' }}>{s.title}</Text>}
                    value={s.value}
                    valueStyle={{ color: s.color, fontWeight: 700, fontSize: 32 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>{s.subtitle}</Text>
                </Col>
                <Col>{s.icon}</Col>
              </Row>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Queue Preview + Right Panel */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ fontWeight: 700, color: NAVY }}>
                <UnorderedListOutlined style={{ marginInlineEnd: 8, color: GOLD }} />
                {t('doctorDash.queuePreview')}
              </span>
            }
            style={{ borderRadius: 12 }}
            extra={
              <a style={{ color: GOLD, fontWeight: 600 }} onClick={() => navigate('/doctor/queue')}>
                {t('doctorDash.viewFullQueue')} →
              </a>
            }
          >
            <Table
              columns={queueColumns}
              dataSource={pendingLeaves.slice(0, 5)}
              rowKey="id"
              pagination={false}
              size="small"
              scroll={{ x: 700 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* Today's Examinations */}
          <Card
            title={
              <span style={{ fontWeight: 700, color: NAVY }}>
                <MedicineBoxOutlined style={{ marginInlineEnd: 8, color: GOLD }} />
                {t('doctorDash.todaysExaminations')}
              </span>
            }
            style={{ borderRadius: 12, marginBottom: 16 }}
          >
            {examinationLeaves.length > 0 ? (
              <div>
                <Row gutter={[8, 8]}>
                  <Col span={24}>
                    <Text>🕐 {t('doctorDash.examTime')}: <Text strong>10:00 AM</Text></Text>
                  </Col>
                  <Col span={24}>
                    <Text>👤 {t('doctorDash.examEmployee')}: <Text strong>Omar Khalil (JA-1589)</Text></Text>
                  </Col>
                  <Col span={24}>
                    <Text>📋 {t('doctorDash.ref')}: <Text strong style={{ color: GOLD }}>SL-2024-00087</Text></Text>
                  </Col>
                  <Col span={24}>
                    <Text>🏥 {t('doctorDash.examReason')}: <Text>Back Strain — 4 days specialist leave</Text></Text>
                  </Col>
                </Row>
                <Button
                  block
                  style={{ marginTop: 16, background: GOLD, borderColor: GOLD, color: '#fff', fontWeight: 600 }}
                  onClick={() => navigate('/doctor/review/leave-3')}
                >
                  {t('doctorDash.startExamination')}
                </Button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#52c41a' }}>
                <CheckCircleOutlined style={{ fontSize: 32, marginBottom: 8 }} />
                <br />
                <Text>{t('doctorDash.noExaminations')}</Text>
              </div>
            )}
          </Card>

          {/* Monthly Statistics */}
          <Card
            title={
              <span style={{ fontWeight: 700, color: NAVY }}>
                {t('doctorDash.monthlyStats')}
              </span>
            }
            style={{ borderRadius: 12 }}
          >
            {[
              { label: t('statuses.approved'), value: 15, total: 25, color: '#52c41a' },
              { label: t('statuses.partiallyApproved'), value: 3, total: 25, color: '#faad14' },
              { label: t('statuses.rejected'), value: 5, total: 25, color: '#ff4d4f' },
              { label: t('dashboard.pending'), value: 2, total: 25, color: '#1890ff' },
            ].map((item, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <Row justify="space-between">
                  <Text style={{ fontSize: 13 }}>{item.label}</Text>
                  <Text strong style={{ fontSize: 13 }}>{item.value}</Text>
                </Row>
                <Progress
                  percent={Math.round((item.value / item.total) * 100)}
                  strokeColor={item.color}
                  showInfo={false}
                  size="small"
                />
              </div>
            ))}
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('doctorDash.totalReviewed')}: <Text strong>25</Text>
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Recent Decisions + Alerts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <span style={{ fontWeight: 700, color: NAVY }}>
                {t('doctorDash.recentDecisions')}
              </span>
            }
            style={{ borderRadius: 12 }}
          >
            <Timeline
              items={recentDecisions.map((d) => ({
                color: d.color,
                children: (
                  <div>
                    <Text style={{ fontSize: 13 }}>{d.icon} {d.text}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>{d.time}</Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card
            title={
              <span style={{ fontWeight: 700, color: NAVY }}>
                {t('doctorDash.alertsAndFlags')}
              </span>
            }
            style={{ borderRadius: 12 }}
          >
            <List
              dataSource={alerts}
              renderItem={(item) => (
                <List.Item
                  style={{ cursor: 'pointer', padding: '8px 0' }}
                  onClick={() => navigate(item.path)}
                >
                  <List.Item.Meta
                    avatar={item.icon}
                    title={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 13 }}>{item.text}</Text>
                        <Tag
                          style={{
                            background: item.badgeColor,
                            color: '#fff',
                            border: 'none',
                            fontSize: 11,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.badge}
                        </Tag>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Trust Score note for facilities card - inline demo */}
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <Text type="secondary" style={{ fontSize: 11 }}>
          {t('doctorDash.trustScoreKey')}: {trustStars(1)} {t('doctorDash.low')} — {trustStars(0.6)} {t('doctorDash.medium')} — {trustStars(1)} {t('doctorDash.high')}
        </Text>
      </div>
    </div>
  );
};

export default DoctorDashboard;
