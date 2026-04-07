import React, { useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Typography,
  Descriptions,
  Progress,
  Table,
  Avatar,
} from 'antd';
import {
  UserOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import { useAuthStore } from '../../store/authStore';
import { mockSickLeaves, mockViolations } from '../../services/mockData';

const { Text, Title } = Typography;

const ROLE_COLORS: Record<string, string> = {
  EMPLOYEE: '#1890ff',
  COMPANY_DOCTOR: '#52c41a',
  HR_MANAGER: '#722ed1',
  HR_OFFICER: '#13c2c2',
};

const AVATAR_BG = ['#001529', '#003a70', '#D4AF37', '#52c41a', '#722ed1'];

const PIE_COLORS = ['#52c41a', '#D4AF37', '#ff4d4f', '#1890ff'];

const ProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuthStore();

  const userLeaves = useMemo(
    () => (user ? mockSickLeaves.filter((l) => l.employeeId === user.id) : []),
    [user]
  );
  const userViolations = useMemo(
    () => (user ? mockViolations.filter((v) => v.employeeId === user.id) : []),
    [user]
  );

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Text type="secondary">{t('profile.notFound')}</Text>
      </div>
    );
  }

  const approved = userLeaves.filter((l) => l.status === 'APPROVED').length;
  const rejected = userLeaves.filter((l) => l.status === 'REJECTED').length;
  const partial = userLeaves.filter((l) => l.status === 'PARTIALLY_APPROVED').length;
  const pending = userLeaves.filter(
    (l) => !['APPROVED', 'REJECTED', 'PARTIALLY_APPROVED'].includes(l.status)
  ).length;

  const pieData = [
    { name: t('statuses.approved'), value: approved },
    { name: t('statuses.partiallyApproved'), value: partial },
    { name: t('statuses.rejected'), value: rejected },
    { name: t('profile.pending'), value: pending },
  ].filter((d) => d.value > 0);

  const used = user.sickLeaveTotal - user.sickLeaveBalance;
  const pct = Math.round((used / user.sickLeaveTotal) * 100);
  const colorIdx = user.id.charCodeAt(user.id.length - 1) % AVATAR_BG.length;

  const roleKey =
    user.role === 'EMPLOYEE' ? 'employee'
    : user.role === 'COMPANY_DOCTOR' ? 'companyDoctor'
    : user.role === 'HR_MANAGER' ? 'hrManager'
    : 'hrOfficer';

  const violationColumns = [
    {
      title: t('penPage.violationNum'),
      dataIndex: 'violationNumber',
      key: 'vnum',
      render: (n: number) => (
        <Tag color={n === 1 ? 'orange' : n === 2 ? 'red' : '#8b0000'}>{n}st</Tag>
      ),
    },
    {
      title: t('penPage.leaveRef'),
      key: 'ref',
      render: (_: unknown, r: typeof userViolations[0]) => (
        <Text style={{ color: '#D4AF37', fontWeight: 600 }}>{r.leave?.refNumber ?? '—'}</Text>
      ),
    },
    {
      title: t('penPage.penaltyType'),
      dataIndex: 'penaltyType',
      key: 'penalty',
    },
    {
      title: t('penPage.appliedDate'),
      dataIndex: 'date',
      key: 'date',
      render: (d: Date) => new Date(d).toLocaleDateString('en-GB'),
    },
  ];

  return (
    <div className="fade-in" style={{ padding: '0 0 32px' }}>
      {/* Hero header */}
      <Card
        style={{
          borderRadius: 16,
          background: 'linear-gradient(135deg, #001529 0%, #003a70 100%)',
          marginBottom: 20,
          boxShadow: '0 4px 20px rgba(0,21,41,0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
          <Avatar
            size={80}
            style={{
              background: AVATAR_BG[colorIdx],
              fontSize: 32,
              fontWeight: 800,
              border: '3px solid #D4AF37',
              flexShrink: 0,
            }}
          >
            {user.nameEn.charAt(0)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Title level={3} style={{ margin: 0, color: '#fff' }}>
              {isAr ? user.nameAr : user.nameEn}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>
              {isAr ? user.nameEn : user.nameAr}
            </Text>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
              <Tag style={{ background: '#D4AF37', border: 'none', color: '#001529', fontWeight: 700 }}>
                {user.employeeNumber}
              </Tag>
              <Tag color={ROLE_COLORS[user.role] ?? 'blue'} style={{ fontWeight: 600 }}>
                {t(`roles.${roleKey}`)}
              </Tag>
              <Tag color="green">{t('empPage.active')}</Tag>
            </div>
            <div style={{ marginTop: 8, color: 'rgba(255,255,255,0.55)', fontSize: 13 }}>
              📧 {user.email} &nbsp;|&nbsp; 📞 {user.phone}
            </div>
          </div>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {/* Personal Info */}
        <Col xs={24} lg={16}>
          <Card
            title={
              <span style={{ color: '#001529', fontWeight: 700 }}>
                <UserOutlined style={{ marginInlineEnd: 8, color: '#D4AF37' }} />
                {t('profile.personalInfo')}
              </span>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 16 }}
          >
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label={t('profile.nameEn')}><Text strong>{user.nameEn}</Text></Descriptions.Item>
              <Descriptions.Item label={t('profile.nameAr')}><Text strong>{user.nameAr}</Text></Descriptions.Item>
              <Descriptions.Item label={t('empPage.empNumber')}><Text style={{ color: '#D4AF37', fontWeight: 600 }}>{user.employeeNumber}</Text></Descriptions.Item>
              <Descriptions.Item label={t('profile.email')}>{user.email}</Descriptions.Item>
              <Descriptions.Item label={t('profile.phone')}>{user.phone}</Descriptions.Item>
              <Descriptions.Item label={t('empPage.department')}>{isAr ? user.department.nameAr : user.department.nameEn}</Descriptions.Item>
              <Descriptions.Item label={t('empPage.jobTitle')}>{user.jobTitle}</Descriptions.Item>
              <Descriptions.Item label={t('empPage.role')}>
                <Tag color={ROLE_COLORS[user.role] ?? 'blue'}>{t(`roles.${roleKey}`)}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('empPage.status')}>
                <Tag color="green">{t('empPage.active')}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Violations */}
          <Card
            title={
              <span style={{ color: '#001529', fontWeight: 700 }}>
                {t('profile.violationsSummary')}
              </span>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}
          >
            {userViolations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <div style={{ marginTop: 8 }}>
                  <Text strong style={{ color: '#52c41a', fontSize: 16 }}>
                    {t('profile.cleanRecord')}
                  </Text>
                  <br />
                  <Text type="secondary">{t('profile.noViolations')}</Text>
                </div>
              </div>
            ) : (
              <Table
                dataSource={userViolations}
                columns={violationColumns}
                rowKey="id"
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          {/* Leave Balance */}
          <Card
            title={
              <span style={{ color: '#001529', fontWeight: 700 }}>
                {t('profile.leaveBalance')}
              </span>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 16 }}
          >
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={pct}
                size={110}
                strokeColor={pct > 70 ? '#ff4d4f' : pct > 40 ? '#fa8c16' : '#52c41a'}
                format={() => (
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#001529' }}>{user.sickLeaveBalance}</div>
                    <div style={{ fontSize: 11, color: '#8c8c8c' }}>{t('profile.remaining')}</div>
                  </div>
                )}
              />
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-around' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#001529' }}>{user.sickLeaveTotal}</div>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t('profile.total')}</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#fa8c16' }}>{used}</div>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t('profile.used')}</Text>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>{user.sickLeaveBalance}</div>
                  <Text type="secondary" style={{ fontSize: 11 }}>{t('profile.remaining')}</Text>
                </div>
              </div>
            </div>
          </Card>

          {/* Leave History */}
          <Card
            title={
              <span style={{ color: '#001529', fontWeight: 700 }}>
                {t('profile.leaveHistorySummary')}
              </span>
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}
          >
            <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
              {[
                { label: t('profile.total'), value: userLeaves.length, color: '#001529' },
                { label: t('statuses.approved'), value: approved, color: '#52c41a' },
                { label: t('statuses.rejected'), value: rejected, color: '#ff4d4f' },
                { label: t('profile.pending'), value: pending, color: '#1890ff' },
              ].map((s) => (
                <Col span={12} key={s.label}>
                  <div
                    style={{
                      textAlign: 'center',
                      background: '#fafafa',
                      borderRadius: 8,
                      padding: '8px 4px',
                      border: `1px solid ${s.color}20`,
                    }}
                  >
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                    <Text type="secondary" style={{ fontSize: 11 }}>{s.label}</Text>
                  </div>
                </Col>
              ))}
            </Row>
            {pieData.length > 0 && (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ProfilePage;
