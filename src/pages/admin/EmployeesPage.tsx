import React, { useState, useMemo, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Typography,
  Progress,
  Badge,
  Avatar,
  notification,
  Space,
} from 'antd';
import {
  TeamOutlined,
  SearchOutlined,
  ClearOutlined,
  UserOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { employeesAPI, leavesAPI, penaltiesAPI } from '../../services/api';
import type { User, SickLeave, Violation } from '../../types';

const { Text, Title } = Typography;
const { Option } = Select;

const ROLE_COLORS: Record<string, string> = {
  EMPLOYEE: 'blue',
  COMPANY_DOCTOR: 'green',
  HR_MANAGER: 'purple',
  HR_OFFICER: 'cyan',
};

const AVATAR_COLORS = [
  '#001529', '#003a70', '#D4AF37', '#52c41a', '#fa8c16',
  '#eb2f96', '#722ed1', '#13c2c2',
];

const StatCard: React.FC<{
  title: string;
  value: number;
  accentColor: string;
  icon?: React.ReactNode;
}> = ({ title, value, accentColor, icon }) => (
  <Card
    size="small"
    style={{
      borderRadius: 10,
      borderTop: `3px solid ${accentColor}`,
      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>{title}</Text>
        <div style={{ fontSize: 26, fontWeight: 800, color: accentColor }}>{value}</div>
      </div>
      <div style={{ fontSize: 28, color: accentColor, opacity: 0.15 }}>{icon}</div>
    </div>
  </Card>
);

const EmployeesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const filtered = useMemo(() => {
    return mockUsers.filter((u) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !u.nameEn.toLowerCase().includes(q) &&
          !u.nameAr.includes(q) &&
          !u.email.toLowerCase().includes(q) &&
          !u.employeeNumber.toLowerCase().includes(q)
        )
          return false;
      }
      if (filterDept && u.department.id !== filterDept) return false;
      if (filterRole && u.role !== filterRole) return false;
      return true;
    });
  }, [search, filterDept, filterRole]);

  const onLeaveCount = useMemo(
    () =>
      mockUsers.filter((u) =>
        mockSickLeaves.some(
          (l) =>
            l.employeeId === u.id &&
            ['SUBMITTED', 'PROCESSING', 'UNDER_REVIEW', 'EXAMINATION_REQUESTED', 'DOCS_REQUESTED'].includes(l.status)
        )
      ).length,
    []
  );

  const withViolations = useMemo(
    () => new Set(mockViolations.map((v) => v.employeeId)).size,
    []
  );

  const getEmployeeViolations = (userId: string) =>
    mockViolations.filter((v) => v.employeeId === userId);

  const getEmployeeLeaves = (userId: string) =>
    mockSickLeaves.filter((l) => l.employeeId === userId);

  const expandedRowRender = (record: User) => {
    const leaves = getEmployeeLeaves(record.id);
    const violations = getEmployeeViolations(record.id);
    const approved = leaves.filter((l) => l.status === 'APPROVED').length;
    const rejected = leaves.filter((l) => l.status === 'REJECTED').length;
    const pending = leaves.filter(
      (l) => !['APPROVED', 'REJECTED', 'PARTIALLY_APPROVED'].includes(l.status)
    ).length;
    const lastLeave = leaves.sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    )[0];

    return (
      <div style={{ padding: '8px 24px', background: '#fafafa', borderRadius: 8 }}>
        <Row gutter={[24, 12]}>
          <Col xs={24} md={8}>
            <Text strong style={{ fontSize: 13, color: '#001529', display: 'block', marginBottom: 6 }}>
              {t('empPage.contactInfo')}
            </Text>
            <div style={{ fontSize: 13, color: '#595959' }}>
              📧 {record.email}
            </div>
            <div style={{ fontSize: 13, color: '#595959', marginTop: 4 }}>
              📞 {record.phone}
            </div>
          </Col>
          <Col xs={24} md={8}>
            <Text strong style={{ fontSize: 13, color: '#001529', display: 'block', marginBottom: 6 }}>
              {t('empPage.leaveSummary')}
            </Text>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag color="default">{t('empPage.total')}: {leaves.length}</Tag>
              <Tag color="green">{t('statuses.approved')}: {approved}</Tag>
              <Tag color="red">{t('statuses.rejected')}: {rejected}</Tag>
              <Tag color="orange">{t('empPage.pending')}: {pending}</Tag>
            </div>
            {lastLeave && (
              <div style={{ marginTop: 6, fontSize: 12, color: '#8c8c8c' }}>
                {t('empPage.lastLeave')}: {lastLeave.refNumber} —{' '}
                <Tag color="blue" style={{ fontSize: 10 }}>{lastLeave.status}</Tag>
              </div>
            )}
          </Col>
          <Col xs={24} md={8}>
            <Text strong style={{ fontSize: 13, color: '#001529', display: 'block', marginBottom: 6 }}>
              {t('empPage.violationHistory')}
            </Text>
            {violations.length === 0 ? (
              <Tag color="green">✓ {t('empPage.noViolations')}</Tag>
            ) : (
              violations.map((v) => (
                <div key={v.id} style={{ fontSize: 12, color: '#ff4d4f', marginBottom: 4 }}>
                  • {v.violationType} — {new Date(v.date).toLocaleDateString()}
                </div>
              ))
            )}
          </Col>
        </Row>
      </div>
    );
  };

  const columns = [
    {
      title: t('empPage.employee'),
      key: 'name',
      sorter: (a: User, b: User) => a.nameEn.localeCompare(b.nameEn),
      render: (_: unknown, r: User) => {
        const initials = r.nameEn.charAt(0).toUpperCase();
        const colorIdx = r.id.charCodeAt(r.id.length - 1) % AVATAR_COLORS.length;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar
              size={36}
              style={{ background: AVATAR_COLORS[colorIdx], fontWeight: 700, flexShrink: 0 }}
            >
              {initials}
            </Avatar>
            <div>
              <Text strong style={{ fontSize: 13 }}>{r.nameEn}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: 11 }}>{r.nameAr}</Text>
            </div>
          </div>
        );
      },
    },
    {
      title: t('empPage.empNumber'),
      dataIndex: 'employeeNumber',
      key: 'number',
      sorter: (a: User, b: User) => a.employeeNumber.localeCompare(b.employeeNumber),
      render: (n: string) => <Text style={{ color: '#D4AF37', fontWeight: 600, fontSize: 13 }}>{n}</Text>,
    },
    {
      title: t('empPage.department'),
      key: 'dept',
      sorter: (a: User, b: User) => a.department.nameEn.localeCompare(b.department.nameEn),
      render: (_: unknown, r: User) => (
        <Text style={{ fontSize: 12 }}>{isAr ? r.department.nameAr : r.department.nameEn}</Text>
      ),
    },
    {
      title: t('empPage.jobTitle'),
      dataIndex: 'jobTitle',
      key: 'job',
      render: (j: string) => <Text style={{ fontSize: 12 }}>{j}</Text>,
    },
    {
      title: t('empPage.role'),
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={ROLE_COLORS[role] ?? 'default'} style={{ fontSize: 11 }}>
          {t(`roles.${role === 'EMPLOYEE' ? 'employee' : role === 'COMPANY_DOCTOR' ? 'companyDoctor' : role === 'HR_MANAGER' ? 'hrManager' : 'hrOfficer'}`)}
        </Tag>
      ),
    },
    {
      title: t('empPage.leaveBalance'),
      key: 'balance',
      sorter: (a: User, b: User) => a.sickLeaveBalance - b.sickLeaveBalance,
      render: (_: unknown, r: User) => {
        const used = r.sickLeaveTotal - r.sickLeaveBalance;
        const pct = Math.round((used / r.sickLeaveTotal) * 100);
        return (
          <div style={{ minWidth: 80 }}>
            <Text style={{ fontSize: 12, fontWeight: 600 }}>
              {r.sickLeaveBalance}/{r.sickLeaveTotal}
            </Text>
            <Progress
              percent={pct}
              showInfo={false}
              size="small"
              strokeColor={pct > 70 ? '#ff4d4f' : pct > 40 ? '#fa8c16' : '#52c41a'}
              trailColor="#f0f0f0"
            />
          </div>
        );
      },
    },
    {
      title: t('empPage.violations'),
      key: 'violations',
      sorter: (a: User, b: User) =>
        getEmployeeViolations(a.id).length - getEmployeeViolations(b.id).length,
      render: (_: unknown, r: User) => {
        const count = getEmployeeViolations(r.id).length;
        return (
          <Badge
            count={count}
            showZero
            style={{ background: count === 0 ? '#52c41a' : '#ff4d4f' }}
          />
        );
      },
    },
    {
      title: t('empPage.status'),
      key: 'status',
      render: () => <Tag color="green">{t('empPage.active')}</Tag>,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: () => (
        <Space size={4}>
          <Button size="small" icon={<UserOutlined />}>
            {t('empPage.viewProfile')}
          </Button>
          <Button size="small" icon={<FileTextOutlined />}>
            {t('empPage.viewLeaves')}
          </Button>
        </Space>
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
            <TeamOutlined style={{ marginInlineEnd: 10, color: '#D4AF37' }} />
            {t('empPage.title')}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('empPage.subtitle')}
          </Text>
        </div>
        <Button
          icon={<PlusOutlined />}
          style={{ background: '#D4AF37', borderColor: '#D4AF37', color: '#fff', fontWeight: 600 }}
          onClick={() => notification.info({ message: t('empPage.comingSoon') })}
        >
          {t('empPage.addEmployee')}
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <StatCard title={t('empPage.totalEmployees')} value={mockUsers.length} accentColor="#1890ff" icon={<TeamOutlined />} />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title={t('empPage.active')} value={mockUsers.length} accentColor="#52c41a" icon={<UserOutlined />} />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title={t('empPage.onLeave')} value={onLeaveCount} accentColor="#fa8c16" icon={<FileTextOutlined />} />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title={t('empPage.withViolations')} value={withViolations} accentColor="#ff4d4f" icon={<TeamOutlined />} />
        </Col>
      </Row>

      {/* Filters */}
      <Card
        size="small"
        style={{ borderRadius: 10, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
      >
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={10} md={8}>
            <Input
              placeholder={t('empPage.searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={7} md={5}>
            <Select
              placeholder={t('empPage.filterDept')}
              value={filterDept || undefined}
              onChange={setFilterDept}
              style={{ width: '100%' }}
              allowClear
            >
              {mockDepartments.map((d) => (
                <Option key={d.id} value={d.id}>
                  {isAr ? d.nameAr : d.nameEn}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={7} md={5}>
            <Select
              placeholder={t('empPage.filterRole')}
              value={filterRole || undefined}
              onChange={setFilterRole}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="EMPLOYEE">{t('roles.employee')}</Option>
              <Option value="COMPANY_DOCTOR">{t('roles.companyDoctor')}</Option>
              <Option value="HR_MANAGER">{t('roles.hrManager')}</Option>
              <Option value="HR_OFFICER">{t('roles.hrOfficer')}</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4} md={3}>
            <Button
              icon={<ClearOutlined />}
              onClick={() => { setSearch(''); setFilterDept(''); setFilterRole(''); }}
            >
              {t('empPage.clear')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          expandable={{ expandedRowRender }}
          pagination={{ pageSize: 10, showTotal: (total) => `${total} ${t('empPage.employees')}` }}
          scroll={{ x: 1100 }}
          size="small"
        />
      </Card>
    </div>
  );
};

export default EmployeesPage;
