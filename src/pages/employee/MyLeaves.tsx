import React, { useState, useMemo, useEffect } from 'react';
import {
  Table,
  Tag,
  Button,
  Card,
  Row,
  Col,
  Input,
  Select,
  DatePicker,
  Typography,
  Tooltip,
  Empty,
  Badge,
  Space,
  Spin,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { RangePickerProps } from 'antd/es/date-picker';
import {
  FileTextOutlined,
  EyeOutlined,
  PlusOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  MedicineBoxOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useLeaveStore } from '../../store/leaveStore';
import type { SickLeave, LeaveStatus } from '../../types';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

// ── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  LeaveStatus,
  { color: string; dot: string; icon?: React.ReactNode }
> = {
  SUBMITTED: { color: 'blue', dot: '#1890ff' },
  PROCESSING: { color: 'cyan', dot: '#13c2c2', icon: <LoadingOutlined spin /> },
  UNDER_REVIEW: { color: 'orange', dot: '#fa8c16' },
  DOCS_REQUESTED: { color: 'purple', dot: '#722ed1' },
  EXAMINATION_REQUESTED: { color: 'magenta', dot: '#eb2f96', icon: <MedicineBoxOutlined /> },
  APPROVED: { color: 'green', dot: '#52c41a', icon: <CheckCircleOutlined /> },
  PARTIALLY_APPROVED: { color: 'gold', dot: '#faad14', icon: <ExclamationCircleOutlined /> },
  REJECTED: { color: 'red', dot: '#ff4d4f', icon: <CloseCircleOutlined /> },
  PENDING_COMMITTEE: { color: 'volcano', dot: '#fa541c' },
};

const ALL_STATUSES: LeaveStatus[] = [
  'SUBMITTED', 'PROCESSING', 'UNDER_REVIEW', 'DOCS_REQUESTED',
  'EXAMINATION_REQUESTED', 'APPROVED', 'PARTIALLY_APPROVED', 'REJECTED',
];

const formatSize = (bytes: number) => {
  if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)}MB`;
  return `${(bytes / 1000).toFixed(0)}KB`;
};

const MyLeaves: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const { leaves: rawLeaves, loadUserLeaves, isLoading } = useLeaveStore();

  const [statusFilter, setStatusFilter] = useState<LeaveStatus[]>([]);
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  useEffect(() => {
    loadUserLeaves();
  }, [loadUserLeaves]);

  const filtered = useMemo(() => {
    let list = rawLeaves;

    if (statusFilter.length > 0) {
      list = list.filter((l) => statusFilter.includes(l.status));
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.refNumber.toLowerCase().includes(q) ||
          (l.doctor?.nameEn ?? '').toLowerCase().includes(q) ||
          (l.doctor?.nameAr ?? '').includes(search)
      );
    }

    if (dateRange[0] && dateRange[1]) {
      list = list.filter((l) => {
        const from = dayjs(l.fromDate);
        return from.isAfter(dateRange[0]!.subtract(1, 'day')) && from.isBefore(dateRange[1]!.add(1, 'day'));
      });
    }

    return list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }, [rawLeaves, statusFilter, search, dateRange]);

  // Stats
  const stats = useMemo(() => ({
    total: rawLeaves.length,
    approved: rawLeaves.filter((l) => l.status === 'APPROVED' || l.status === 'PARTIALLY_APPROVED').length,
    pending: rawLeaves.filter((l) =>
      ['SUBMITTED', 'PROCESSING', 'UNDER_REVIEW', 'DOCS_REQUESTED', 'EXAMINATION_REQUESTED'].includes(l.status)
    ).length,
    rejected: rawLeaves.filter((l) => l.status === 'REJECTED').length,
  }), [rawLeaves]);

  const clearFilters = () => {
    setStatusFilter([]);
    setSearch('');
    setDateRange([null, null]);
  };

  const getStatusLabel = (status: LeaveStatus) => {
    const map: Record<LeaveStatus, string> = {
      SUBMITTED: t('statuses.submitted'),
      PROCESSING: t('statuses.processing'),
      UNDER_REVIEW: t('statuses.underReview'),
      DOCS_REQUESTED: t('statuses.docsRequested'),
      EXAMINATION_REQUESTED: t('statuses.examinationRequested'),
      APPROVED: t('statuses.approved'),
      PARTIALLY_APPROVED: t('statuses.partiallyApproved'),
      REJECTED: t('statuses.rejected'),
      PENDING_COMMITTEE: t('statuses.pendingCommittee'),
    };
    return map[status] || status;
  };

  const getRankLabel = (rank: string) => {
    const map: Record<string, string> = {
      GP: t('doctorRanks.gp'),
      RESIDENT: t('doctorRanks.resident'),
      SPECIALIST: t('doctorRanks.specialist'),
      CONSULTANT: t('doctorRanks.consultant'),
    };
    return map[rank] || rank;
  };

  const getFacilityTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      GOVERNMENT_HOSPITAL: t('facilityTypes.governmentHospital'),
      PRIVATE_HOSPITAL: t('facilityTypes.privateHospital'),
      UNIVERSITY_HOSPITAL: t('facilityTypes.universityHospital'),
      ROYAL_MEDICAL_SERVICES: t('facilityTypes.royalMedicalServices'),
      HEALTH_CENTER: t('facilityTypes.healthCenter'),
      PRIVATE_CLINIC: t('facilityTypes.privateClinic'),
      PRIVATE_24H: t('facilityTypes.private24h'),
      SPECIALIZED_CENTER: t('facilityTypes.specializedCenter'),
      MILITARY_HOSPITAL: t('facilityTypes.militaryHospital'),
    };
    return map[type] || type;
  };

  const columns: ColumnsType<SickLeave> = [
    {
      title: t('myLeaves.refNumber'),
      dataIndex: 'refNumber',
      key: 'refNumber',
      width: 150,
      render: (ref, record) => (
        <Button
          type="link"
          style={{ padding: 0, fontWeight: 700, color: '#D4AF37', fontFamily: 'monospace' }}
          onClick={() => navigate(`/employee/leave/${record.id}`)}
        >
          {ref}
        </Button>
      ),
    },
    {
      title: t('myLeaves.period'),
      key: 'period',
      width: 180,
      render: (_, record) => (
        <span style={{ fontSize: 12 }}>
          {dayjs(record.fromDate).format('DD MMM YYYY')}
          <span style={{ color: '#8c8c8c', margin: '0 4px' }}>→</span>
          {dayjs(record.toDate).format('DD MMM YYYY')}
        </span>
      ),
      sorter: (a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime(),
    },
    {
      title: t('myLeaves.days'),
      dataIndex: 'totalDays',
      key: 'days',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.totalDays - b.totalDays,
      render: (days) => (
        <Badge
          count={days}
          style={{
            backgroundColor: days === 1 ? '#52c41a' : days <= 2 ? '#1890ff' : '#fa8c16',
            fontWeight: 700,
          }}
        />
      ),
    },
    {
      title: t('myLeaves.doctor'),
      key: 'doctor',
      width: 160,
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: 13, display: 'block', fontWeight: 500 }}>
            {isAr ? record.doctor?.nameAr : record.doctor?.nameEn}
          </Text>
          <Tag color="blue" style={{ fontSize: 10, marginTop: 2 }}>
            {getRankLabel(record.doctor?.rank ?? '')}
          </Tag>
        </div>
      ),
      responsive: ['md'] as ('md')[],
    },
    {
      title: t('myLeaves.facility'),
      key: 'facility',
      width: 160,
      render: (_, record) => (
        <div>
          <Text style={{ fontSize: 12, display: 'block' }}>
            {isAr ? record.facility?.nameAr : record.facility?.nameEn}
          </Text>
          <Tag color="default" style={{ fontSize: 10, marginTop: 2 }}>
            {getFacilityTypeLabel(record.facility?.type ?? '')}
          </Tag>
        </div>
      ),
      responsive: ['lg'] as ('lg')[],
    },
    {
      title: t('myLeaves.disease'),
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      width: 160,
      render: (text) => (
        <Tooltip title={text}>
          <Text style={{ fontSize: 12 }} ellipsis>
            {text.length > 28 ? `${text.slice(0, 28)}…` : text}
          </Text>
        </Tooltip>
      ),
      responsive: ['lg'] as ('lg')[],
    },
    {
      title: t('myLeaves.status'),
      dataIndex: 'status',
      key: 'status',
      width: 160,
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (status: LeaveStatus) => {
        const cfg = STATUS_CONFIG[status];
        return (
          <Tag
            color={cfg.color}
            icon={cfg.icon}
            style={{ fontWeight: 600, fontSize: 11 }}
          >
            {getStatusLabel(status)}
          </Tag>
        );
      },
    },
    {
      title: t('myLeaves.submittedOn'),
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 120,
      sorter: (a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
      render: (date) => (
        <Text style={{ fontSize: 12 }}>{dayjs(date).format('DD MMM YYYY')}</Text>
      ),
      responsive: ['sm'] as ('sm')[],
    },
    {
      title: t('myLeaves.actions'),
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size={6}>
          <Button
            type="primary"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/employee/leave/${record.id}`)}
            style={{ background: '#001529', borderColor: '#001529', borderRadius: 6 }}
          >
            {t('myLeaves.view')}
          </Button>
          {record.status === 'DOCS_REQUESTED' && (
            <Button
              size="small"
              type="default"
              icon={<PlusOutlined />}
              style={{ color: '#1890ff', borderColor: '#1890ff', borderRadius: 6 }}
              onClick={() => navigate(`/employee/leave/${record.id}`)}
            >
              {t('myLeaves.uploadDocs')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileTextOutlined style={{ fontSize: 28, color: '#D4AF37' }} />
          <div>
            <Title level={3} style={{ margin: 0, color: '#001529' }}>
              {t('myLeaves.title')}
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              {t('myLeaves.subtitle')}
            </Text>
          </div>
        </div>
        <Button
          type="primary"
          className="btn-gold"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => navigate('/employee/submit-leave')}
          style={{ borderRadius: 8 }}
        >
          {t('myLeaves.submitNew')}
        </Button>
      </div>

      {/* Filters */}
      <Card
        style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: '16px 20px' }}
      >
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={24} md={8}>
            <Select
              mode="multiple"
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder={t('myLeaves.filterStatus')}
              style={{ width: '100%' }}
              allowClear
              maxTagCount="responsive"
            >
              {ALL_STATUSES.map((s) => (
                <Select.Option key={s} value={s}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: STATUS_CONFIG[s].dot,
                      marginInlineEnd: 8,
                    }}
                  />
                  {getStatusLabel(s)}
                </Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={14} md={8}>
            <RangePicker
              value={dateRange as RangePickerProps['value']}
              onChange={(vals) => setDateRange(vals ? [vals[0], vals[1]] : [null, null])}
              style={{ width: '100%' }}
              placeholder={[t('myLeaves.filterDate'), t('myLeaves.filterDate')]}
            />
          </Col>
          <Col xs={24} sm={10} md={6}>
            <Input
              prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
              placeholder={t('myLeaves.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>
          <Col xs={24} md={2} style={{ textAlign: 'center' }}>
            <Button type="text" onClick={clearFilters} style={{ color: '#8c8c8c' }}>
              {t('myLeaves.clearFilters')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Stats row */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {[
          { label: t('myLeaves.total'), value: stats.total, color: '#595959', bg: '#fafafa', border: '#d9d9d9' },
          { label: t('myLeaves.approved'), value: stats.approved, color: '#52c41a', bg: '#f6ffed', border: '#b7eb8f' },
          { label: t('myLeaves.pending'), value: stats.pending, color: '#fa8c16', bg: '#fff7e6', border: '#ffd591' },
          { label: t('myLeaves.rejected'), value: stats.rejected, color: '#ff4d4f', bg: '#fff2f0', border: '#ffccc7' },
        ].map((stat, i) => (
          <Col key={i} xs={12} sm={6}>
            <div
              style={{
                background: stat.bg,
                border: `1px solid ${stat.border}`,
                borderRadius: 8,
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Text style={{ fontSize: 26, fontWeight: 800, color: stat.color, lineHeight: 1 }}>
                {stat.value}
              </Text>
              <Text style={{ fontSize: 12, color: stat.color }}>{stat.label}</Text>
            </div>
          </Col>
        ))}
      </Row>

      {/* Table */}
      <Card
        style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        bodyStyle={{ padding: 0 }}
      >
        {isLoading && (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin size="large" />
          </div>
        )}
        <Table<SickLeave>
          dataSource={filtered}
          columns={columns}
          rowKey="id"
          bordered={false}
          size="middle"
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `${total} ${t('common.total')}`,
          }}
          onRow={(record) => ({
            onClick: () => navigate(`/employee/leave/${record.id}`),
            style: { cursor: 'pointer' },
          })}
          locale={{
            emptyText: (
              <Empty
                description={
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
                      {t('myLeaves.noLeaves')}
                    </div>
                    <Button
                      type="primary"
                      className="btn-gold"
                      onClick={() => navigate('/employee/submit-leave')}
                    >
                      {t('myLeaves.noLeavesHint')}
                    </Button>
                  </div>
                }
              />
            ),
          }}
          style={{ borderRadius: 12, overflow: 'hidden' }}
        />
      </Card>
    </div>
  );
};

export default MyLeaves;
