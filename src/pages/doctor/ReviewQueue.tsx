import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Button,
  Select,
  Input,
  Tooltip,
  Avatar,
  Typography,
  Progress,
  Empty,
  Dropdown,
  Segmented,
  Space,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  UnorderedListOutlined,
  LoadingOutlined,
  MedicineBoxOutlined,
  MoreOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { leavesAPI } from '../../services/api';
import type { SickLeave } from '../../types';

const { Title, Text } = Typography;
const NAVY = '#0a1628';
const GOLD = '#D4AF37';

type Priority = 'HIGH' | 'MEDIUM' | 'NORMAL';
type SegmentKey = 'ALL' | 'HIGH' | 'PENDING' | 'EXAMINATION' | 'DOCS';

const PENDING_STATUSES: SickLeave['status'][] = [
  'SUBMITTED',
  'PROCESSING',
  'UNDER_REVIEW',
  'EXAMINATION_REQUESTED',
  'DOCS_REQUESTED',
];

const calculatePriority = (leave: SickLeave): Priority => {
  const risk = leave.aiAnalysis?.riskScore ?? 0;
  if (
    leave.facility?.isBlocked ||
    (leave.doctor?.rank === 'GP' && leave.totalDays > 1) ||
    risk > 70 ||
    leave.totalDays > 4
  )
    return 'HIGH';
  if (
    (leave.doctor?.rank === 'SPECIALIST' && leave.totalDays > 2) ||
    (leave.documents?.length ?? 0) < 2 ||
    risk > 30
  )
    return 'MEDIUM';
  return 'NORMAL';
};

const isWeekendAdjacent = (leave: SickLeave): boolean => {
  const from = new Date(leave.fromDate);
  const to = new Date(leave.toDate);
  const dayBefore = new Date(from);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const dayAfter = new Date(to);
  dayAfter.setDate(dayAfter.getDate() + 1);
  const isJordanWeekend = (d: Date) => d.getDay() === 5 || d.getDay() === 6;
  return isJordanWeekend(dayBefore) || isJordanWeekend(dayAfter);
};

const isFrequentLeave = (leave: SickLeave, allLeaves: SickLeave[]): boolean => {
  const count = allLeaves.filter((l) => l.employeeId === leave.employeeId).length;
  return count > 3;
};

const hasMissingDocs = (leave: SickLeave): boolean => (leave.documents?.length ?? 0) < 2;

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
    default: return 'default';
  }
};

