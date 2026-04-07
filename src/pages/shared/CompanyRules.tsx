import React, { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Table,
  Tag,
  Alert,
  Typography,
  Tabs,
  List,
} from 'antd';
import {
  BookOutlined,
  ClockCircleOutlined,
  BankOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  SafetyOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Text, Title, Paragraph } = Typography;

const RuleCard: React.FC<{
  number: number;
  title: string;
  borderColor: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}> = ({ number, title, borderColor, icon, children }) => (
  <Card
    style={{
      borderRadius: 12,
      borderLeft: `5px solid ${borderColor}`,
      marginBottom: 20,
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: borderColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 16,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <Tag color={borderColor === '#ff4d4f' ? 'red' : 'blue'} style={{ fontSize: 11, marginBottom: 2 }}>
          {`Rule ${number}`}
        </Tag>
        <Text strong style={{ fontSize: 15, display: 'block', color: '#001529' }}>{title}</Text>
      </div>
    </div>
    {children}
  </Card>
);

const ExampleBox: React.FC<{ items: { ok: boolean; label: string }[] }> = ({ items }) => (
  <div
    style={{
      background: '#f5f5f5',
      borderRadius: 8,
      padding: '12px 16px',
      marginTop: 12,
      display: 'flex',
      gap: 16,
      flexWrap: 'wrap',
    }}
  >
    {items.map((item, i) => (
      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {item.ok === true ? (
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
        ) : item.ok === false ? (
          <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 16 }} />
        ) : (
          <WarningOutlined style={{ color: '#fa8c16', fontSize: 16 }} />
        )}
        <Text style={{ fontSize: 13 }}>{item.label}</Text>
      </div>
    ))}
  </div>
);

