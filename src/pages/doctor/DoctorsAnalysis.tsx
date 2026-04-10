import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Row, Col, Table, Tag, Button, Statistic,
  Typography, Space, Progress, Alert, message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { TeamOutlined } from '@ant-design/icons';
import {
  PieChart, Pie, Cell, Legend, Tooltip as RTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
} from 'recharts';
import { doctorsAPI, leavesAPI } from '../../services/api';
import type { Doctor, SickLeave } from '../../types';

const { Title, Text } = Typography;
const NAVY = '#0a1628';
const GOLD  = '#D4AF37';

interface DoctorWithStats extends Doctor {
  flagRate:     number;
  topFacility:  string;
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

const RANK_COLOR: Record<string, string> = {
  GP:         'default',
  RESIDENT:   'default',
  SPECIALIST: 'cyan',
  CONSULTANT: 'purple',
};

const rankMedal = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`);

const DoctorsAnalysis: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr         = i18n.language === 'ar';

  /* ── Enrich doctors with computed stats ── */
  const enriched: DoctorWithStats[] = mockDoctors.map((d) => {
    const flagRate = d.leavesIssued > 0 ? d.leavesFlagged / d.leavesIssued : 0;
    const leaves   = mockSickLeaves.filter((l) => l.doctor.id === d.id);
    const topFacility = leaves.length > 0
      ? (isAr ? leaves[0].facility.nameAr : leaves[0].facility.nameEn)
      : '—';
    return { ...d, flagRate, topFacility };
  });

  /* Sort: nulls (new) at bottom, rest by trustScore desc */
  const sorted = [...enriched].sort((a, b) => {
    if (a.trustScore === null && b.trustScore === null) return 0;
    if (a.trustScore === null) return 1;
    if (b.trustScore === null) return -1;
    return b.trustScore - a.trustScore;
  });

  /* ── Stats ── */
  const trusted   = enriched.filter((d) => d.trustScore !== null && d.trustScore > 0.7);
  const lowTrust  = enriched.filter((d) => d.trustScore !== null && d.trustScore < 0.4);
  const newDocs   = enriched.filter((d) => d.isNew || (d.trustScore === null && d.leavesIssued === 0));

  /* ── Pie chart — rank distribution ── */
  const rankCount: Record<string, number> = { GP: 0, SPECIALIST: 0, CONSULTANT: 0, RESIDENT: 0 };
  enriched.forEach((d) => { rankCount[d.rank] = (rankCount[d.rank] ?? 0) + 1; });
  const RANK_PIE_COLORS: Record<string, string> = {
    GP: '#8c8c8c', SPECIALIST: '#13c2c2', CONSULTANT: '#722ed1', RESIDENT: '#fa8c16',
  };
  const pieData = Object.entries(rankCount)
    .filter(([, count]) => count > 0)
    .map(([rank, count]) => ({
      name:  t(`doctorRanks.${rank.toLowerCase()}`),
      value: count,
      fill:  RANK_PIE_COLORS[rank] ?? '#595959',
    }));

  /* ── Bar chart — leaves by doctor ── */
  const barData = [...enriched]
    .sort((a, b) => b.leavesIssued - a.leavesIssued)
    .map((d) => ({
      name:   (isAr ? d.nameAr : d.nameEn).substring(0, 18),
      leaves: d.leavesIssued,
      fill:   d.trustScore === null ? '#8c8c8c'
            : d.trustScore >= 0.7   ? '#52c41a'
            : d.trustScore >= 0.4   ? '#faad14'
            : '#ff4d4f',
    }));

  /* ── High risk ── */
  const highRisk = enriched.filter(
    (d) => (d.trustScore !== null && d.trustScore < 0.5) || d.flagRate > 0.3,
  );

  /* ── Table columns ── */
  const columns: ColumnsType<DoctorWithStats> = [
    {
      title: '#', key: 'rank',
      render: (_, _r, i) => <Text style={{ fontSize: 16 }}>{rankMedal(i)}</Text>,
      width: 48,
    },
    {
      title: t('doctors.name'), key: 'name',
      render: (_, r) => (
        <Space>
          <Text strong style={{ fontSize: 13 }}>{isAr ? r.nameAr : r.nameEn}</Text>
          {r.isNew && <Tag color="blue" style={{ fontSize: 10 }}>NEW</Tag>}
        </Space>
      ),
    },
    {
      title: t('doctors.rank'), key: 'drRank',
      render: (_, r) => (
        <Tag color={RANK_COLOR[r.rank] ?? 'default'} style={{ fontSize: 11 }}>
          {t(`doctorRanks.${r.rank.toLowerCase()}`)}
        </Tag>
      ),
    },
    {
      title: t('doctors.specialty'), key: 'specialty',
      dataIndex: 'specialty',
      render: (v) => <Text style={{ fontSize: 12 }}>{v}</Text>,
    },
    {
      title: t('doctors.trustScore'), key: 'trust',
      render: (_, r) => trustStars(r.trustScore),
      sorter: (a, b) => (a.trustScore ?? -1) - (b.trustScore ?? -1),
    },
    {
      title: t('doctors.totalLeaves'), key: 'leaves',
      dataIndex: 'leavesIssued',
      sorter: (a, b) => a.leavesIssued - b.leavesIssued,
      width: 90,
    },
    {
      title: t('doctors.flagged'), key: 'flagged',
      dataIndex: 'leavesFlagged',
      render: (v: number) => (
        <Text style={{ color: v > 0 ? '#ff4d4f' : '#52c41a', fontWeight: 600 }}>{v}</Text>
      ),
      width: 70,
    },
    {
      title: t('doctors.flagRate'), key: 'flagRate',
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
      title: t('doctors.topFacility'), key: 'facility',
      render: (_, r) => <Text style={{ fontSize: 12 }}>{r.topFacility}</Text>,
    },
  ];

  return (
    <div style={{ padding: 24, background: '#f5f6fa', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{ background: NAVY, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
        <Title level={3} style={{ color: '#fff', margin: 0 }}>
          <TeamOutlined style={{ color: GOLD, marginInlineEnd: 10 }} />
          {t('doctors.title')}
        </Title>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>{t('doctors.subtitle')}</Text>
      </div>

      {/* Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { label: t('doctors.total'),    value: enriched.length, color: '#1890ff' },
          { label: t('doctors.trusted'),  value: trusted.length,  color: '#52c41a' },
          { label: t('doctors.lowTrust'), value: lowTrust.length, color: '#ff4d4f' },
          { label: t('doctors.newDocs'),  value: newDocs.length,  color: '#1890ff' },
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
        title={<Text strong style={{ color: NAVY }}>{t('doctors.trustRanking')}</Text>}
        style={{ borderRadius: 12, marginBottom: 16 }}
      >
        <Table
          columns={columns}
          dataSource={sorted}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 900 }}
          onRow={(record) => ({
            style: {
              background:
                record.trustScore !== null && record.trustScore < 0.4
                  ? '#fff1f0'
                  : record.isNew
                  ? '#e6f7ff'
                  : undefined,
            },
          })}
        />
      </Card>

      {/* Pie + High Risk */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card
            title={<Text strong style={{ color: NAVY }}>{t('doctors.rankDistribution')}</Text>}
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
                  label={({ name, percent }) => `${name}: ${Math.round(percent * 100)}%`}
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
            title={<Text strong style={{ color: '#cf1322' }}>⚠️ {t('doctors.highRisk')}</Text>}
            style={{ borderRadius: 12, borderTop: '4px solid #ff4d4f' }}
          >
            {highRisk.length === 0 ? (
              <Alert message={t('doctors.allClear')} type="success" showIcon />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size={10}>
                {highRisk.map((d) => (
                  <div
                    key={d.id}
                    style={{ border: '1px solid #ffa39e', borderRadius: 8, padding: 10, background: '#fff1f0' }}
                  >
                    <Row justify="space-between" align="middle">
                      <Col flex="1">
                        <Space wrap>
                          <Text strong style={{ fontSize: 13 }}>{isAr ? d.nameAr : d.nameEn}</Text>
                          <Tag color={RANK_COLOR[d.rank] ?? 'default'} style={{ fontSize: 11 }}>
                            {t(`doctorRanks.${d.rank.toLowerCase()}`)}
                          </Tag>
                        </Space>
                        <br />
                        <Text type="secondary" style={{ fontSize: 11 }}>{d.specialty}</Text>
                        <br />
                        {trustStars(d.trustScore)}
                      </Col>
                      <Col>
                        <Button
                          danger
                          size="small"
                          onClick={() => message.warning(`${t('doctors.blacklistNotif')}: ${isAr ? d.nameAr : d.nameEn}`)}
                        >
                          {t('doctors.recommendBlacklist')}
                        </Button>
                      </Col>
                    </Row>
                    <Progress
                      percent={Math.round(d.flagRate * 100)}
                      size="small"
                      strokeColor="#ff4d4f"
                      style={{ marginTop: 8 }}
                      format={(p) => `${p}% ${t('doctors.flagRate')}`}
                    />
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>

      {/* Leaves by Doctor bar chart */}
      <Card
        title={<Text strong style={{ color: NAVY }}>{t('doctors.leavesByDoctor')}</Text>}
        style={{ borderRadius: 12 }}
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <RTooltip />
            <Bar dataKey="leaves" radius={[4, 4, 0, 0]}>
              {barData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
};

export default DoctorsAnalysis;
