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
import type { SickLeave, Doctor, Facility } from '../../types';

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

  const total = mockSickLeaves.length;
  const approved = mockSickLeaves.filter((l) => l.status === 'APPROVED').length;
  const partial = mockSickLeaves.filter((l) => l.status === 'PARTIALLY_APPROVED').length;
  const rejected = mockSickLeaves.filter((l) => l.status === 'REJECTED').length;
  const pending = total - approved - partial - rejected;
  const avgDays = (mockSickLeaves.reduce((s, l) => s + l.totalDays, 0) / total).toFixed(1);
  const totalDaysUsed = mockSickLeaves.filter((l) => l.status === 'APPROVED').reduce((s, l) => s + (l.approvedDays ?? l.totalDays), 0);

  const statusChartData = [
    { name: t('statuses.approved'), value: approved, color: STATUS_COLORS.APPROVED },
    { name: t('statuses.partiallyApproved'), value: partial, color: STATUS_COLORS.PARTIALLY_APPROVED },
    { name: t('statuses.rejected'), value: rejected, color: STATUS_COLORS.REJECTED },
    { name: t('rptPage.pending'), value: pending, color: STATUS_COLORS.PENDING },
  ];

  const monthlyData = [
    { month: 'Jan', leaves: 3 },
    { month: 'Feb', leaves: 2 },
    { month: 'Mar', leaves: 5 },
    { month: 'Apr', leaves: 4 },
    { month: 'May', leaves: 3 },
    { month: 'Jun', leaves: 2 },
    { month: 'Jul', leaves: 6 },
    { month: 'Aug', leaves: 4 },
    { month: 'Sep', leaves: 3 },
    { month: 'Oct', leaves: 5 },
    { month: 'Nov', leaves: 4 },
    { month: 'Dec', leaves: total },
  ];

  const deptData = mockDepartments.map((d) => {
    const leaves = mockSickLeaves.filter((l) => l.employee.department.id === d.id);
    return {
      dept: isAr ? d.nameAr : d.nameEn,
      total: leaves.length,
      approved: leaves.filter((l) => l.status === 'APPROVED').length,
      rejected: leaves.filter((l) => l.status === 'REJECTED').length,
    };
  }).filter((d) => d.total > 0);

  const deptColumns = [
    { title: t('rptPage.department'), dataIndex: 'dept', key: 'dept' },
    { title: t('rptPage.totalLeaves'), dataIndex: 'total', key: 'total', render: (n: number) => <Text strong>{n}</Text> },
    { title: t('statuses.approved'), dataIndex: 'approved', key: 'approved', render: (n: number) => <Text style={{ color: '#52c41a' }}>{n}</Text> },
    { title: t('statuses.rejected'), dataIndex: 'rejected', key: 'rejected', render: (n: number) => <Text style={{ color: '#ff4d4f' }}>{n}</Text> },
  ];

  const doctorData = mockDoctors.map((d) => {
    const leaves = mockSickLeaves.filter((l) => l.doctor.id === d.id);
    const appr = leaves.filter((l) => l.status === 'APPROVED').length;
    const rej = leaves.filter((l) => l.status === 'REJECTED').length;
    return {
      key: d.id,
      name: isAr ? d.nameAr : d.nameEn,
      rank: d.rank,
      issued: d.leavesIssued,
      approvedRate: leaves.length ? Math.round((appr / leaves.length) * 100) + '%' : '—',
      rejectedRate: leaves.length ? Math.round((rej / leaves.length) * 100) + '%' : '—',
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
    value: mockSickLeaves.filter((l) => l.doctor.rank === rank).length,
  })).filter((r) => r.value > 0);

  const facilityData = mockFacilities.map((f) => {
    const leaves = mockSickLeaves.filter((l) => l.facility.id === f.id);
    const appr = leaves.filter((l) => l.status === 'APPROVED').length;
    const flagRate = f.trustScore ? Math.round((1 - f.trustScore) * 100) + '%' : '—';
    return {
      key: f.id,
      name: isAr ? f.nameAr : f.nameEn,
      type: f.type,
      leaves: leaves.length,
      approvedRate: leaves.length ? Math.round((appr / leaves.length) * 100) + '%' : '—',
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

  const violationsMonthly = [
    { month: 'Jan', violations: 0, first: 0, second: 0, third: 0 },
    { month: 'Feb', violations: 0, first: 0, second: 0, third: 0 },
    { month: 'Mar', violations: mockViolations.length, first: mockViolations.filter((v) => v.violationNumber === 1).length, second: 0, third: 0 },
    { month: 'Apr', violations: 0, first: 0, second: 0, third: 0 },
    { month: 'May', violations: 0, first: 0, second: 0, third: 0 },
    { month: 'Jun', violations: 0, first: 0, second: 0, third: 0 },
  ];

  const totalDeductions = mockViolations.reduce((s, v) => s + (v.penaltyDays ?? 0), 0);

  const handleExport = (type: 'pdf' | 'excel') => {
    notification.success({
      message: type === 'pdf' ? t('rptPage.pdfExported') : t('rptPage.excelExported'),
      description: t('rptPage.exportDesc'),
    });
  };

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
              <StatCard title={t('penPage.totalViolations')} value={mockViolations.length} accentColor="#ff4d4f" />
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
