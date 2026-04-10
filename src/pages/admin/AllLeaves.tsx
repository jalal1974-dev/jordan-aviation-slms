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
  Space,
  Tooltip,
  notification,
  Spin,
  message,
} from 'antd';
import {
  FileTextOutlined,
  DownloadOutlined,
  SearchOutlined,
  ClearOutlined,
  FilterOutlined,
  SendOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { leavesAPI } from '../../services/api';
import type { SickLeave, LeaveStatus } from '../../types';
import SendResultModal from '../../components/admin/SendResultModal';

const { Text, Title } = Typography;
const { Option } = Select;

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

const DECISION_COLORS: Record<string, string> = {
  APPROVED: 'green',
  PARTIALLY_APPROVED: 'gold',
  REJECTED: 'red',
};

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const AllLeaves: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterDept, setFilterDept] = useState<string>('');
  const [filterDoctor, setFilterDoctor] = useState<string>('');
  const [filterFacility, setFilterFacility] = useState<string>('');
  const [filterEmployee, setFilterEmployee] = useState<string>('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<SickLeave | null>(null);
  const [sentLeaves, setSentLeaves] = useState<Set<string>>(new Set());
  const [leaves, setLeaves] = useState<SickLeave[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    leavesAPI.getAll()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setLeaves(Array.isArray(data) ? data : []);
      })
      .catch(() => message.error('Failed to load leaves'))
      .finally(() => setLoading(false));
  }, []);

  const statuses: LeaveStatus[] = [
    'SUBMITTED', 'PROCESSING', 'UNDER_REVIEW', 'DOCS_REQUESTED',
    'EXAMINATION_REQUESTED', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED', 'PENDING_COMMITTEE',
  ];

  const uniqueEmployees = useMemo(() => {
    const map = new Map<string, SickLeave['employee']>();
    leaves.forEach((l) => { if (l.employee) map.set(l.employeeId, l.employee); });
    return Array.from(map.values());
  }, [leaves]);

  const uniqueDepartments = useMemo(() => {
    const map = new Map<string, SickLeave['employee']['department']>();
    leaves.forEach((l) => { if (l.employee?.department) map.set(l.employee.department.id, l.employee.department); });
    return Array.from(map.values());
  }, [leaves]);

  const uniqueDoctors = useMemo(() => {
    const map = new Map<string, SickLeave['doctor']>();
    leaves.forEach((l) => { if (l.doctor) map.set(l.doctor.id, l.doctor); });
    return Array.from(map.values());
  }, [leaves]);

  const uniqueFacilities = useMemo(() => {
    const map = new Map<string, SickLeave['facility']>();
    leaves.forEach((l) => { if (l.facility) map.set(l.facility.id, l.facility); });
    return Array.from(map.values());
  }, [leaves]);

  const filtered = useMemo(() => {
    return leaves.filter((l) => {
      if (search) {
        const q = search.toLowerCase();
        const empName = isAr ? l.employee?.nameAr : l.employee?.nameEn;
        if (
          !l.refNumber.toLowerCase().includes(q) &&
          !(empName ?? '').toLowerCase().includes(q) &&
          !l.diagnosis.toLowerCase().includes(q)
        )
          return false;
      }
      if (filterStatus.length > 0 && !filterStatus.includes(l.status)) return false;
      if (filterDept && l.employee?.department?.id !== filterDept) return false;
      if (filterDoctor && l.doctor?.id !== filterDoctor) return false;
      if (filterFacility && l.facility?.id !== filterFacility) return false;
      if (filterEmployee && l.employeeId !== filterEmployee) return false;
      return true;
    });
  }, [leaves, search, filterStatus, filterDept, filterDoctor, filterFacility, filterEmployee, isAr]);

  const clearFilters = () => {
    setSearch('');
    setFilterStatus([]);
    setFilterDept('');
    setFilterDoctor('');
    setFilterFacility('');
    setFilterEmployee('');
  };

  const handleExport = () => {
    notification.success({
      message: t('adminLeaves.exportSuccess'),
      description: t('adminLeaves.exportDesc'),
    });
  };

  const openModal = (leave: SickLeave) => {
    setSelectedLeave(leave);
    setModalVisible(true);
  };

  const handleSent = (leaveId: string) => {
    setSentLeaves((prev) => new Set([...prev, leaveId]));
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const s of statuses) {
      counts[s] = leaves.filter((l) => l.status === s).length;
    }
    return counts;
  }, [leaves]);

  const columns = [
    {
      title: t('adminLeaves.refNum'),
      dataIndex: 'refNumber',
      key: 'ref',
      sorter: (a: SickLeave, b: SickLeave) => a.refNumber.localeCompare(b.refNumber),
      render: (ref: string) => (
        <Text style={{ color: '#D4AF37', fontWeight: 600, cursor: 'pointer' }}>{ref}</Text>
      ),
    },
    {
      title: t('adminLeaves.employee'),
      key: 'employee',
      sorter: (a: SickLeave, b: SickLeave) => a.employee.nameEn.localeCompare(b.employee.nameEn),
      render: (_: unknown, r: SickLeave) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>
            {isAr ? r.employee.nameAr : r.employee.nameEn}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>
            {isAr ? r.employee.department?.nameAr : r.employee.department?.nameEn}
          </Text>
        </div>
      ),
    },
    {
      title: t('adminLeaves.period'),
      key: 'period',
      render: (_: unknown, r: SickLeave) => (
        <Text style={{ fontSize: 12 }}>
          {formatDate(r.fromDate)} — {formatDate(r.toDate)}
        </Text>
      ),
    },
    {
      title: t('adminLeaves.days'),
      dataIndex: 'totalDays',
      key: 'days',
      sorter: (a: SickLeave, b: SickLeave) => a.totalDays - b.totalDays,
      render: (d: number) => <Tag>{d}d</Tag>,
    },
    {
      title: t('adminLeaves.doctor'),
      key: 'doctor',
      render: (_: unknown, r: SickLeave) => (
        <div>
          <Text style={{ fontSize: 12 }}>{isAr ? r.doctor.nameAr : r.doctor.nameEn}</Text>
          <br />
          <Tag color="blue" style={{ fontSize: 10 }}>{r.doctor.rank}</Tag>
        </div>
      ),
    },
    {
      title: t('adminLeaves.facility'),
      key: 'facility',
      render: (_: unknown, r: SickLeave) => (
        <div>
          <Text style={{ fontSize: 12 }}>{isAr ? r.facility.nameAr : r.facility.nameEn}</Text>
          {r.facility.isBlocked && (
            <>
              <br />
              <Tag color="red" style={{ fontSize: 10 }}>BLOCKED</Tag>
            </>
          )}
        </div>
      ),
    },
    {
      title: t('adminLeaves.diagnosis'),
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      render: (d: string) => (
        <Tooltip title={d}>
          <Text ellipsis style={{ maxWidth: 120, display: 'block', fontSize: 12 }}>{d}</Text>
        </Tooltip>
      ),
    },
    {
      title: t('adminLeaves.status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={STATUS_COLORS[s] ?? 'default'} style={{ fontSize: 11 }}>
          {t(`statuses.${s.toLowerCase().replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())}`)}
        </Tag>
      ),
    },
    {
      title: t('adminLeaves.decision'),
      key: 'decision',
      render: (_: unknown, r: SickLeave) =>
        r.companyDoctorDecision ? (
          <Tag color={DECISION_COLORS[r.companyDoctorDecision] ?? 'default'} style={{ fontSize: 11 }}>
            {t(
              `statuses.${r.companyDoctorDecision
                .toLowerCase()
                .replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())}`
            )}
          </Tag>
        ) : (
          <Tag style={{ fontSize: 11 }}>N/A</Tag>
        ),
    },
    {
      title: t('adminLeaves.adminStatus'),
      key: 'adminStatus',
      render: (_: unknown, r: SickLeave) => {
        if (!r.companyDoctorDecision) {
          return <Tag color="default" style={{ fontSize: 11 }}>N/A</Tag>;
        }
        return sentLeaves.has(r.id) ? (
          <Tag color="green" style={{ fontSize: 11 }}>
            {t('adminLeaves.emailSent')}
          </Tag>
        ) : (
          <Tag color="red" style={{ fontSize: 11 }}>
            {t('adminLeaves.emailPending')}
          </Tag>
        );
      },
    },
    {
      title: t('adminLeaves.submitted'),
      key: 'submitted',
      sorter: (a: SickLeave, b: SickLeave) =>
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      render: (_: unknown, r: SickLeave) => (
        <Text style={{ fontSize: 11 }}>{formatDate(r.submittedAt)}</Text>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      fixed: 'right' as const,
      render: (_: unknown, r: SickLeave) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />}>
            {t('common.view')}
          </Button>
          {r.companyDoctorDecision && !sentLeaves.has(r.id) && (
            <Button
              size="small"
              icon={<SendOutlined />}
              style={{ background: '#D4AF37', borderColor: '#D4AF37', color: '#fff' }}
              onClick={() => openModal(r)}
            >
              {t('adminDash.sendResult')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (loading) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;

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
            <FileTextOutlined style={{ marginInlineEnd: 10, color: '#D4AF37' }} />
            {t('adminLeaves.title')}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('adminLeaves.subtitle')}
          </Text>
        </div>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          {t('adminLeaves.exportReport')}
        </Button>
      </div>

      {/* Status Pills */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        <Tag style={{ padding: '4px 10px', borderRadius: 20, fontWeight: 600 }}>
          {t('common.total')}: {leaves.length}
        </Tag>
        {statuses.map((s) => (
          <Tag
            key={s}
            color={STATUS_COLORS[s]}
            style={{ padding: '4px 10px', borderRadius: 20, cursor: 'pointer' }}
            onClick={() => setFilterStatus([s])}
          >
            {t(`statuses.${s.toLowerCase().replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())}`)}:{' '}
            {statusCounts[s] ?? 0}
          </Tag>
        ))}
      </div>

      {/* Filters */}
      <Card
        style={{ borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Input.Search
              placeholder={t('adminLeaves.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Select
              mode="multiple"
              placeholder={t('adminLeaves.filterStatus')}
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: '100%' }}
              maxTagCount={1}
              allowClear
            >
              {statuses.map((s) => (
                <Option key={s} value={s}>
                  {t(`statuses.${s.toLowerCase().replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())}`)}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder={t('adminLeaves.filterEmployee')}
              value={filterEmployee || undefined}
              onChange={setFilterEmployee}
              style={{ width: '100%' }}
              allowClear
              showSearch
              filterOption={(input, option) =>
                String(option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
            >
              {uniqueEmployees.map((u) => (
                <Option key={u.id} value={u.id}>
                  {isAr ? u.nameAr : u.nameEn}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder={t('adminLeaves.filterDept')}
              value={filterDept || undefined}
              onChange={setFilterDept}
              style={{ width: '100%' }}
              allowClear
            >
              {uniqueDepartments.map((d) => (
                <Option key={d.id} value={d.id}>
                  {isAr ? d.nameAr : d.nameEn}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder={t('adminLeaves.filterDoctor')}
              value={filterDoctor || undefined}
              onChange={setFilterDoctor}
              style={{ width: '100%' }}
              allowClear
            >
              {uniqueDoctors.map((d) => (
                <Option key={d.id} value={d.id}>
                  {isAr ? d.nameAr : d.nameEn}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Select
              placeholder={t('adminLeaves.filterFacility')}
              value={filterFacility || undefined}
              onChange={setFilterFacility}
              style={{ width: '100%' }}
              allowClear
            >
              {uniqueFacilities.map((f) => (
                <Option key={f.id} value={f.id}>
                  {isAr ? f.nameAr : f.nameEn}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8} lg={4}>
            <Space>
              <Button icon={<ClearOutlined />} onClick={clearFilters}>
                {t('adminLeaves.clearFilters')}
              </Button>
              <Button type="primary" icon={<FilterOutlined />} style={{ background: '#D4AF37', borderColor: '#D4AF37' }}>
                {t('adminLeaves.applyFilters')}
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Main Table */}
      <Card style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <Table
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 10, showTotal: (total) => `${total} leaves` }}
          scroll={{ x: 1400 }}
          size="small"
          bordered={false}
          rowClassName={(_, idx) => (idx % 2 === 0 ? '' : 'ant-table-row-alt')}
        />
      </Card>

      <SendResultModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        leave={selectedLeave}
        onSent={handleSent}
      />
    </div>
  );
};

export default AllLeaves;
