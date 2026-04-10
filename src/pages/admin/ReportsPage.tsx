import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Typography,
  Tabs,
  DatePicker,
  notification,
  Space,
  Spin,
  message,
} from 'antd';
import {
  BarChartOutlined,
  DownloadOutlined,
  FileExcelOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { leavesAPI, penaltiesAPI, doctorsAPI, facilitiesAPI } from '../../services/api';
import type { Doctor, Facility } from '../../types';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const NAVY = '#001529';
const GOLD = '#D4AF37';
const COLORS = [NAVY, GOLD, '#52c41a', '#ff4d4f', '#fa8c16', '#722ed1', '#13c2c2', '#1890ff'];

const STATUS_COLORS: Record<string, string> = {
  APPROVED: '#52c41a',
  PARTIALLY_APPROVED: '#D4AF37',
  REJECTED: '#ff4d4f',
  PENDING: '#1890ff',
};

const StatCard: React.FC<{ title: string; value: string | number; accentColor?: string }> = ({
  title, value, accentColor = NAVY,
}) => (
  <Card
    size="small"
    style={{
      borderRadius: 10,
      borderTop: `3px solid ${accentColor}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      textAlign: 'center',
    }}
  >
    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{title}</Text>
    <div style={{ fontSize: 22, fontWeight: 800, color: accentColor }}>{value}</div>
  </Card>
);

const ReportsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState('overview');
  const [leaves, setLeaves] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [penalties, setPenalties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      leavesAPI.getAll().then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setLeaves(Array.isArray(d) ? d : []);
      }),
      doctorsAPI.getAll().then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setDoctors(Array.isArray(d) ? d : []);
      }),
      facilitiesAPI.getAll().then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setFacilities(Array.isArray(d) ? d : []);
      }),
      penaltiesAPI.getAll().then((r) => {
        const d = r.data?.data ?? r.data ?? [];
        setPenalties(Array.isArray(d) ? d : []);
      }),
    ])
      .catch(() => message.error('Failed to load report data'))
      .finally(() => setLoading(false));
  }, []);

  const total = leaves.length;
  const approved = leaves.filter((l) => l.status === 'APPROVED').length;
  const partial = leaves.filter((l) => l.status === 'PARTIALLY_APPROVED').length;
  const rejected = leaves.filter((l) => l.status === 'REJECTED').length;
  const pending = total - approved - partial - rejected;
  const avgDays = total > 0 ? (leaves.reduce((s, l) => s + (l.totalDays ?? 0), 0) / total).toFixed(1) : '0.0';
  const totalDaysUsed = leaves
    .filter((l) => l.status === 'APPROVED')
    .reduce((s, l) => s + (l.approvedDays ?? l.totalDays ?? 0), 0);

  const statusChartData = [
    { name: t('statuses.approved'), value: approved, color: STATUS_COLORS.APPROVED },
    { name: t('statuses.partiallyApproved'), value: partial, color: STATUS_COLORS.PARTIALLY_APPROVED },
    { name: t('statuses.rejected'), value: rejected, color: STATUS_COLORS.REJECTED },
    { name: t('rptPage.pending'), value: pending, color: STATUS_COLORS.PENDING },
  ];

  const monthlyData = (() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months.map((month, idx) => ({
      month,
      leaves: leaves.filter((l) => {
        const d = new Date(l.submittedAt ?? l.fromDate ?? '');
        return d.getMonth() === idx;
      }).length,
    }));
  })();

  const deptData = (() => {
    const deptMap = new Map<string, { dept: string; total: number; approved: number; rejected: number }>();
    leaves.forEach((l) => {
      const dept = l.employee?.department;
      if (!dept) return;
      const key = dept.id;
      const name = isAr ? dept.nameAr : dept.nameEn;
      if (!deptMap.has(key)) deptMap.set(key, { dept: name, total: 0, approved: 0, rejected: 0 });
      const entry = deptMap.get(key)!;
      entry.total++;
      if (l.status === 'APPROVED') entry.approved++;
      if (l.status === 'REJECTED') entry.rejected++;
    });
    return Array.from(deptMap.values()).filter((d) => d.total > 0);
  })();

  const deptColumns = [
    { title: t('rptPage.department'), dataIndex: 'dept', key: 'dept' },
    { title: t('rptPage.totalLeaves'), dataIndex: 'total', key: 'total', render: (n: number) => <Text strong>{n}</Text> },
    { title: t('statuses.approved'), dataIndex: 'approved', key: 'approved', render: (n: number) => <Text style={{ color: '#52c41a' }}>{n}</Text> },
    { title: t('statuses.rejected'), dataIndex: 'rejected', key: 'rejected', render: (n: number) => <Text style={{ color: '#ff4d4f' }}>{n}</Text> },
  ];

  const doctorData = doctors.map((d) => {
    const docLeaves = leaves.filter((l) => l.doctor?.id === d.id);
    const appr = docLeaves.filter((l) => l.status === 'APPROVED').length;
    const rej = docLeaves.filter((l) => l.status === 'REJECTED').length;
    return {
      key: d.id,
      name: isAr ? d.nameAr : d.nameEn,
      rank: d.rank,
      issued: d.leavesIssued,
      approvedRate: docLeaves.length ? Math.round((appr / docLeaves.length) * 100) + '%' : '—',
      rejectedRate: docLeaves.length ? Math.round((rej / docLeaves.length) * 100) + '%' : '—',
      trustScore: d.trustScore?.toFixed(2) ?? 'N/A',
    };
  });

  const doctorColumns = [
    { title: t('docPage.doctor'), dataIndex: 'name', key: 'name', render: (n: string) => <Text strong>{n}</Text> },
    { title: t('docPage.rank'), dataIndex: 'rank', key: 'rank', render: (r: string) => <Tag>{r}</Tag> },
    { title: t('rptPage.issued'), dataIndex: 'issued', key: 'issued' },
    { title: t('rptPage.approvedRate'), dataIndex: 'approvedRate', key: 'appr', render: (v: string) => <Text style={{ color: '#52c41a' }}>{v}</Text> },
    { title: t('rptPage.rejectedRate'), dataIndex: 'rejectedRate', key: 'rej', render: (v: string) => <Text style={{ color: '#ff4d4f' }}>{v}</Text> },
    { title: t('docPage.trustScore'), dataIndex: 'trustScore', key: 'ts', render: (v: string) => <Text strong>{v}</Text> },
  ];

  const rankPieData = (['GP', 'RESIDENT', 'SPECIALIST', 'CONSULTANT'] as const).map((rank) => ({
    name: rank,
    value: leaves.filter((l) => l.doctor?.rank === rank).length,
  })).filter((r) => r.value > 0);

  const facilityData = facilities.map((f) => {
    const facLeaves = leaves.filter((l) => l.facility?.id === f.id);
    const appr = facLeaves.filter((l) => l.status === 'APPROVED').length;
    const flagRate = f.trustScore ? Math.round((1 - f.trustScore) * 100) + '%' : '—';
    return {
      key: f.id,
      name: isAr ? f.nameAr : f.nameEn,
      type: f.type,
      leaves: facLeaves.length,
      approvedRate: facLeaves.length ? Math.round((appr / facLeaves.length) * 100) + '%' : '—',
      flagRate,
      trustScore: f.trustScore?.toFixed(2) ?? 'N/A',
      isBlocked: f.isBlocked,
    };
  });

  const facilityColumns = [
    {
      title: t('facPage.facility'), dataIndex: 'name', key: 'name',
      render: (n: string, r: typeof facilityData[0]) => (
        <Text strong style={{ color: r.isBlocked ? '#ff4d4f' : undefined }}>
          {r.isBlocked && '🚫 '}{n}
        </Text>
      ),
    },
    { title: t('rptPage.totalLeaves'), dataIndex: 'leaves', key: 'leaves', render: (n: number) => <Text strong>{n}</Text> },
    { title: t('rptPage.approvedRate'), dataIndex: 'approvedRate', key: 'apr', render: (v: string) => <Text style={{ color: '#52c41a' }}>{v}</Text> },
    { title: t('rptPage.flagRate'), dataIndex: 'flagRate', key: 'flag', render: (v: string) => <Text style={{ color: '#ff4d4f' }}>{v}</Text> },
    { title: t('facPage.trustScore'), dataIndex: 'trustScore', key: 'ts', render: (v: string) => <Text strong>{v}</Text> },
  ];

  const facilityBarData = facilityData
    .sort((a, b) => b.leaves - a.leaves)
    .slice(0, 8)
    .map((f) => ({ name: f.name.substring(0, 14), leaves: f.leaves }));

  const violationsMonthly = (() => {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return months.slice(0, 6).map((month, idx) => {
      const monthPenalties = penalties.filter((p) => {
        const d = new Date(p.date ?? p.createdAt ?? '');
        return d.getMonth() === idx;
      });
      return {
        month,
        violations: monthPenalties.length,
        first:  monthPenalties.filter((p) => p.violationNumber === 1).length,
        second: monthPenalties.filter((p) => p.violationNumber === 2).length,
        third:  monthPenalties.filter((p) => p.violationNumber === 3).length,
      };
    });
  })();

  const totalDeductions = penalties.reduce((s, p) => s + (p.penaltyDays ?? 0), 0);

  const handleExport = (type: 'pdf' | 'excel') => {
    notification.success({
      message: type === 'pdf' ? t('rptPage.pdfExported') : t('rptPage.excelExported'),
      description: t('rptPage.exportDesc'),
    });
  };

  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;

  const tabItems = [
    {
      key: 'overview',
      label: t('rptPage.overview'),
      children: (
        <div>
          <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
            {[
              { title: t('rptPage.totalLeaves'), value: total, color: NAVY },
              { title: t('statuses.approved'), value: approved, color: '#52c41a' },
              { title: t('statuses.partiallyApproved'), value: partial, color: GOLD },
              { title: t('statuses.rejected'), value: rejected, color: '#ff4d4f' },
              { title: t('rptPage.avgDays'), value: avgDays, color: '#1890ff' },
              { title: t('rptPage.totalDaysUsed'), value: totalDaysUsed, color: '#722ed1' },
            ].map((s) => (
              <Col xs={12} sm={8} md={4} key={s.title}>
                <StatCard title={s.title} value={s.value} accentColor={s.color} />
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card size="small" style={{ borderRadius: 10 }}>
                <Text strong style={{ display: 'block', marginBottom: 12, color: NAVY }}>
                  {t('rptPage.leavesByStatus')}
                </Text>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={statusChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {statusChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card size="small" style={{ borderRadius: 10 }}>
                <Text strong style={{ display: 'block', marginBottom: 12, color: NAVY }}>
                  {t('rptPage.monthlyTrend')}
                </Text>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="leaves" stroke={GOLD} strokeWidth={2} dot={{ fill: NAVY, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'department',
      label: t('rptPage.byDepartment'),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card size="small" style={{ borderRadius: 10, marginBottom: 0 }}>
              <Text strong style={{ display: 'block', marginBottom: 12, color: NAVY }}>
                {t('rptPage.leavesByDept')}
              </Text>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deptData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="dept" type="category" width={90} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="approved" name={t('statuses.approved')} fill="#52c41a" radius={[0, 3, 3, 0]} />
                  <Bar dataKey="rejected" name={t('statuses.rejected')} fill="#ff4d4f" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Table
                dataSource={deptData}
                columns={deptColumns}
                rowKey="dept"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'doctor',
      label: t('rptPage.byDoctor'),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Table
                dataSource={doctorData}
                columns={doctorColumns}
                rowKey="key"
                pagination={false}
                size="small"
              />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Text strong style={{ display: 'block', marginBottom: 12, color: NAVY }}>
                {t('rptPage.leavesByRank')}
              </Text>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={rankPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {rankPieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'facility',
      label: t('rptPage.byFacility'),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Table
                dataSource={facilityData}
                columns={facilityColumns}
                rowKey="key"
                pagination={false}
                size="small"
                rowClassName={(r) => (r.isBlocked ? 'row-blocked' : '')}
              />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Text strong style={{ display: 'block', marginBottom: 12, color: NAVY }}>
                {t('rptPage.leavesByFacility')}
              </Text>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={facilityBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="leaves" fill={NAVY} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <style>{`.row-blocked td { background: #fff1f0 !important; }`}</style>
        </Row>
      ),
    },
    {
      key: 'violations',
      label: t('rptPage.violations'),
      children: (
        <div>
          <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            <Col xs={12} sm={8}>
              <StatCard title={t('penPage.totalViolations')} value={penalties.length} accentColor="#ff4d4f" />
            </Col>
            <Col xs={12} sm={8}>
              <StatCard title={t('rptPage.totalDeductions')} value={`${totalDeductions} ${t('penPage.days')}`} accentColor="#fa8c16" />
            </Col>
            <Col xs={12} sm={8}>
              <StatCard title={t('rptPage.unpaidDays')} value={totalDeductions} accentColor="#8b0000" />
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={14}>
              <Card size="small" style={{ borderRadius: 10 }}>
                <Text strong style={{ display: 'block', marginBottom: 12, color: NAVY }}>
                  {t('rptPage.violationsPerMonth')}
                </Text>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={violationsMonthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="first" name={t('penPage.firstViolations')} fill="#fa8c16" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="second" name={t('penPage.secondViolations')} fill="#ff4d4f" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="third" name={t('penPage.thirdViolations')} fill="#8b0000" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={10}>
              <Card size="small" style={{ borderRadius: 10 }}>
                <Table
                  dataSource={violationsMonthly.filter((r) => r.violations > 0)}
                  columns={[
                    { title: t('rptPage.month'), dataIndex: 'month', key: 'month' },
                    { title: t('rptPage.totalViol'), dataIndex: 'violations', key: 'viol', render: (n: number) => <Text strong style={{ color: '#ff4d4f' }}>{n}</Text> },
                    { title: '1st', dataIndex: 'first', key: 'f', render: (n: number) => <Text style={{ color: '#fa8c16' }}>{n}</Text> },
                    { title: '2nd', dataIndex: 'second', key: 's', render: (n: number) => <Text style={{ color: '#ff4d4f' }}>{n}</Text> },
                    { title: '3rd', dataIndex: 'third', key: 't', render: (n: number) => <Text style={{ color: '#8b0000' }}>{n}</Text> },
                  ]}
                  rowKey="month"
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
  ];

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
            <BarChartOutlined style={{ marginInlineEnd: 10, color: '#D4AF37' }} />
            {t('rptPage.title')}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('rptPage.subtitle')}
          </Text>
        </div>
        <Space wrap>
          <RangePicker size="small" style={{ borderRadius: 6 }} />
          <Button
            icon={<DownloadOutlined />}
            onClick={() => handleExport('pdf')}
            style={{ borderColor: '#001529', color: '#001529' }}
          >
            {t('rptPage.exportPdf')}
          </Button>
          <Button
            icon={<FileExcelOutlined />}
            onClick={() => handleExport('excel')}
            style={{ background: '#52c41a', borderColor: '#52c41a', color: '#fff' }}
          >
            {t('rptPage.exportExcel')}
          </Button>
        </Space>
      </div>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabBarStyle={{ marginBottom: 20 }}
        />
      </Card>
    </div>
  );
};

export default ReportsPage;