const trustStars = (score: number | null) => {
  if (score === null) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
  const stars = Math.round(score * 5);
  return <span style={{ color: GOLD, fontSize: 13 }}>{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>;
};

const avatarColors = ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1'];
const getAvatarColor = (id: string) => avatarColors[id.charCodeAt(id.length - 1) % avatarColors.length];

const ReviewQueue: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const [allLeaves, setAllLeaves] = useState<SickLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [segment, setSegment] = useState<SegmentKey>('ALL');
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [deptFilter, setDeptFilter] = useState<string | undefined>(undefined);
  const [rankFilter, setRankFilter] = useState<string | undefined>(undefined);
  const [daysFilter, setDaysFilter] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    leavesAPI.getAll()
      .then((res) => {
        const data = res.data?.data ?? res.data ?? [];
        setAllLeaves(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const allPending = useMemo(
    () =>
      allLeaves
        .filter((l) => PENDING_STATUSES.includes(l.status))
        .sort((a, b) => {
          const order: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, NORMAL: 2 };
          return order[calculatePriority(a)] - order[calculatePriority(b)];
        }),
    [allLeaves]
  );

  const clearFilters = () => {
    setStatusFilter([]);
    setDeptFilter(undefined);
    setRankFilter(undefined);
    setDaysFilter(undefined);
    setSearchText('');
    setSegment('ALL');
  };

  const filteredLeaves = useMemo(() => {
    let result = allPending;

    if (segment === 'HIGH') result = result.filter((l) => calculatePriority(l) === 'HIGH');
    else if (segment === 'PENDING') result = result.filter((l) => l.status === 'SUBMITTED' || l.status === 'UNDER_REVIEW' || l.status === 'PROCESSING');
    else if (segment === 'EXAMINATION') result = result.filter((l) => l.status === 'EXAMINATION_REQUESTED');
    else if (segment === 'DOCS') result = result.filter((l) => l.status === 'DOCS_REQUESTED');

    if (statusFilter.length > 0) result = result.filter((l) => statusFilter.includes(l.status));
    if (deptFilter) result = result.filter((l) => l.employee?.department?.id === deptFilter);
    if (rankFilter) result = result.filter((l) => l.doctor?.rank === rankFilter);
    if (daysFilter) {
      if (daysFilter === '1') result = result.filter((l) => l.totalDays === 1);
      else if (daysFilter === '2-3') result = result.filter((l) => l.totalDays >= 2 && l.totalDays <= 3);
      else if (daysFilter === '4-7') result = result.filter((l) => l.totalDays >= 4 && l.totalDays <= 7);
      else if (daysFilter === '7+') result = result.filter((l) => l.totalDays > 7);
    }
    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (l) =>
          l.refNumber.toLowerCase().includes(q) ||
          (l.employee?.nameEn ?? '').toLowerCase().includes(q) ||
          (l.employee?.nameAr ?? '').includes(searchText) ||
          (l.doctor?.nameEn ?? '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [allPending, segment, statusFilter, deptFilter, rankFilter, daysFilter, searchText]);

  const highCount = allPending.filter((l) => calculatePriority(l) === 'HIGH').length;
  const medCount = allPending.filter((l) => calculatePriority(l) === 'MEDIUM').length;
  const normalCount = allPending.filter((l) => calculatePriority(l) === 'NORMAL').length;
  const examCount = allPending.filter((l) => l.status === 'EXAMINATION_REQUESTED').length;
  const docsCount = allPending.filter((l) => l.status === 'DOCS_REQUESTED').length;

  const priorityDot = (p: Priority) => {
    const colors: Record<Priority, string> = { HIGH: '#ff4d4f', MEDIUM: '#faad14', NORMAL: '#52c41a' };
    const labels: Record<Priority, string> = {
      HIGH: t('doctorDash.high'),
      MEDIUM: t('doctorDash.medium'),
      NORMAL: t('doctorDash.normal'),
    };
    const reasons: Record<Priority, string> = {
      HIGH: t('queue.highReason'),
      MEDIUM: t('queue.mediumReason'),
      NORMAL: t('queue.normalReason'),
    };
    return (
      <Tooltip title={`${labels[p]}: ${reasons[p]}`}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 24,
            height: 24,
            borderRadius: '50%',
            background: colors[p],
            cursor: 'help',
          }}
        />
      </Tooltip>
    );
  };

  const expandedRowRender = (record: SickLeave) => {
    const ai = record.aiAnalysis;
    return (
      <div style={{ padding: '16px', background: '#fafafa', borderRadius: 8 }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 12 }}>
              {t('queue.aiScores')}
            </Text>
            <Row gutter={[16, 16]}>
              {[
                { label: t('queue.compliance'), value: ai?.compliance ?? 0, color: '#52c41a' },
                { label: t('queue.justifiability'), value: ai?.justifiability ?? 0, color: '#1890ff' },
                { label: t('queue.risk'), value: ai?.riskScore ?? 0, color: '#ff4d4f' },
                { label: t('queue.documentation'), value: ai?.documentation ?? 0, color: '#722ed1' },
              ].map((item, i) => (
                <Col span={6} key={i} style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={item.value}
                    strokeColor={item.color}
                    size={64}
                    format={(p) => <span style={{ fontSize: 12, fontWeight: 700 }}>{p}%</span>}
                  />
                  <div style={{ marginTop: 6 }}>
                    <Text style={{ fontSize: 11 }}>{item.label}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </Col>
          <Col xs={24} md={12}>
            {ai?.ruleViolations && ai.ruleViolations.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 13, color: '#ff4d4f', display: 'block', marginBottom: 6 }}>
                  {t('queue.ruleViolations')}
                </Text>
                <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                  {ai.ruleViolations.map((v, i) => (
                    <li key={i} style={{ color: '#ff4d4f', fontSize: 13 }}>{v}</li>
                  ))}
                </ul>
              </div>
            )}
            {record.employeeComments && (
              <div>
                <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
                  {t('queue.employeeComment')}
                </Text>
                <Text type="secondary" italic style={{ fontSize: 13 }}>
                  {record.employeeComments.substring(0, 200)}
                  {record.employeeComments.length > 200 && '...'}
                </Text>
              </div>
            )}
            <div style={{ marginTop: 12 }}>
              <a style={{ color: GOLD, fontWeight: 600 }} onClick={() => navigate(`/doctor/review/${record.id}`)}>
                {t('queue.fullReview')} →
              </a>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  const columns: ColumnsType<SickLeave> = [
    {
      title: t('queue.priority'),
      key: 'priority',
      width: 70,
      sorter: (a, b) => {
        const order: Record<Priority, number> = { HIGH: 0, MEDIUM: 1, NORMAL: 2 };
        return order[calculatePriority(a)] - order[calculatePriority(b)];
      },
      render: (_, r) => priorityDot(calculatePriority(r)),
    },
    {
      title: t('queue.refNum'),
      dataIndex: 'refNumber',
      key: 'refNumber',
      sorter: (a, b) => a.refNumber.localeCompare(b.refNumber),
      render: (v, r) => (
        <a style={{ color: GOLD, fontWeight: 700 }} onClick={() => navigate(`/doctor/review/${r.id}`)}>
          {v}
        </a>
      ),
    },
    {
      title: t('queue.employee'),
      key: 'employee',
      sorter: (a, b) => (a.employee?.nameEn ?? '').localeCompare(b.employee?.nameEn ?? ''),
      render: (_, r) => (
        <Space>
          <Avatar
            size={36}
            style={{ background: getAvatarColor(r.employeeId), fontWeight: 700, flexShrink: 0 }}
          >
            {(isAr ? r.employee?.nameAr ?? '' : r.employee?.nameEn ?? '').charAt(0)}
          </Avatar>
          <div>
            <Text strong style={{ fontSize: 13 }}>
              {isAr ? r.employee?.nameAr : r.employee?.nameEn}
            </Text>
            <br />
            <Text type="secondary" style={{ fontSize: 11 }}>
              {isAr ? r.employee?.department?.nameAr : r.employee?.department?.nameEn}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: t('queue.period'),
      key: 'period',
      sorter: (a, b) => new Date(a.fromDate).getTime() - new Date(b.fromDate).getTime(),
      render: (_, r) => (
        <Text style={{ fontSize: 12 }}>
          {new Date(r.fromDate).toLocaleDateString(isAr ? 'ar-JO' : 'en-GB', { day: '2-digit', month: 'short' })}
          {' → '}
          {new Date(r.toDate).toLocaleDateString(isAr ? 'ar-JO' : 'en-GB', { day: '2-digit', month: 'short' })}
        </Text>
      ),
    },
    {
      title: t('queue.days'),
      dataIndex: 'totalDays',
      key: 'totalDays',
      sorter: (a, b) => a.totalDays - b.totalDays,
      render: (v) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: v > 3 ? '#fff1f0' : v > 2 ? '#fff7e6' : '#f6ffed',
            border: `2px solid ${v > 3 ? '#ff4d4f' : v > 2 ? '#fa8c16' : '#52c41a'}`,
            fontWeight: 700,
            fontSize: 13,
            color: v > 3 ? '#ff4d4f' : v > 2 ? '#fa8c16' : '#52c41a',
          }}
        >
          {v}
        </span>
      ),
    },
    {
      title: t('queue.doctor'),
      key: 'doctor',
      sorter: (a, b) => (a.doctor?.nameEn ?? '').localeCompare(b.doctor?.nameEn ?? ''),
      render: (_, r) => (
        <div>
          <Text style={{ fontSize: 13 }}>{isAr ? r.doctor?.nameAr : r.doctor?.nameEn}</Text>
          <br />
          <Tag color={rankTagColor(r.doctor?.rank ?? '')} style={{ fontSize: 11, marginTop: 2 }}>
            {t(`doctorRanks.${(r.doctor?.rank ?? '').toLowerCase()}`)}
          </Tag>
        </div>
      ),
    },
    {
      title: t('queue.facility'),
      key: 'facility',
      sorter: (a, b) => (a.facility?.nameEn ?? '').localeCompare(b.facility?.nameEn ?? ''),
      render: (_, r) => (
        <div>
          <Text style={{ fontSize: 13 }}>{isAr ? r.facility?.nameAr : r.facility?.nameEn}</Text>
          <br />
          {r.facility?.isBlocked ? (
            <Tag color="red" style={{ fontSize: 11 }}>🚫 {t('queue.blocked')}</Tag>
          ) : (
            trustStars(r.facility?.trustScore ?? null)
          )}
        </div>
      ),
    },
    {
      title: t('queue.diagnosis'),
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      sorter: (a, b) => a.diagnosis.localeCompare(b.diagnosis),
      render: (v) => (
        <Tooltip title={v}>
          <Text style={{ fontSize: 13 }}>
            {v.length > 25 ? v.substring(0, 25) + '...' : v}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: t('queue.aiRisk'),
      key: 'aiRisk',
      sorter: (a, b) => (a.aiAnalysis?.riskScore ?? 0) - (b.aiAnalysis?.riskScore ?? 0),
      render: (_, r) => {
        const risk = r.aiAnalysis?.riskScore ?? 0;
        if (risk < 30) return <Tag color="green">{t('queue.lowRisk')}</Tag>;
        if (risk <= 70) return <Tag color="orange">{t('queue.mediumRisk')}</Tag>;
        return <Tag color="red">{t('queue.highRisk')}</Tag>;
      },
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      sorter: (a, b) => a.status.localeCompare(b.status),
      render: (v) => (
        <Tag
          color={statusTagColor(v)}
          icon={
            v === 'PROCESSING'
              ? <LoadingOutlined />
              : v === 'EXAMINATION_REQUESTED'
              ? <MedicineBoxOutlined />
              : undefined
          }
          style={{ fontSize: 12 }}
        >
          {t(`statuses.${v === 'PARTIALLY_APPROVED' ? 'partiallyApproved' : v === 'UNDER_REVIEW' ? 'underReview' : v === 'DOCS_REQUESTED' ? 'docsRequested' : v === 'EXAMINATION_REQUESTED' ? 'examinationRequested' : v.toLowerCase()}`)}
        </Tag>
      ),
    },
    {
      title: t('queue.flags'),
      key: 'flags',
      render: (_, r) => (
        <Space size={4}>
          {isWeekendAdjacent(r) && (
            <Tooltip title={t('queue.flagWeekend')}><span>🏖️</span></Tooltip>
          )}
          {isFrequentLeave(r, allLeaves) && (
            <Tooltip title={t('queue.flagFrequent')}><span>🔄</span></Tooltip>
          )}
          {hasMissingDocs(r) && (
            <Tooltip title={t('queue.flagMissingDocs')}><span>📋</span></Tooltip>
          )}
          {(r.aiAnalysis?.ruleViolations ?? []).length > 0 && (
            <Tooltip title={(r.aiAnalysis?.ruleViolations ?? []).join(', ')}><span>⚠️</span></Tooltip>
          )}
        </Space>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Button
            size="small"
            style={{ background: GOLD, borderColor: GOLD, color: '#fff', fontWeight: 600 }}
            onClick={(e) => { e.stopPropagation(); navigate(`/doctor/review/${r.id}`); }}
          >
            {t('doctorDash.review')}
          </Button>
          <Dropdown
            menu={{
              items: [
                { key: 'history', label: t('queue.viewHistory') },
                { key: 'flag', label: t('queue.flagFollowUp') },
                { key: 'urgent', label: t('queue.markUrgent') },
              ],
            }}
            trigger={['click']}
          >
            <Button size="small" icon={<MoreOutlined />} onClick={(e) => e.stopPropagation()} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const segmentOptions = [
    { label: t('queue.segAll'), value: 'ALL' },
    { label: `🔴 ${t('queue.segHigh')}`, value: 'HIGH' },
    { label: t('queue.segPending'), value: 'PENDING' },
    { label: `🩺 ${t('queue.segExam')}`, value: 'EXAMINATION' },
    { label: `📄 ${t('queue.segDocs')}`, value: 'DOCS' },
  ];

  return (
    <div style={{ padding: '24px', background: '#f5f6fa', minHeight: '100vh' }}>
      {/* Header */}
      <Row align="middle" justify="space-between" style={{ marginBottom: 20 }} gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Title level={3} style={{ color: NAVY, margin: 0 }}>
            <UnorderedListOutlined style={{ color: GOLD, marginInlineEnd: 10 }} />
            {t('doctorDash.reviewQueue')}
          </Title>
          <Text type="secondary">
            {t('queue.subtitle', { count: allPending.length })}
          </Text>
        </Col>
        <Col xs={24} md={10}>
          <Segmented
            options={segmentOptions}
            value={segment}
            onChange={(v) => setSegment(v as SegmentKey)}
            style={{ width: '100%', overflowX: 'auto' }}
          />
        </Col>
      </Row>

      {/* Filter Bar */}
      <Card style={{ borderRadius: 12, marginBottom: 16 }} bodyStyle={{ padding: '16px 20px' }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              mode="multiple"
              placeholder={t('common.status')}
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
              maxTagCount={1}
              options={PENDING_STATUSES.map((s) => ({
                value: s,
                label: t(`statuses.${s === 'UNDER_REVIEW' ? 'underReview' : s === 'DOCS_REQUESTED' ? 'docsRequested' : s === 'EXAMINATION_REQUESTED' ? 'examinationRequested' : s.toLowerCase()}`),
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder={t('auth.department')}
              value={deptFilter}
              onChange={setDeptFilter}
              style={{ width: '100%' }}
              allowClear
              options={[...new Map(
                allLeaves.map((l) => [l.employee?.department?.id, l.employee?.department])
              ).values()]
                .filter(Boolean)
                .map((d) => ({ value: d!.id, label: isAr ? d!.nameAr : d!.nameEn }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder={t('queue.doctorRank')}
              value={rankFilter}
              onChange={setRankFilter}
              style={{ width: '100%' }}
              allowClear
              options={(['GP', 'RESIDENT', 'SPECIALIST', 'CONSULTANT'] as const).map((r) => ({
                value: r,
                label: t(`doctorRanks.${r.toLowerCase()}`),
              }))}
            />
          </Col>
          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder={t('queue.daysRange')}
              value={daysFilter}
              onChange={setDaysFilter}
              style={{ width: '100%' }}
              allowClear
              options={[
                { value: '1', label: t('queue.oneDay') },
                { value: '2-3', label: t('queue.twothreeDays') },
                { value: '4-7', label: t('queue.fourSevenDays') },
                { value: '7+', label: t('queue.sevenPlusDays') },
              ]}
            />
          </Col>
          <Col xs={24} sm={16} md={10} lg={6}>
            <Input.Search
              placeholder={t('queue.searchPlaceholder')}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col xs={24} sm={8} md={4} lg={2}>
            <Button type="link" onClick={clearFilters} style={{ color: GOLD, padding: 0, fontWeight: 600 }}>
              {t('myLeaves.clearFilters')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Summary Pills */}
      <Row gutter={[8, 8]} style={{ marginBottom: 16 }}>
        {[
          { label: `🔴 ${highCount} ${t('doctorDash.high')}`, bg: '#fff1f0', color: '#ff4d4f' },
          { label: `🟡 ${medCount} ${t('doctorDash.medium')}`, bg: '#fffbe6', color: '#faad14' },
          { label: `🟢 ${normalCount} ${t('doctorDash.normal')}`, bg: '#f6ffed', color: '#52c41a' },
          { label: `🩺 ${examCount} ${t('queue.segExam')}`, bg: '#fff0f6', color: '#eb2f96' },
          { label: `📄 ${docsCount} ${t('queue.segDocs')}`, bg: '#f9f0ff', color: '#722ed1' },
        ].map((pill, i) => (
          <Col key={i}>
            <div
              style={{
                background: pill.bg,
                color: pill.color,
                border: `1px solid ${pill.color}40`,
                borderRadius: 16,
                padding: '4px 14px',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {pill.label}
            </div>
          </Col>
        ))}
      </Row>

      {/* Main Table */}
      <Card style={{ borderRadius: 12 }} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filteredLeaves}
          rowKey="id"
          scroll={{ x: 1400 }}
          sticky
          expandable={{ expandedRowRender }}
          onRow={(record) => ({
            onClick: () => navigate(`/doctor/review/${record.id}`),
            style: {
              cursor: 'pointer',
              background:
                calculatePriority(record) === 'HIGH'
                  ? '#fff1f0'
                  : calculatePriority(record) === 'MEDIUM'
                  ? '#fffbe6'
                  : undefined,
            },
          })}
          rowClassName={(record) =>
            calculatePriority(record) === 'HIGH'
              ? 'queue-row-high'
              : calculatePriority(record) === 'MEDIUM'
              ? 'queue-row-medium'
              : ''
          }
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            pageSizeOptions: ['5', '10', '20'],
            showTotal: (total, range) =>
              t('queue.showingOf', { start: range[0], end: range[1], total }),
          }}
          locale={{
            emptyText: (
              <Empty
                description={
                  <div>
                    <div style={{ marginBottom: 12 }}>{t('queue.noLeaves')}</div>
                    <Button type="link" onClick={clearFilters} style={{ color: GOLD }}>
                      {t('myLeaves.clearFilters')}
                    </Button>
                  </div>
                }
              />
            ),
          }}
        />
      </Card>
    </div>
  );
};

export default ReviewQueue;
