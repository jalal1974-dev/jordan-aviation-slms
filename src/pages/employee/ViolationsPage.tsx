import React, { useMemo } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Alert,
  Typography,
} from 'antd';
import {
  WarningOutlined,
  CheckCircleOutlined,
  SafetyOutlined,
  FileProtectOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { penaltiesAPI } from '../../services/api';
import type { Violation } from '../../types';

const { Text, Title, Paragraph } = Typography;

const VIOLATION_INFO: Record<number, { label: string; labelAr: string; penaltyEn: string; penaltyAr: string; color: string }> = {
  1: { label: '1st Violation', labelAr: 'المخالفة الأولى', penaltyEn: '2 Work Days Salary Deduction', penaltyAr: 'خصم راتب يومين', color: '#fa8c16' },
  2: { label: '2nd Violation', labelAr: 'المخالفة الثانية', penaltyEn: 'Written Warning', penaltyAr: 'إنذار كتابي', color: '#ff4d4f' },
  3: { label: '3rd Violation', labelAr: 'المخالفة الثالثة', penaltyEn: 'Final Warning', penaltyAr: 'إنذار نهائي', color: '#8b0000' },
};

const ViolationsPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const { user } = useAuthStore();

  const [violations, setViolations] = useState<Violation[]>([]);

  useEffect(() => {
    penaltiesAPI.getAll().then((r) => {
      const data: unknown[] = r.data?.data ?? r.data?.penalties ?? r.data ?? [];
      setViolations(Array.isArray(data) ? (data as Violation[]) : []);
    }).catch(() => {});
  }, [user]);

  const maxViolation = violations.reduce((m, v) => Math.max(m, v.violationNumber), 0);

  const expandedRowRender = (record: Violation) => {
    const info = VIOLATION_INFO[record.violationNumber];
    return (
      <div style={{ padding: '8px 24px', background: '#fafafa' }}>
        <Row gutter={[24, 8]}>
          <Col xs={24} md={12}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
              {t('violations.penaltyDetails')}
            </Text>
            <div style={{ fontSize: 13 }}>
              <div>{t('violations.penaltyType')}: <Text strong style={{ color: info?.color }}>{isAr ? info?.penaltyAr : info?.penaltyEn}</Text></div>
              {record.penaltyDays && (
                <div>{t('violations.deductionDays')}: <Text strong style={{ color: '#ff4d4f' }}>{record.penaltyDays} {t('violations.days')}</Text></div>
              )}
              <div>{t('violations.description')}: <Text>{record.description}</Text></div>
            </div>
          </Col>
          <Col xs={24} md={12}>
            <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 4 }}>
              {t('violations.relatedLeave')}
            </Text>
            <div style={{ fontSize: 13 }}>
              <div>{t('violations.leaveRef')}: <Text style={{ color: '#D4AF37', fontWeight: 600 }}>{record.leave?.refNumber ?? '—'}</Text></div>
              <div>{t('violations.date')}: <Text>{new Date(record.date).toLocaleDateString('en-GB')}</Text></div>
            </div>
          </Col>
        </Row>
      </div>
    );
  };

  const columns = [
    {
      title: t('violations.violationNum'),
      dataIndex: 'violationNumber',
      key: 'num',
      render: (n: number) => {
        const info = VIOLATION_INFO[n];
        return <Tag color={info?.color ?? 'default'}>{isAr ? info?.labelAr : info?.label}</Tag>;
      },
    },
    {
      title: t('violations.leaveRef'),
      key: 'ref',
      render: (_: unknown, r: Violation) => (
        <Text style={{ color: '#D4AF37', fontWeight: 600 }}>{r.leave?.refNumber ?? '—'}</Text>
      ),
    },
    {
      title: t('violations.penaltyType'),
      key: 'penalty',
      render: (_: unknown, r: Violation) => {
        const info = VIOLATION_INFO[r.violationNumber];
        return <Text style={{ color: info?.color ?? undefined }}>{isAr ? info?.penaltyAr : info?.penaltyEn}</Text>;
      },
    },
    {
      title: t('violations.deductionDays'),
      dataIndex: 'penaltyDays',
      key: 'days',
      render: (d?: number) => (
        <Text style={{ color: d ? '#ff4d4f' : '#8c8c8c' }}>{d ? `${d} ${t('violations.days')}` : 'N/A'}</Text>
      ),
    },
    {
      title: t('violations.date'),
      dataIndex: 'date',
      key: 'date',
      render: (d: Date) => new Date(d).toLocaleDateString('en-GB'),
    },
  ];

  if (violations.length === 0) {
    return (
      <div className="fade-in" style={{ padding: '0 0 32px' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={3} style={{ margin: 0, color: '#001529' }}>
            <WarningOutlined style={{ marginInlineEnd: 10, color: '#D4AF37' }} />
            {t('violations.title')}
          </Title>
        </div>
        <Card
          style={{
            borderRadius: 16,
            textAlign: 'center',
            padding: '40px 20px',
            boxShadow: '0 4px 20px rgba(82,196,26,0.12)',
            border: '2px solid #b7eb8f',
          }}
        >
          <CheckCircleOutlined style={{ fontSize: 72, color: '#52c41a' }} />
          <Title level={2} style={{ color: '#52c41a', marginTop: 16 }}>
            {t('violations.cleanRecord')} ✓
          </Title>
          <Paragraph style={{ color: '#595959', fontSize: 15, maxWidth: 400, margin: '0 auto 24px' }}>
            {t('violations.cleanDesc')}
          </Paragraph>
          <Row gutter={[16, 16]} justify="center" style={{ maxWidth: 600, margin: '0 auto' }}>
            {[
              { icon: <FileProtectOutlined style={{ fontSize: 24, color: '#1890ff' }} />, tip: t('violations.tip1') },
              { icon: <ClockCircleOutlined style={{ fontSize: 24, color: '#D4AF37' }} />, tip: t('violations.tip2') },
              { icon: <SafetyOutlined style={{ fontSize: 24, color: '#52c41a' }} />, tip: t('violations.tip3') },
            ].map((item, i) => (
              <Col xs={24} sm={8} key={i}>
                <Card
                  size="small"
                  style={{ borderRadius: 10, background: '#fafafa', border: '1px solid #f0f0f0' }}
                >
                  <div style={{ textAlign: 'center' }}>
                    {item.icon}
                    <Text style={{ fontSize: 12, display: 'block', marginTop: 8, color: '#595959' }}>
                      {item.tip}
                    </Text>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '0 0 32px' }}>
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, color: '#001529' }}>
          <WarningOutlined style={{ marginInlineEnd: 10, color: '#D4AF37' }} />
          {t('violations.title')}
        </Title>
      </div>

      <Alert
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        message={
          <Text strong>
            {t('violations.warningBanner', { count: violations.length })}
          </Text>
        }
        description={t('violations.warningDesc')}
        style={{ borderRadius: 10, marginBottom: 20 }}
      />

      {/* Escalation visual */}
      <Card style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', marginBottom: 20 }}>
        <Text strong style={{ display: 'block', marginBottom: 16, color: '#001529' }}>
          {t('violations.progressTitle')}
        </Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
          {[1, 2, 3].map((n, i) => {
            const info = VIOLATION_INFO[n];
            const isActive = maxViolation >= n;
            const isPast = maxViolation > n;
            return (
              <React.Fragment key={n}>
                <div style={{ textAlign: 'center', minWidth: 90 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      background: isActive ? info.color : '#f0f0f0',
                      border: `3px solid ${isActive ? info.color : '#d9d9d9'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto',
                      color: isActive ? '#fff' : '#bfbfbf',
                      fontWeight: 700,
                      fontSize: 16,
                      transition: 'all 0.3s',
                    }}
                  >
                    {isPast ? '✓' : n}
                  </div>
                  <Text style={{ fontSize: 11, color: isActive ? info.color : '#bfbfbf', marginTop: 6, display: 'block' }}>
                    {isAr ? info.labelAr : info.label}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#8c8c8c', display: 'block' }}>
                    {isAr ? info.penaltyAr : info.penaltyEn}
                  </Text>
                </div>
                {i < 2 && (
                  <div
                    style={{
                      flex: 1,
                      height: 3,
                      background: maxViolation > n ? '#ff4d4f' : '#f0f0f0',
                      minWidth: 30,
                      marginBottom: 20,
                      borderRadius: 2,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </Card>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.07)' }}>
        <Table
          dataSource={violations}
          columns={columns}
          rowKey="id"
          expandable={{ expandedRowRender }}
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default ViolationsPage;
