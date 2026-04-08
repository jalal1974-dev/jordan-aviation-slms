import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Card, Row, Col, Table, Tag, Button, Select, Input,
  Statistic, Typography, Space, Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CheckCircleOutlined, CheckCircleFilled, CloseCircleFilled,
  ExclamationCircleFilled, SearchOutlined, ClearOutlined,
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { mockSickLeaves } from '../../services/mockData';
import type { SickLeave } from '../../types';

const { Title, Text } = Typography;
const NAVY = '#0a1628';
const GOLD  = '#D4AF37';

const DecisionsPage: React.FC = () => {
  const navigate     = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr         = i18n.language === 'ar';

  const [decisionFilter, setDecisionFilter] = useState<string | undefined>(undefined);
  const [search, setSearch]                  = useState('');

  const allDecisions = mockSickLeaves.filter(
    (l) => l.status === 'APPROVED' || l.status === 'PARTIALLY_APPROVED' ||
           l.status === 'REJECTED'  || l.status === 'EXAMINATION_REQUESTED',
  );

  const filtered = allDecisions.filter((l) => {
    const matchesDecision = !decisionFilter || l.status === decisionFilter;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      l.refNumber.toLowerCase().includes(q) ||
      l.employee.nameEn.toLowerCase().includes(q) ||
      l.employee.nameAr.includes(q) ||
      l.doctor.nameEn.toLowerCase().includes(q);
    return matchesDecision && matchesSearch;
  });

  const stats = {
    total:       allDecisions.length,
    approved:    allDecisions.filter((l) => l.status === 'APPROVED').length,
    partial:     allDecisions.filter((l) => l.status === 'PARTIALLY_APPROVED').length,
    rejected:    allDecisions.filter((l) => l.status === 'REJECTED').length,
    examination: allDecisions.filter((l) => l.status === 'EXAMINATION_REQUESTED').length,
  };

  const decisionTag = (status: string) => {
    const cfg: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      APPROVED:              { color: 'green',   icon: <CheckCircleFilled />,      label: t('statuses.approved') },
      PARTIALLY_APPROVED:   { color: 'gold',    icon: <ExclamationCircleFilled />, label: t('statuses.partiallyApproved') },
      REJECTED:              { color: 'red',     icon: <CloseCircleFilled />,       label: t('statuses.rejected') },
      EXAMINATION_REQUESTED:{ color: 'magenta', icon: <MedicineBoxOutlined />,     label: t('statuses.examinationRequested') },
    };
    const c = cfg[status];
    if (!c) return null;
    return (
      <Tag color={c.color} icon={c.icon} style={{ fontSize: 12, padding: '2px 8px', fontWeight: 600 }}>
        {c.label}
      </Tag>
    );
  };

  const columns: ColumnsType<SickLeave> = [
    {
      title: t('decisions.decisionDate'),
      key: 'date',
      render: (_, r) => (
        <Text style={{ fontSize: 12 }}>
          {new Date(r.submittedAt).toLocaleDateString(isAr ? 'ar-JO' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </Text>
      ),
      sorter: (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
      defaultSortOrder: 'ascend',
      width: 110,
    },
    {
      title: t('queue.refNum'),
      key: 'ref',
      render: (_, r) => (
        <a onClick={() => navigate(`/doctor/review/${r.id}`)} style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>
          {r.refNumber}
        </a>
      ),
      width: 130,
    },
    {
      title: t('queue.employee'),
      key: 'employee',
      render: (_, r) => (
        <div>
          <Text strong style={{ fontSize: 13 }}>{isAr ? r.employee.nameAr : r.employee.nameEn}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 11 }}>{isAr ? r.employee.department.nameAr : r.employee.department.nameEn}</Text>
        </div>
      ),
    },
    {
      title: t('queue.period'),
      key: 'period',
      render: (_, r) => (
        <div>
          <Text style={{ fontSize: 11 }}>
            {new Date(r.fromDate).toLocaleDateString(isAr ? 'ar-JO' : 'en-GB', { day: 'numeric', month: 'short' })}
            {' → '}
            {new Date(r.toDate).toLocaleDateString(isAr ? 'ar-JO' : 'en-GB', { day: 'numeric', month: 'short' })}
          </Text>
          <br />
          <span style={{
            display: 'inline-block', width: 22, height: 22, borderRadius: '50%',
            background: '#e6f7ff', border: '2px solid #1890ff',
            textAlign: 'center', lineHeight: '18px', fontSize: 11, fontWeight: 700, color: '#1890ff',
          }}>{r.totalDays}</span>
        </div>
      ),
      width: 120,
    },
    {
      title: t('queue.doctor'),
      key: 'doctor',
      render: (_, r) => (
        <div>
          <Text style={{ fontSize: 12 }}>{isAr ? r.doctor.nameAr : r.doctor.nameEn}</Text>
          <br />
          <Tag style={{ fontSize: 10 }} color={r.doctor.rank === 'SPECIALIST' ? 'cyan' : r.doctor.rank === 'CONSULTANT' ? 'purple' : 'default'}>
            {t(`doctorRanks.${r.doctor.rank.toLowerCase()}`)}
          </Tag>
        </div>
      ),
    },
    {
      title: t('queue.facility'),
      key: 'facility',
      render: (_, r) => (
        <div>
          <Text style={{ fontSize: 12 }}>{isAr ? r.facility.nameAr : r.facility.nameEn}</Text>
          {r.facility.isBlocked && (
            <Tag color="red" style={{ fontSize: 10, marginTop: 2, display: 'block', width: 'fit-content' }}>
              BLOCKED
            </Tag>
          )}
        </div>
      ),
    },
    {
      title: t('decisions.decision'),
      key: 'decision',
      render: (_, r) => decisionTag(r.status),
      width: 160,
    },
    {
      title: t('queue.diagnosis'),
      key: 'diagnosis',
      render: (_, r) => (
        <Tooltip title={r.diagnosis}>
          <Text style={{ fontSize: 12, maxWidth: 100, display: 'block' }} ellipsis>
            {r.diagnosis}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: t('queue.actions'),
      key: 'actions',
      render: (_, r) => (
        <Button
          size="small"
          onClick={() => navigate(`/doctor/review/${r.id}`)}
          style={{ background: GOLD, borderColor: GOLD, color: '#fff', fontSize: 12 }}
        >
          {t('queue.fullReview')}
        </Button>
      ),
      width: 110,
    },
  ];

  const expandedRowRender = (record: SickLeave) => (
    <div style={{ padding: '10px 16px', background: '#fafafa', borderRadius: 6 }}>
      {record.companyDoctorAssessment && (
        <div style={{ marginBottom: 10 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>{t('decision.medicalAssessment')}:</Text>
          <br />
          <Text style={{ fontSize: 13 }}>{record.companyDoctorAssessment}</Text>
        </div>
      )}
      {record.status === 'PARTIALLY_APPROVED' && record.partialApprovalDetails && (
        <Space style={{ marginBottom: 8 }} wrap>
          <Tag color="green">{`${t('common.days')}: ${record.partialApprovalDetails.approvedDays} ✓`}</Tag>
          <Tag color="red">{`${t('common.days')}: ${record.partialApprovalDetails.rejectedDays} ✗`}</Tag>
          <Text type="secondary" style={{ fontSize: 12 }}>— {record.partialApprovalDetails.reason}</Text>
        </Space>
      )}
      {record.companyDoctorInstructions && (
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>{t('decision.instructionsToEmployee')}:</Text>
          <br />
          <Text style={{ fontSize: 13 }}>{record.companyDoctorInstructions}</Text>
        </div>
      )}
      {!record.companyDoctorAssessment && !record.companyDoctorInstructions && (
        <Text type="secondary" style={{ fontSize: 12 }}>{t('decisions.noDetails')}</Text>
      )}
    </div>
  );

  return (
    <div style={{ padding: 24, background: '#f5f6fa', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: NAVY, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
        <Row align="middle">
          <Col flex="1">
            <Title level={3} style={{ color: '#fff', margin: 0 }}>
              <CheckCircleOutlined style={{ color: GOLD, marginInlineEnd: 10 }} />
              {t('decisions.title')}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              {t('decisions.subtitle')}
            </Text>
          </Col>
          <Col>
            <Tag color="gold" style={{ fontSize: 14, padding: '4px 12px' }}>
              {stats.total} {t('decisions.records')}
            </Tag>
          </Col>
        </Row>
      </div>

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
        {[
          { label: t('decisions.total'),              value: stats.total,       color: '#1890ff' },
          { label: t('statuses.approved'),            value: stats.approved,    color: '#52c41a' },
          { label: t('statuses.partiallyApproved'),  value: stats.partial,     color: '#fa8c16' },
          { label: t('statuses.rejected'),            value: stats.rejected,    color: '#ff4d4f' },
          { label: t('statuses.examinationRequested'),value: stats.examination, color: '#eb2f96' },
        ].map((s) => (
          <Col xs={12} sm={8} md={5} key={s.label} style={{ flex: 1 }}>
            <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
              <Statistic
                title={<Text style={{ fontSize: 11 }}>{s.label}</Text>}
                value={s.value}
                valueStyle={{ fontSize: 24, color: s.color, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Filters */}
      <Card style={{ borderRadius: 12, marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col xs={24} sm={8}>
            <Select
              allowClear
              style={{ width: '100%' }}
              placeholder={t('decisions.filterDecision')}
              value={decisionFilter}
              onChange={(v) => setDecisionFilter(v)}
              options={[
                { value: 'APPROVED',              label: t('statuses.approved') },
                { value: 'PARTIALLY_APPROVED',   label: t('statuses.partiallyApproved') },
                { value: 'REJECTED',              label: t('statuses.rejected') },
                { value: 'EXAMINATION_REQUESTED',label: t('statuses.examinationRequested') },
              ]}
            />
          </Col>
          <Col xs={24} sm={10}>
            <Input
              prefix={<SearchOutlined />}
              placeholder={t('decisions.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Button
              icon={<ClearOutlined />}
              onClick={() => { setDecisionFilter(undefined); setSearch(''); }}
            >
              {t('decisions.clearFilters')}
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card style={{ borderRadius: 12 }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          expandable={{ expandedRowRender }}
          size="small"
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showTotal: (total) => `${total} ${t('decisions.records')}`,
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  );
};

export default DecisionsPage;