const CompanyRules: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [activeTab, setActiveTab] = useState('duration');

  const penaltyData = [
    {
      key: '1',
      num: isAr ? 'المخالفة الأولى' : '1st Violation',
      penalty: isAr ? 'خصم راتب يومين' : '2 Work Days Salary Deduction',
      color: 'orange',
    },
    {
      key: '2',
      num: isAr ? 'المخالفة الثانية' : '2nd Violation',
      penalty: isAr ? 'إنذار كتابي' : 'Written Warning (إنذار)',
      color: 'red',
    },
    {
      key: '3',
      num: isAr ? 'المخالفة الثالثة' : '3rd Violation',
      penalty: isAr ? 'إنذار نهائي' : 'Final Warning (إنذار نهائي)',
      color: '#8b0000',
    },
  ];

  const entitlementData = [
    {
      key: '1',
      period: isAr ? 'أول 14 يوم' : 'First 14 days',
      pay: isAr ? 'راتب كامل' : 'Full Pay',
      req: isAr ? 'تقرير طبي معتمد' : 'Approved medical report',
      payColor: '#52c41a',
    },
    {
      key: '2',
      period: isAr ? 'الـ 14 يوم التالية' : 'Next 14 days',
      pay: isAr ? 'راتب كامل' : 'Full Pay',
      req: isAr ? 'دخول مستشفى أو لجنة طبية' : 'Hospitalization OR medical committee',
      payColor: '#52c41a',
    },
    {
      key: '3',
      period: isAr ? 'ما بعد 28 يوم' : 'Beyond 28 days',
      pay: isAr ? 'بدون راتب' : 'Unpaid',
      req: isAr ? 'قد تُطبّق عقوبات' : 'Penalties may apply',
      payColor: '#ff4d4f',
    },
  ];

  const alwaysRequiredDocs = [
    t('rules.docCert'),
    t('rules.docReceipt'),
    t('rules.docPrescription'),
    t('rules.docFacilityStamp'),
    t('rules.docDoctorStamp'),
  ];

  const royalDocs = [t('rules.docMedicalRecord')];

  const conditionalDocs = [
    t('rules.docLabStomach'),
    t('rules.docXrayFracture'),
    t('rules.docLabRespiratory'),
  ];

  const tabItems = [
    {
      key: 'duration',
      label: (
        <span>
          <ClockCircleOutlined /> {t('rules.tabDuration')}
        </span>
      ),
      children: (
        <div>
          <RuleCard number={1} title={t('rules.rule1Title')} borderColor="#1890ff" icon={<ClockCircleOutlined />}>
            <Paragraph style={{ color: '#595959', fontSize: 13 }}>
              {t('rules.rule1Content')}
            </Paragraph>
            <ExampleBox
              items={[
                { ok: true, label: t('rules.rule1Ex1') },
                { ok: false, label: t('rules.rule1Ex2') },
              ]}
            />
          </RuleCard>

          <RuleCard number={2} title={t('rules.rule2Title')} borderColor="#1890ff" icon={<ClockCircleOutlined />}>
            <Paragraph style={{ color: '#595959', fontSize: 13 }}>
              {t('rules.rule2Content')}
            </Paragraph>
            <ExampleBox
              items={[
                { ok: true, label: t('rules.rule2Ex1') },
                { ok: (null as unknown) as boolean, label: t('rules.rule2Ex2') },
                { ok: false, label: t('rules.rule2Ex3') },
              ]}
            />
          </RuleCard>
        </div>
      ),
    },
    {
      key: 'facility',
      label: (
        <span>
          <BankOutlined /> {t('rules.tabFacility')}
        </span>
      ),
      children: (
        <div>
          <RuleCard number={3} title={t('rules.rule3Title')} borderColor="#ff4d4f" icon={<BankOutlined />}>
            <Paragraph style={{ color: '#595959', fontSize: 13 }}>
              {t('rules.rule3Content')}
            </Paragraph>
            <Alert
              type="error"
              showIcon
              style={{ marginTop: 12, borderRadius: 8 }}
              message={t('rules.rule3Alert')}
              description={t('rules.rule3Examples')}
            />
            <div
              style={{
                textAlign: 'center',
                fontSize: 64,
                padding: '20px 0 10px',
                color: '#ff4d4f',
              }}
            >
              🚫
            </div>
            <Row gutter={16} style={{ textAlign: 'center' }}>
              <Col span={12}>
                <div
                  style={{
                    background: '#fff1f0',
                    border: '2px solid #ff4d4f',
                    borderRadius: 10,
                    padding: '12px',
                  }}
                >
                  <Text style={{ color: '#ff4d4f', fontWeight: 700 }}>Al-Shifa 24h Center</Text>
                  <br />
                  <Tag color="red" style={{ marginTop: 4 }}>{t('rules.blocked')}</Tag>
                </div>
              </Col>
              <Col span={12}>
                <div
                  style={{
                    background: '#fff1f0',
                    border: '2px solid #ff4d4f',
                    borderRadius: 10,
                    padding: '12px',
                  }}
                >
                  <Text style={{ color: '#ff4d4f', fontWeight: 700 }}>Night Care Center</Text>
                  <br />
                  <Tag color="red" style={{ marginTop: 4 }}>{t('rules.blocked')}</Tag>
                </div>
              </Col>
            </Row>
          </RuleCard>
        </div>
      ),
    },
    {
      key: 'documents',
      label: (
        <span>
          <FileTextOutlined /> {t('rules.tabDocuments')}
        </span>
      ),
      children: (
        <div>
          <RuleCard number={4} title={t('rules.rule4Title')} borderColor="#52c41a" icon={<FileTextOutlined />}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card
                  size="small"
                  style={{ borderRadius: 10, background: '#f6ffed', border: '1px solid #b7eb8f' }}
                  title={
                    <Text strong style={{ color: '#52c41a' }}>{t('rules.alwaysRequired')}</Text>
                  }
                >
                  <List
                    dataSource={alwaysRequiredDocs}
                    renderItem={(item) => (
                      <List.Item style={{ padding: '4px 0', border: 'none' }}>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginInlineEnd: 8 }} />
                        <Text style={{ fontSize: 13 }}>{item}</Text>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card
                  size="small"
                  style={{ borderRadius: 10, background: '#f0f5ff', border: '1px solid #adc6ff' }}
                  title={
                    <Text strong style={{ color: '#2f54eb' }}>{t('rules.royalMedical')}</Text>
                  }
                >
                  <List
                    dataSource={royalDocs}
                    renderItem={(item) => (
                      <List.Item style={{ padding: '4px 0', border: 'none' }}>
                        <CheckCircleOutlined style={{ color: '#2f54eb', marginInlineEnd: 8 }} />
                        <Text style={{ fontSize: 13 }}>{item}</Text>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card
                  size="small"
                  style={{ borderRadius: 10, background: '#fffbe6', border: '1px solid #ffe58f' }}
                  title={
                    <Text strong style={{ color: '#fa8c16' }}>{t('rules.conditional')}</Text>
                  }
                >
                  <List
                    dataSource={conditionalDocs}
                    renderItem={(item) => (
                      <List.Item style={{ padding: '4px 0', border: 'none' }}>
                        <WarningOutlined style={{ color: '#fa8c16', marginInlineEnd: 8 }} />
                        <Text style={{ fontSize: 13 }}>{item}</Text>
                      </List.Item>
                    )}
                  />
                </Card>
              </Col>
            </Row>
          </RuleCard>
        </div>
      ),
    },
    {
      key: 'penalties',
      label: (
        <span>
          <ExclamationCircleOutlined /> {t('rules.tabPenalties')}
        </span>
      ),
      children: (
        <div>
          <RuleCard number={5} title={t('rules.rule5Title')} borderColor="#fa8c16" icon={<ExclamationCircleOutlined />}>
            <Table
              dataSource={penaltyData}
              pagination={false}
              size="small"
              style={{ marginBottom: 16 }}
              columns={[
                {
                  title: t('rules.violation'),
                  dataIndex: 'num',
                  key: 'num',
                  render: (v: string, r: typeof penaltyData[0]) => (
                    <Tag color={r.color} style={{ fontSize: 12, padding: '2px 10px' }}>{v}</Tag>
                  ),
                },
                {
                  title: t('rules.penalty'),
                  dataIndex: 'penalty',
                  key: 'penalty',
                  render: (v: string, r: typeof penaltyData[0]) => (
                    <Text strong style={{ color: r.color === 'orange' ? '#fa8c16' : r.color === 'red' ? '#ff4d4f' : r.color }}>{v}</Text>
                  ),
                },
              ]}
            />
            <Alert
              type="warning"
              showIcon
              message={t('rules.penaltyNote')}
              style={{ borderRadius: 8, marginBottom: 12 }}
            />
            <Alert
              type="error"
              showIcon
              message={t('rules.penaltyWarn')}
              style={{ borderRadius: 8 }}
            />
          </RuleCard>
        </div>
      ),
    },
    {
      key: 'legal',
      label: (
        <span>
          <SafetyOutlined /> {t('rules.tabLegal')}
        </span>
      ),
      children: (
        <div>
          <RuleCard number={6} title={t('rules.rule6Title')} borderColor="#722ed1" icon={<SafetyOutlined />}>
            <List
              dataSource={[
                t('rules.rule6Point1'),
                t('rules.rule6Point2'),
                t('rules.rule6Point3'),
              ]}
              renderItem={(item) => (
                <List.Item style={{ border: 'none', padding: '6px 0' }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Text style={{ color: '#722ed1', fontSize: 18 }}>•</Text>
                    <Text style={{ fontSize: 13 }}>{item}</Text>
                  </div>
                </List.Item>
              )}
            />
          </RuleCard>

          <RuleCard number={7} title={t('rules.rule7Title')} borderColor="#ff4d4f" icon={<ExclamationCircleOutlined />}>
            <Alert
              type="error"
              showIcon
              message={t('rules.rule7Alert')}
              style={{ borderRadius: 8, marginBottom: 12 }}
            />
            <List
              dataSource={[
                t('rules.rule7Point1'),
                t('rules.rule7Point2'),
                t('rules.rule7Point3'),
              ]}
              renderItem={(item) => (
                <List.Item style={{ border: 'none', padding: '6px 0' }}>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <CloseCircleOutlined style={{ color: '#ff4d4f', marginTop: 2 }} />
                    <Text style={{ fontSize: 13 }}>{item}</Text>
                  </div>
                </List.Item>
              )}
            />
          </RuleCard>

          <RuleCard number={8} title={t('rules.rule8Title')} borderColor="#001529" icon={<BookOutlined />}>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 10 }}>
              {t('rules.rule8Subtitle')}
            </Text>
            <Table
              dataSource={entitlementData}
              pagination={false}
              size="small"
              columns={[
                { title: t('rules.period'), dataIndex: 'period', key: 'period' },
                {
                  title: t('rules.pay'),
                  dataIndex: 'pay',
                  key: 'pay',
                  render: (v: string, r: typeof entitlementData[0]) => (
                    <Text strong style={{ color: r.payColor }}>{v}</Text>
                  ),
                },
                { title: t('rules.requirement'), dataIndex: 'req', key: 'req' },
              ]}
            />
          </RuleCard>
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in" style={{ padding: '0 0 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0, color: '#001529' }}>
          <BookOutlined style={{ marginInlineEnd: 10, color: '#D4AF37' }} />
          {t('rules.title')}
        </Title>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {t('rules.subtitle')}
        </Text>
      </div>

      <Card style={{ borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          tabBarStyle={{ marginBottom: 24 }}
          style={{ '--ant-color-primary': '#D4AF37' } as React.CSSProperties}
        />
      </Card>
    </div>
  );
};

export default CompanyRules;
