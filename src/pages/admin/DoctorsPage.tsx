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
  notification,
  Space,
  Badge,
} from 'antd';
import {
  MedicineBoxOutlined,
  SearchOutlined,
  ClearOutlined,
  EyeOutlined,
  FlagOutlined,
  FileTextOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { doctorsAPI, leavesAPI, facilitiesAPI } from '../../services/api';
import type { Doctor, SickLeave, Facility } from '../../types';

const { Text, Title } = Typography;
const { Option } = Select;

const RANK_COLORS: Record<string, string> = {
  GP: 'default',
  RESIDENT: 'blue',
  SPECIALIST: 'cyan',
  CONSULTANT: 'purple',
};

const getTrustColor = (score: number | null) => {
  if (score === null) return '#8c8c8c';
  if (score >= 0.7) return '#52c41a';
  if (score >= 0.4) return '#fa8c16';
  return '#ff4d4f';
};

const renderStars = (score: number | null) => {
  if (score === null)
    return (
      <div>
        <Text type="secondary" style={{ fontSize: 12 }}>N/A</Text>
        <br />
        <Badge count="NEW" style={{ background: '#1890ff', fontSize: 10 }} />
      </div>
    );
  const filled = Math.round(score * 5);
  const color = getTrustColor(score);
  return (
    <div>
      <span style={{ color, fontSize: 13, letterSpacing: 1 }}>
        {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
      </span>
      <br />
      <Text style={{ fontSize: 11, color, fontWeight: 600 }}>{score.toFixed(2)}</Text>
    </div>
  );
};

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

const DoctorsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [filterRank, setFilterRank] = useState('');

  const getDoctorLeaves = (docId: string) =>
    mockSickLeaves.filter((l) => l.doctor.id === docId);

  const getAssociatedFacilities = (docId: string) => {
    const leaves = getDoctorLeaves(docId);
    const facIds = [...new Set(leaves.map((l) => l.facility.id))];
    return facIds.map((id) => mockFacilities.find((f) => f.id === id)).filter(Boolean);
  };

  const filtered = useMemo(() => {
    return mockDoctors.filter((d) => {
      if (search) {
        const q = search.toLowerCase();
        if (!d.nameEn.toLowerCase().includes(q) && !d.nameAr.includes(q)) return false;
      }
      if (filterRank && d.rank !== filterRank) return false;
      return true;
    });
  }, [search, filterRank]);

  const trusted = mockDoctors.filter((d) => (d.trustScore ?? 0) >= 0.7).length;
  const underWatch = mockDoctors.filter(
    (d) => d.trustScore !== null && d.trustScore >= 0.4 && d.trustScore < 0.7
  ).length;
  const lowTrust = mockDoctors.filter(
    (d) => d.trustScore !== null && d.trustScore < 0.4
  ).length;
  const newDoctors = mockDoctors.filter((d) => d.isNew || d.trustScore === null).length;

  const expandedRowRender = (record: Doctor) => {
    const leaves = getDoctorLeaves(record.id);
    const facilities = getAssociatedFacilities(record.id);

    return (
      <div style={{ padding: '8px 24px', background: '#fafafa', borderRadius: 8 }}>
        <Row gutter={[24, 12]}>
          <Col xs={24} md={12}>
            <Text strong style={{ fontSize: 13, color: '#001529', display: 'block', marginBottom: 6 }}>
              {t('docPage.leaveHistory')}
            </Text>
            {leaves.length === 0 ? (
              <Text type="secondary">{t('docPage.noLeaves')}</Text>
            ) : (
              leaves.slice(0, 5).map((l) => (
                <div key={l.id} style={{ fontSize: 12, marginBottom: 4, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Text style={{ color: '#D4AF37', fontWeight: 600 }}>{l.refNumber}</Text>
                  <Text type="secondary">—</Text>
                  <Text>{isAr ? l.employee.nameAr : l.employee.nameEn}</Text>
                  <Tag
                    color={l.status === 'REJECTED' ? 'red' : l.status === 'APPROVED' ? 'green' : 'orange'}
                    style={{ fontSize: 10 }}
                  >
                    {l.status}
                  </Tag>
                </div>
              ))
            )}
          </Col>
          <Col xs={24} md={12}>
            <Text strong style={{ fontSize: 13, color: '#001529', display: 'block', marginBottom: 6 }}>
              {t('docPage.associatedFacilities')}
            </Text>
            {facilities.length === 0 ? (
              <Text type="secondary">{t('docPage.noFacilities')}</Text>
            ) : (
              facilities.map((f) => f && (
                <div key={f.id} style={{ marginBottom: 4, fontSize: 12 }}>
                  <Text>{isAr ? f.nameAr : f.nameEn}</Text>
                  {f.isBlocked && <Tag color="red" style={{ marginInlineStart: 6, fontSize: 10 }}>BLOCKED</Tag>}
                </div>
              ))
            )}
            {record.licenseNumber && (
              <div style={{ marginTop: 8, fontSize: 12 }}>
                <Text type="secondary">{t('docPage.licenseNum')}: </Text>
                <Text strong>{record.licenseNumber}</Text>
              </div>
            )}
          </Col>
        </Row>
      </div>
    );
  };

  const columns = [
    {
      title: t('docPage.doctor'),
      key: 'name',
      sorter: (a: Doctor, b: Doctor) => a.nameEn.localeCompare(b.nameEn),
      render: (_: unknown, r: Doctor) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Text strong style={{ fontSize: 13 }}>{isAr ? r.nameAr : r.nameEn}</Text>
            {r.isNew && (
              <Badge
                count="NEW"
                style={{ background: '#1890ff', fontSize: 9, lineHeight: '14px', height: 14, minWidth: 28 }}
              />
            )}
          </div>
          <Text type="secondary" style={{ fontSize: 11 }}>{isAr ? r.nameEn : r.nameAr}</Text>
        </div>
      ),
    },
    {
      title: t('docPage.rank'),
      dataIndex: 'rank',
      key: 'rank',
      render: (rank: string) => (
        <Tag color={RANK_COLORS[rank] ?? 'default'} style={{ fontSize: 11 }}>
          {t(`doctorRanks.${rank.toLowerCase()}`)}
        </Tag>
      ),
    },
    {
      title: t('docPage.specialty'),
      dataIndex: 'specialty',
      key: 'specialty',
      render: (s: string) => <Text style={{ fontSize: 12 }}>{s}</Text>,
    },
    {
      title: t('docPage.trustScore'),
      key: 'trust',
      sorter: (a: Doctor, b: Doctor) => (a.trustScore ?? -1) - (b.trustScore ?? -1),
      render: (_: unknown, r: Doctor) => renderStars(r.trustScore),
    },
    {
      title: t('docPage.leavesIssued'),
      dataIndex: 'leavesIssued',
      key: 'issued',
      sorter: (a: Doctor, b: Doctor) => a.leavesIssued - b.leavesIssued,
      render: (n: number) => <Text strong>{n}</Text>,
    },
    {
      title: t('docPage.flaggedLeaves'),
      dataIndex: 'leavesFlagged',
      key: 'flagged',
      sorter: (a: Doctor, b: Doctor) => a.leavesFlagged - b.leavesFlagged,
      render: (n: number) => (
        <Text strong style={{ color: n > 0 ? '#ff4d4f' : '#52c41a' }}>{n}</Text>
      ),
    },
    {
      title: t('docPage.flagRate'),
      key: 'rate',
      render: (_: unknown, r: Doctor) => {
        if (r.leavesIssued === 0) return <Text type="secondary">—</Text>;
        const rate = Math.round((r.leavesFlagged / r.leavesIssued) * 100);
        return (
          <div style={{ minWidth: 80 }}>
            <Text style={{ fontSize: 11 }}>{rate}%</Text>
            <Progress
              percent={rate}
              showInfo={false}
              size="small"
              strokeColor={rate > 50 ? '#ff4d4f' : rate > 20 ? '#fa8c16' : '#52c41a'}
            />
          </div>
        );
      },
    },
    {
      title: t('docPage.license'),
      dataIndex: 'licenseNumber',
      key: 'license',
      render: (n: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>{n ?? '—'}</Text>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      fixed: 'right' as const,
      render: (_: unknown, r: Doctor) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />}>
            {t('docPage.viewDetails')}
          </Button>
          <Button
            size="small"
            danger
            icon={<FlagOutlined />}
            onClick={() =>
              notification.warning({
                message: t('docPage.flagged'),
                description: `${isAr ? r.nameAr : r.nameEn} ${t('docPage.flaggedDesc')}`,
              })
            }
          >
            {t('docPage.flag')}
          </Button>
          <Button size="small" icon={<FileTextOutlined />}>
            {t('docPage.viewLeaves')}
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
            <MedicineBoxOutlined style={{ marginInlineEnd: 10, color: '#D4AF37' }} />
            {t('docPage.title')}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('docPage.subtitle')}
          </Text>
        </div>
        <Button
          icon={<PlusOutlined />}
          style={{ background: '#D4AF37', borderColor: '#D4AF37', color: '#fff', fontWeight: 600 }}
          onClick={() => notification.info({ message: t('docPage.comingSoon') })}
        >
          {t('docPage.addDoctor')}
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6} md={24 / 5}>
          <StatCard title={t('docPage.totalDoctors')} value={mockDoctors.length} accentColor="#1890ff" icon={<MedicineBoxOutlined />} />
        </Col>
        <Col xs={12} sm={6} md={24 / 5}>
          <StatCard title={t('docPage.trusted')} value={trusted} accentColor="#52c41a" icon={<MedicineBoxOutlined />} />
        </Col>
        <Col xs={12} sm={6} md={24 / 5}>
          <StatCard title={t('docPage.underWatch')} value={underWatch} accentColor="#fa8c16" icon={<FlagOutlined />} />
        </Col>
        <Col xs={12} sm={6} md={24 / 5}>
          <StatCard title={t('docPage.lowTrust')} value={lowTrust} accentColor="#ff4d4f" icon={<FlagOutlined />} />
        </Col>
        <Col xs={12} sm={6} md={24 / 5}>
          <StatCard title={t('docPage.newDoctors')} value={newDoctors} accentColor="#8c8c8c" icon={<MedicineBoxOutlined />} />
        </Col>
      </Row>

      {/* Filters */}
      <Card
        size="small"
        style={{ borderRadius: 10, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
      >
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} md={10}>
            <Input
              placeholder={t('docPage.searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={7} md={6}>
            <Select
              placeholder={t('docPage.filterRank')}
              value={filterRank || undefined}
              onChange={setFilterRank}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="GP">{t('doctorRanks.gp')}</Option>
              <Option value="RESIDENT">{t('doctorRanks.resident')}</Option>
              <Option value="SPECIALIST">{t('doctorRanks.specialist')}</Option>
              <Option value="CONSULTANT">{t('doctorRanks.consultant')}</Option>
            </Select>
          </Col>
          <Col xs={12} sm={4} md={3}>
            <Button
              icon={<ClearOutlined />}
              onClick={() => { setSearch(''); setFilterRank(''); }}
            >
              {t('docPage.clear')}
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
          pagination={{ pageSize: 10, showTotal: (total) => `${total} ${t('docPage.doctors')}` }}
          scroll={{ x: 1100 }}
          size="small"
          rowClassName={(record) => {
            if (record.trustScore !== null && record.trustScore < 0.4) return 'row-low-trust';
            if (record.isNew || record.trustScore === null) return 'row-new-doctor';
            return '';
          }}
        />
      </Card>

      <style>{`
        .row-low-trust td { background: #fff1f0 !important; }
        .row-new-doctor td { background: #e6f7ff !important; }
      `}</style>
    </div>
  );
};

export default DoctorsPage;
