import React, { useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Typography,
  Progress,
} from 'antd';
import {
  CalendarOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useAuthStore } from '../../store/authStore';
import { useLeaveStore } from '../../store/leaveStore';

const { Text, Title } = Typography;

const StatCard: React.FC<{ label: string; value: number | string; color?: string; sub?: string }> = ({
  label, value, color = '#001529', sub,
}) => (
  <div
    style={{
      background: '#fafafa',
      border: `1px solid ${color}25`,
      borderRadius: 10,
      padding: '14px 16px',
      textAlign: 'center',
    }}
  >
    <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
    <Text type="secondary" style={{ fontSize: 12 }}>{label}</Text>
    {sub && <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>{sub}</div>}
  </div>
);

const BalancePage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { leaves, loadUserLeaves } = useLeaveStore();

  React.useEffect(() => {
    loadUserLeaves();
  }, [loadUserLeaves]);

  if (!user) return null;

  const approved = leaves.filter((l) => l.status === 'APPROVED');
  const partial = leaves.filter((l) => l.status === 'PARTIALLY_APPROVED');
  const pending = leaves.filter(
    (l) => !['APPROVED', 'REJECTED', 'PARTIALLY_APPROVED'].includes(l.status)
  );

  const usedDays = approved.reduce((s, l) => s + (l.approvedDays ?? l.totalDays), 0);
  const partialDays = partial.reduce((s, l) => s + (l.partialApprovalDetails?.approvedDays ?? 0), 0);
  const pendingDays = pending.reduce((s, l) => s + l.totalDays, 0);
  const remaining = user.sickLeaveBalance;
  const total = user.sickLeaveTotal;

  const donutData = [
    { name: t('balance.usedApproved'), value: usedDays, color: '#52c41a' },
    { name: t('balance.usedPartial'), value: partialDays, color: '#D4AF37' },
    { name: t('balance.pending'), value: pendingDays, color: '#1890ff' },
    { name: t('balance.remaining'), value: remaining > 0 ? remaining : 0, color: '#d9d9d9' },
  ].filter((d) => d.value > 0);

  const monthlyData = [
    { month: 'Jan', days: 0 },
    { month: 'Feb', days: 0 },
    { month: 'Mar', days: 3 },
    { month: 'Apr', days: 0 },
    { month: 'May', days: 0 },
    { month: 'Jun', days: usedDays },
  ];

  const historyColumns = [
    {
      title: t('balance.refNum'),
      dataIndex: 'refNumber',
      key: 'ref',
      render: (ref: string) => <Text style={{ color: '#D4AF37', fontWeight: 600 }}>{ref}</Text>,
    },
    {
      title: t('balance.status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'APPROVED' ? 'green' : s === 'REJECTED' ? 'red' : s === 'PARTIALLY_APPROVED' ? 'gold' : 'blue'}>
          {s}
        </Tag>
      ),
    },
    {
      title: t('balance.days'),
      key: 'days',
      render: (_: unknown, r: typeof leaves[0]) => (
        <Text strong style={{ color: r.status === 'APPROVED' ? '#52c41a' : undefined }}>
          {r.approvedDays ?? r.totalDays}
        </Text>
      ),
    },
    {
      title: t('balance.from'),
      dataIndex: 'fromDate',
      key: 'from',
      render: (d: Date) => new Date(d).toLocaleDateString('en-GB'),
    },
    {
      title: t('balance.to'),
      dataIndex: 'toDate',
      key: 'to',
      render: (d: Date) => new Date(d).toLocaleDateString('en-GB'),
    },
  ];

  return (
    <div className="fade-in" style={{ padding: '0 0 32px' }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, color: '#001529' }}>
          <CalendarOutlined style={{ marginInlineEnd: 10, color: '#D4AF37' }} />
          {t('balance.title')}
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {t('balance.subtitle')}
        </Text>
      </div>

      <Row gutter={[16, 16]}>
        {/* Donut */}
        <Col xs={24} lg={10}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', height: '100%' }}>
            <Text strong style={{ fontSize: 15, color: '#001529', display: 'block', marginBottom: 16 }}>
              {t('balance.usageOverview')}
            </Text>
            <div style={{ textAlign: 'center' }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value">
                    {donutData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  marginTop: 12,
                }}
              >
                <div style={{ background: '#f6ffed', borderRadius: 8, padding: '8px', border: '1px solid #b7eb8f' }}>
                  <Text style={{ color: '#52c41a', fontWeight: 700, fontSize: 11 }}>{t('balance.usedApproved')}</Text>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#52c41a' }}>{usedDays}</div>
                </div>
                <div style={{ background: '#e6f7ff', borderRadius: 8, padding: '8px', border: '1px solid #91d5ff' }}>
                  <Text style={{ color: '#1890ff', fontWeight: 700, fontSize: 11 }}>{t('balance.pending')}</Text>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#1890ff' }}>{pendingDays}</div>
                </div>
                <div style={{ background: '#fffbe6', borderRadius: 8, padding: '8px', border: '1px solid #ffe58f' }}>
                  <Text style={{ color: '#D4AF37', fontWeight: 700, fontSize: 11 }}>{t('balance.usedPartial')}</Text>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#D4AF37' }}>{partialDays}</div>
                </div>
                <div style={{ background: '#f5f5f5', borderRadius: 8, padding: '8px', border: '1px solid #d9d9d9' }}>
                  <Text style={{ color: '#52c41a', fontWeight: 700, fontSize: 11 }}>{t('balance.remaining')}</Text>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#52c41a' }}>{remaining}</div>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* Stats + Progress */}
        <Col xs={24} lg={14}>
          <Card style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', marginBottom: 16 }}>
            <Text strong style={{ fontSize: 15, color: '#001529', display: 'block', marginBottom: 16 }}>
              {t('balance.breakdown')}
            </Text>
            <Row gutter={[12, 12]}>
              <Col xs={12} sm={6}><StatCard label={t('balance.entitlement')} value={total} color="#001529" sub={t('balance.days')} /></Col>
              <Col xs={12} sm={6}><StatCard label={t('balance.usedApproved')} value={usedDays} color="#52c41a" sub={t('balance.days')} /></Col>
              <Col xs={12} sm={6}><StatCard label={t('balance.pending')} value={pendingDays} color="#1890ff" sub={t('balance.days')} /></Col>
              <Col xs={12} sm={6}><StatCard label={t('balance.remaining')} value={remaining} color={remaining < 5 ? '#ff4d4f' : '#52c41a'} sub={t('balance.days')} /></Col>
            </Row>
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 13 }}>{t('balance.usageBar')}</Text>
                <Text style={{ fontSize: 13 }}>{usedDays}/{total} {t('balance.days')}</Text>
              </div>
              <Progress
                percent={Math.round((usedDays / total) * 100)}
                strokeColor={{
                  '0%': '#52c41a',
                  '70%': '#fa8c16',
                  '90%': '#ff4d4f',
                }}
                trailColor="#f0f0f0"
                strokeWidth={12}
                style={{ borderRadius: 6 }}
              />
            </div>

            <div style={{ marginTop: 16, padding: '12px 16px', background: '#f0f5ff', borderRadius: 10, border: '1px solid #adc6ff' }}>
              <Text strong style={{ color: '#2f54eb', fontSize: 13 }}>
                {t('balance.extensionTitle')}
              </Text>
              <div style={{ display: 'flex', gap: 32, marginTop: 8 }}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('balance.extEntitlement')}</Text>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#2f54eb' }}>14</div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('balance.extUsed')}</Text>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#2f54eb' }}>0</div>
                </div>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('balance.extRemaining')}</Text>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#52c41a' }}>14</div>
                </div>
              </div>
            </div>
          </Card>

          <Card style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
            <Text strong style={{ fontSize: 14, color: '#001529', display: 'block', marginBottom: 12 }}>
              {t('balance.monthlyUsage')}
            </Text>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="days" fill="#001529" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Leave history table */}
        <Col span={24}>
          <Card
            title={<Text strong style={{ color: '#001529' }}>{t('balance.leaveHistory')}</Text>}
            style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}
          >
            <Table
              dataSource={leaves}
              columns={historyColumns}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BalancePage;
