import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Row, Col, Table, Tag, Button, Statistic,
  Typography, Space, Progress, Alert, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { BankOutlined, StopOutlined } from '@ant-design/icons';
import {
  PieChart, Pie, Cell, Legend, Tooltip as RTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { facilitiesAPI, leavesAPI } from '../../services/api';
import type { Facility } from '../../types';
import { mockFacilities, mockSickLeaves } from '../../services/mockData';

const { Title, Text } = Typography;
const NAVY = '#0a1628';
const GOLD  = '#D4AF37';

interface FacilityWithStats extends Facility {
  flagRate:     number;
  flaggedCount: number;
}

const trustStars = (score: number | null) => {
  if (score === null) return <Text type="secondary" style={{ fontSize: 12 }}>—</Text>;
  const filled = Math.round(score * 5);
  const color  = score >= 0.7 ? '#52c41a' : score >= 0.4 ? '#faad14' : '#ff4d4f';
  return (
    <span style={{ fontSize: 14, color }}>
      {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
      <Text style={{ fontSize: 11, color, marginInlineStart: 4 }}>({Math.round(score * 100)}%)</Text>
    </span>
  );
};

const TYPE_COLORS: Record<string, string> = {
  GOVERNMENT_HOSPITAL:    '#1890ff',
  PRIVATE_HOSPITAL:       '#52c41a',
  PRIVATE_CLINIC:         '#13c2c2',
  HEALTH_CENTER:          '#0abab5',
  PRIVATE_24H:            '#ff4d4f',
  ROYAL_MEDICAL_SERVICES: '#722ed1',
  UNIVERSITY_HOSPITAL:    '#fa8c16',
  SPECIALIZED_CENTER:     '#eb2f96',
  MILITARY_HOSPITAL:      '#595959',
};

const rankMedal = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`);

const FacilitiesAnalysis: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr         = i18n.language === 'ar';

  /* ── Build enriched facility list ── */
  const enriched: FacilityWithStats[] = mockFacilities.map((f) => {
    const leaves      = mockSickLeaves.filter((l) => l.facility.id === f.id);
    const flaggedCount = leaves.filter((l) => (l.aiAnalysis?.ruleViolations?.length ?? 0) > 0).length;
    const flagRate     = leaves.length > 0 ? flaggedCount / leaves.length : 0;
    return { ...f, flagRate, flaggedCount };
  });

  const sorted = [...enriched].sort((a, b) => (b.trustScore ?? -1) - (a.trustScore ?? -1));

  /* ── Stats ── */
  const trusted  = enriched.filter((f) => f.trustScore !== null && f.trustScore > 0.7);
  const blocked  = enriched.filter((f) => f.isBlocked);
  const withScore = enriched.filter((f) => f.trustScore !== null);
  const avgTrust = withScore.length
    ? withScore.reduce((s, f) => s + (f.trustScore ?? 0), 0) / withScore.length
    : 0;

  /* ── Pie chart ── */
  const typeCount: Record<string, number> = {};
  enriched.forEach((f) => { typeCount[f.type] = (typeCount[f.type] ?? 0) + 1; });
  const pieData = Object.entries(typeCount).map(([type, count]) => ({
    name:  type.replace(/_/g, ' ').split(' ').map((w) => w[0] + w.slice(1).toLowerCase()).join(' '),
    value: count,
    fill:  TYPE_COLORS[type] ?? '#8c8c8c',
  }));

  /* ── Bar chart ── */
  const barData = [...enriched]
    .sort((a, b) => b.leavesFromFacility - a.leavesFromFacility)
    .map((f) => ({
      name:   (isAr ? f.nameAr : f.nameEn).substring(0, 20),
      leaves: f.leavesFromFacility,
      fill:   (f.trustScore ?? 0) >= 0.7 ? '#52c41a' : (f.trustScore ?? 0) >= 0.4 ? '#faad14' : '#ff4d4f',
    }));

  /* ── High risk ── */
  const highRisk = enriched.filter(
    (f) => f.isBlocked || f.flagRate > 0.3 || (f.trustScore !== null && f.trustScore < 0.5),
  );

  /* ── Table columns ── */
  const columns: ColumnsType<FacilityWithStats> = [
    {
      title: '#', key: 'rank',
      render: (_, _r, i) => <Text style={{ fontSize: 16 }}>{rankMedal(i)}</Text>,
      width: 48,
    },
    {
      title: t('facilities.name'), key: 'name',
      render: (_, r) => (
        <Space>
          <Text strong style={{ fontSize: 13 }}>{isAr ? r.nameAr : r.nameEn}</Text>
          {r.isBlocked && <Tag color="red" icon={<StopOutlined />}>BLOCKED</Tag>}
          {r.isNew     && <Tag color="blue">NEW</Tag>}
        </Space>
      ),
    },
    {
      title: t('facilities.type'), key: 'type',
      render: (_, r) => (
        <Tag color={TYPE_COLORS[r.type] ?? '#8c8c8c'} style={{ fontSize: 11 }}>
          {r.type.replace(/_/g, ' ')}
        </Tag>
      ),
    },
    {
      title: t('facilities.trustScore'), key: 'trust',
      render: (_, r) => trustStars(r.trustScore),
      sorter: (a, b) => (a.trustScore ?? -1) - (b.trustScore ?? -1),
    },
    {
      title: t('facilities.totalLeaves'), key: 'leaves',
      dataIndex: 'leavesFromFacility',
      sorter: (a, b) => a.leavesFromFacility - b.leavesFromFacility,
      width: 80,
    },
    {
      title: t('facilities.flagged'), key: 'flagged', width: 70,
      render: (_, r) => (
        <Text style={{ color: r.flaggedCount > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>
          {r.flaggedCount}
        </Text>
      ),
    },
    {
      title: t('facilities.flagRate'), key: 'flagRate',
      render: (_, r) => (
        <Progress
          percent={Math.round(r.flagRate * 100)}
          size="small"
          strokeColor={r.flagRate < 0.2 ? '#52c41a' : r.flagRate < 0.5 ? '#faad14' : '#ff4d4f'}
          style={{ width: 90 }}
        />
      ),
    },
    {
      title: t('facilities.status'), key: 'status', width: 80,
      render: (_, r) => (
        <Tag color={r.isBlocked ? 'red' : 'green'}>
          {r.isBlocked ? t('facilities.blocked') : t('facilities.active')}
        </Tag>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f5f6fa', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: NAVY, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          <BankOutlined style={{ color: GOLD, marginInlineEnd: 10 }} />
          {t('facilities.title')}
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{t('facilities.subtitle')}</Text>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { label: t('facilities.total'),    value: enriched.length,         color: '#1890ff' },
          { label: t('facilities.trusted'),  value: trusted.length,          color: '#52c41a' },
          { label: t('facilities.blocked'),  value: blocked.length,          color: '#ff4d4f' },
          { label: t('facilities.avgTrust'), value: `${Math.round(avgTrust * 100)}%`, color: '#8c8c8c' },
        ].map((s) => (
          <Col xs={12} md={6} key={s.label}>
            <Card size="small" style={{ borderRadius: 10, textAlign: 'center' }}>
              <Statistic
                title={<Text style={{ fontSize: 12 }}>{s.label}</Text>}
                value={s.value}
                valueStyle={{ fontSize: 24, color: s.color, fontWeight: 700 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Trust Ranking Table */}
      <Card
        title={<Text strong style={{ color: NAVY }}>{t('facilities.trustRanking')}</Text>}
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Table
          columns={columns}
          dataSource={sorted}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 800 }}
          onRow={(record) => ({
            style: { background: record.isBlocked ? '#fff1f0' : undefined },
          })}
        />
      </Card>

      {/* Pie + High Risk */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={<Text strong style={{ color: NAVY }}>{t('facilities.typeDistribution')}</Text>}
            style={{ borderRadius: 12 }}
          >
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={95}
                  labelLine={false}
                  label={(props: import('recharts').PieLabelRenderProps) => `${Math.round((props.percent ?? 0) * 100)}%`}
                >
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={<Text strong style={{ color: '#cf1322' }}>⚠️ {t('facilities.highRisk')}</Text>}
            style={{ borderRadius: 12, borderTop: '4px solid #ff4d4f' }}
          >
            {highRisk.length === 0 ? (
              <Alert message={t('facilities.allClear')} type="success" showIcon />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size={10}>
                {highRisk.map((f) => (
                  <div
                    key={f.id}
                    style={{ border: '1px solid #ffa39e', borderRadius: 8, padding: 10, background: '#fff1f0' }}
                  >
                    <Row justify="space-between" align="middle">
                      <Col flex="1">
                        <Space>
                          <Text strong style={{ fontSize: 13 }}>{isAr ? f.nameAr : f.nameEn}</Text>
                          {f.isBlocked && <Tag color="red" icon={<StopOutlined />}>BLOCKED</Tag>}
                        </Space>
                        <br />
                        {trustStars(f.trustScore)}
                      </Col>
                      <Col>
                        <Button
                          danger
                          size="small"
                          onClick={() => message.warning(`${t('facilities.blacklistNotif')}: ${isAr ? f.nameAr : f.nameEn}`)}
                        >
                          {t('facilities.recommendBlacklist')}
                        </Button>
                      </Col>
                    </Row>
                    <Progress
                      percent={Math.round(f.flagRate * 100)}
                      size="small"
                      strokeColor="#ff4d4f"
                      style={{ marginTop: 8 }}
                      format={(p) => `${p}% ${t('facilities.flagRate')}`}
                    />
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* Leaves by Facility bar chart */}
      <Card
        title={<Text strong style={{ color: NAVY }}>{t('facilities.leavesByFacility')}</Text>}
        style={{ borderRadius: 12 }}
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 24, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
            <RTooltip />
            <Bar dataKey="leaves" radius={[0, 4, 4, 0]}>
              {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default FacilitiesAnalysis;
