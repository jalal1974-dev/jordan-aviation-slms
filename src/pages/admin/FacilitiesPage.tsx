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
  Tooltip,
  notification,
  Space,
  Spin,
  message,
} from 'antd';
import {
  BankOutlined,
  SearchOutlined,
  ClearOutlined,
  StopOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { facilitiesAPI, leavesAPI } from '../../services/api';
import type { Facility } from '../../types';

const { Text, Title } = Typography;
const { Option } = Select;

const FACILITY_TYPE_COLORS: Record<string, string> = {
  GOVERNMENT_HOSPITAL: 'blue',
  PRIVATE_HOSPITAL: 'green',
  UNIVERSITY_HOSPITAL: 'orange',
  ROYAL_MEDICAL_SERVICES: 'purple',
  HEALTH_CENTER: 'teal',
  PRIVATE_CLINIC: 'cyan',
  PRIVATE_24H: 'red',
  SPECIALIZED_CENTER: 'geekblue',
  MILITARY_HOSPITAL: 'navy',
};

const getTrustColor = (score: number | null) => {
  if (score === null) return '#8c8c8c';
  if (score >= 0.7) return '#52c41a';
  if (score >= 0.4) return '#fa8c16';
  return '#ff4d4f';
};

const renderStars = (score: number | null) => {
  if (score === null) return <Text type="secondary" style={{ fontSize: 12 }}>N/A</Text>;
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

const FacilitiesPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      facilitiesAPI.getAll().then((r) => {
        const data = r.data?.data ?? r.data ?? [];
        setFacilities(Array.isArray(data) ? data : []);
      }),
      leavesAPI.getAll().then((r) => {
        const data = r.data?.data ?? r.data ?? [];
        setLeaves(Array.isArray(data) ? data : []);
      }),
    ])
      .catch(() => message.error('Failed to load facilities'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const facilityTypes = [
    'GOVERNMENT_HOSPITAL', 'PRIVATE_HOSPITAL', 'UNIVERSITY_HOSPITAL',
    'ROYAL_MEDICAL_SERVICES', 'HEALTH_CENTER', 'PRIVATE_CLINIC',
    'PRIVATE_24H', 'SPECIALIZED_CENTER', 'MILITARY_HOSPITAL',
  ];

  const typeLabel = (type: string) => {
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
    return map[type] ?? type;
  };

  const getFacilityLeaves = (facId: string) =>
    leaves.filter((l) => l.facility?.id === facId);

  const filtered = useMemo(() => {
    return facilities.filter((f) => {
      if (search) {
        const q = search.toLowerCase();
        if (!f.nameEn.toLowerCase().includes(q) && !f.nameAr.includes(q)) return false;
      }
      if (filterType && f.type !== filterType) return false;
      if (filterStatus === 'blocked' && !f.isBlocked) return false;
      if (filterStatus === 'active' && f.isBlocked) return false;
      return true;
    });
  }, [facilities, search, filterType, filterStatus]);

  const trusted = facilities.filter((f) => (f.trustScore ?? 0) >= 0.7).length;
  const underWatch = facilities.filter(
    (f) => f.trustScore !== null && f.trustScore >= 0.4 && f.trustScore < 0.7
  ).length;
  const blockedCount = facilities.filter((f) => f.isBlocked).length;

  const toggleBlock = async (facility: Facility) => {
    const isBlocked = facility.isBlocked;
    try {
      await facilitiesAPI.toggleBlock(facility.id, { isBlocked: !isBlocked, blockReason: '' });
      notification.success({
        message: isBlocked ? t('facPage.unblockSuccess') : t('facPage.blockSuccess'),
        description: `${isAr ? facility.nameAr : facility.nameEn}`,
      });
      fetchData();
    } catch {
      message.error('Failed to update facility status');
    }
  };

  const expandedRowRender = (record: Facility) => {
    const facLeaves = getFacilityLeaves(record.id);
    return (
      <div style={{ padding: '8px 24px', background: '#fafafa', borderRadius: 8 }}>
        <Row gutter={[24, 12]}>
          <Col xs={24} md={12}>
            <Text strong style={{ fontSize: 13, color: '#001529', display: 'block', marginBottom: 6 }}>
              {t('facPage.recentLeaves')}
            </Text>
            {facLeaves.length === 0 ? (
              <Text type="secondary">{t('facPage.noLeaves')}</Text>
            ) : (
              facLeaves.slice(0, 5).map((l) => (
                <div key={l.id} style={{ fontSize: 12, marginBottom: 4, display: 'flex', gap: 8 }}>
                  <Text style={{ color: '#D4AF37', fontWeight: 600 }}>{l.refNumber}</Text>
                  <Text type="secondary">—</Text>
                  <Text>{isAr ? l.employee?.nameAr : l.employee?.nameEn}</Text>
                  <Tag color={l.status === 'REJECTED' ? 'red' : l.status === 'APPROVED' ? 'green' : 'orange'} style={{ fontSize: 10 }}>
                    {l.status}
                  </Tag>
                </div>
              ))
            )}
          </Col>
          <Col xs={24} md={12}>
            <Text strong style={{ fontSize: 13, color: '#001529', display: 'block', marginBottom: 6 }}>
              {t('facPage.facilityStats')}
            </Text>
            <div style={{ fontSize: 13 }}>
              <div>{t('facPage.totalLeaves')}: <Text strong>{facLeaves.length}</Text></div>
              <div>{t('facPage.flaggedLeaves')}: <Text strong style={{ color: '#ff4d4f' }}>{facLeaves.filter((l) => (l.aiAnalysis?.ruleViolations?.length ?? 0) > 0).length}</Text></div>
              <div>{t('facPage.trustScore')}: <Text strong style={{ color: getTrustColor(record.trustScore) }}>{record.trustScore?.toFixed(2) ?? 'N/A'}</Text></div>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  const columns = [
    {
      title: t('facPage.facility'),
      key: 'name',
      sorter: (a: Facility, b: Facility) => a.nameEn.localeCompare(b.nameEn),
      render: (_: unknown, r: Facility) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {r.isBlocked && <span style={{ fontSize: 13 }}>🚫</span>}
            <Text strong style={{ fontSize: 13, color: r.isBlocked ? '#ff4d4f' : undefined }}>
              {isAr ? r.nameAr : r.nameEn}
            </Text>
          </div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {isAr ? r.nameEn : r.nameAr}
          </Text>
        </div>
      ),
    },
    {
      title: t('facPage.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={FACILITY_TYPE_COLORS[type] ?? 'default'} style={{ fontSize: 11 }}>
          {typeLabel(type)}
        </Tag>
      ),
    },
    {
      title: t('facPage.trustScore'),
      key: 'trust',
      sorter: (a: Facility, b: Facility) => (a.trustScore ?? -1) - (b.trustScore ?? -1),
      render: (_: unknown, r: Facility) => renderStars(r.trustScore),
    },
    {
      title: t('facPage.totalLeaves'),
      dataIndex: 'leavesFromFacility',
      key: 'leaves',
      sorter: (a: Facility, b: Facility) => a.leavesFromFacility - b.leavesFromFacility,
      render: (n: number) => <Text strong>{n}</Text>,
    },
    {
      title: t('facPage.flaggedLeaves'),
      key: 'flagged',
      render: (_: unknown, r: Facility) => {
        const flagged = r.leavesFromFacility > 0
          ? Math.floor(r.leavesFromFacility * (1 - (r.trustScore ?? 1)))
          : 0;
        return (
          <Text strong style={{ color: flagged > 0 ? '#ff4d4f' : '#52c41a' }}>
            {flagged}
          </Text>
        );
      },
    },
    {
      title: t('facPage.flagRate'),
      key: 'flagRate',
      render: (_: unknown, r: Facility) => {
        if (!r.trustScore || r.leavesFromFacility === 0) return <Text type="secondary">—</Text>;
        const rate = Math.round((1 - r.trustScore) * 100);
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
      title: t('facPage.status'),
      key: 'status',
      render: (_: unknown, r: Facility) =>
        r.isBlocked ? (
          <Tag color="red">🚫 {t('facPage.blocked')}</Tag>
        ) : (
          <Tag color="green">{t('facPage.active')}</Tag>
        ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      fixed: 'right' as const,
      render: (_: unknown, r: Facility) => (
        <Space size={4}>
          <Button size="small" icon={<EyeOutlined />}>
            {t('facPage.viewDetails')}
          </Button>
          <Tooltip title={r.isBlocked ? t('facPage.unblock') : t('facPage.block')}>
            <Button
              size="small"
              danger={!r.isBlocked}
              icon={r.isBlocked ? <CheckCircleOutlined /> : <StopOutlined />}
              onClick={() => toggleBlock(r)}
              style={r.isBlocked ? { color: '#52c41a', borderColor: '#52c41a' } : {}}
            >
              {r.isBlocked ? t('facPage.unblock') : t('facPage.block')}
            </Button>
          </Tooltip>
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
            <BankOutlined style={{ marginInlineEnd: 10, color: '#D4AF37' }} />
            {t('facPage.title')}
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            {t('facPage.subtitle')}
          </Text>
        </div>
        <Button
          icon={<PlusOutlined />}
          style={{ background: '#D4AF37', borderColor: '#D4AF37', color: '#fff', fontWeight: 600 }}
          onClick={() => notification.info({ message: t('facPage.comingSoon') })}
        >
          {t('facPage.addFacility')}
        </Button>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}>
          <StatCard title={t('facPage.totalFacilities')} value={facilities.length} accentColor="#1890ff" icon={<BankOutlined />} />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title={t('facPage.trusted')} value={trusted} accentColor="#52c41a" icon={<CheckCircleOutlined />} />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title={t('facPage.underWatch')} value={underWatch} accentColor="#fa8c16" icon={<EyeOutlined />} />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard title={t('facPage.blockedCount')} value={blockedCount} accentColor="#ff4d4f" icon={<StopOutlined />} />
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
              placeholder={t('facPage.searchPlaceholder')}
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={12} sm={7} md={5}>
            <Select
              placeholder={t('facPage.filterType')}
              value={filterType || undefined}
              onChange={setFilterType}
              style={{ width: '100%' }}
              allowClear
            >
              {facilityTypes.map((type) => (
                <Option key={type} value={type}>{typeLabel(type)}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={12} sm={7} md={5}>
            <Select
              placeholder={t('facPage.filterStatus')}
              value={filterStatus || undefined}
              onChange={setFilterStatus}
              style={{ width: '100%' }}
              allowClear
            >
              <Option value="active">{t('facPage.active')}</Option>
              <Option value="blocked">{t('facPage.blocked')}</Option>
            </Select>
          </Col>
          <Col xs={24} sm={4} md={3}>
            <Button
              icon={<ClearOutlined />}
              onClick={() => { setSearch(''); setFilterType(''); setFilterStatus(''); }}
            >
              {t('facPage.clear')}
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
          pagination={{ pageSize: 10, showTotal: (total) => `${total} ${t('facPage.facilities')}` }}
          scroll={{ x: 1000 }}
          size="small"
          rowClassName={(record) => {
            if (record.isBlocked) return 'row-blocked';
            if (record.trustScore !== null && record.trustScore < 0.4) return 'row-warning';
            return '';
          }}
        />
      </Card>

      <style>{`
        .row-blocked td { background: #fff1f0 !important; }
        .row-warning td { background: #fffbe6 !important; }
      `}</style>
    </div>
  );
};

export default FacilitiesPage;
