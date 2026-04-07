import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Row,
  Col,
  Card,
  Button,
  Tag,
  Avatar,
  Statistic,
  Progress,
  Alert,
  Divider,
  List,
  Modal,
  Typography,
  Tooltip,
  Space,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SafetyCertificateOutlined,
  DollarOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  CloseCircleFilled,
  UserOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { mockSickLeaves, mockViolations } from '../../services/mockData';
import type { UploadedDocument } from '../../types';

const { Title, Text, Paragraph } = Typography;

const NAVY = '#0a1628';
const GOLD = '#D4AF37';

const trustStars = (score: number | null) => {
  if (score === null) return <Text type="secondary">—</Text>;
  const filled = Math.round(score * 5);
  return (
    <span style={{ fontSize: 16, color: score >= 0.7 ? '#52c41a' : score >= 0.4 ? '#faad14' : '#ff4d4f' }}>
      {'★'.repeat(filled)}{'☆'.repeat(5 - filled)}
    </span>
  );
};

const docIcon = (classification: string) => {
  switch (classification) {
    case 'SICK_LEAVE_CERTIFICATE': return { icon: <SafetyCertificateOutlined style={{ fontSize: 48, color: '#fff' }} />, bg: '#1890ff' };
    case 'FINANCIAL_RECEIPT': return { icon: <DollarOutlined style={{ fontSize: 48, color: '#fff' }} />, bg: '#52c41a' };
    case 'PRESCRIPTION': return { icon: <MedicineBoxOutlined style={{ fontSize: 48, color: '#fff' }} />, bg: '#722ed1' };
    case 'LAB_RESULTS': return { icon: <ExperimentOutlined style={{ fontSize: 48, color: '#fff' }} />, bg: '#13c2c2' };
    case 'XRAY': return { icon: <FileTextOutlined style={{ fontSize: 48, color: '#fff' }} />, bg: '#fa8c16' };
    default: return { icon: <FileTextOutlined style={{ fontSize: 48, color: '#fff' }} />, bg: '#8c8c8c' };
  }
};

const docClassLabel = (classification: string): string => {
  const map: Record<string, string> = {
    SICK_LEAVE_CERTIFICATE: 'Sick Leave Certificate',
    FINANCIAL_RECEIPT: 'Financial Receipt',
    PRESCRIPTION: 'Prescription',
    LAB_RESULTS: 'Lab Results',
    XRAY: 'X-ray / Imaging',
    HOSPITAL_REPORT: 'Hospital Report',
    OTHER: 'Other',
  };
  return map[classification] || classification;
};

const docDetections = (doc: UploadedDocument) => {
  const cls = doc.classification;
  return {
    doctorStamp: cls === 'SICK_LEAVE_CERTIFICATE' || cls === 'PRESCRIPTION',
    facilityStamp: cls === 'SICK_LEAVE_CERTIFICATE' || cls === 'FINANCIAL_RECEIPT' || cls === 'LAB_RESULTS',
    noTampering: true,
    prescription: cls === 'PRESCRIPTION',
  };
};

const facilityTypeKey = (type: string): string => {
  const map: Record<string, string> = {
    GOVERNMENT_HOSPITAL: 'governmentHospital',
    PRIVATE_HOSPITAL: 'privateHospital',
    UNIVERSITY_HOSPITAL: 'universityHospital',
    ROYAL_MEDICAL_SERVICES: 'royalMedicalServices',
    HEALTH_CENTER: 'healthCenter',
    PRIVATE_CLINIC: 'privateClinic',
    PRIVATE_24H: 'private24h',
    SPECIALIZED_CENTER: 'specializedCenter',
    MILITARY_HOSPITAL: 'militaryHospital',
  };
  return map[type] ?? 'other';
};

const isWeekendAdjacent = (fromDate: Date, toDate: Date): boolean => {
  const dayBefore = new Date(fromDate);
  dayBefore.setDate(dayBefore.getDate() - 1);
  const dayAfter = new Date(toDate);
  dayAfter.setDate(dayAfter.getDate() + 1);
  const isJordanWeekend = (d: Date) => d.getDay() === 5 || d.getDay() === 6;
  return (
    isJordanWeekend(dayBefore) ||
    isJordanWeekend(dayAfter) ||
    isJordanWeekend(fromDate) ||
    isJordanWeekend(toDate)
  );
};

const avatarColors = ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2'];
const getAvatarColor = (id: string) => avatarColors[id.charCodeAt(id.length - 1) % avatarColors.length];

const LeaveReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [previewDoc, setPreviewDoc] = useState<UploadedDocument | null>(null);

  const leave = mockSickLeaves.find((l) => l.id === id);

  if (!leave) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Title level={3} style={{ color: NAVY }}>{t('leaveReview.notFound')}</Title>
        <Text type="secondary">{t('leaveReview.notFoundMsg')}</Text>
        <br /><br />
        <Button
          icon={isAr ? <ArrowRightOutlined /> : <ArrowLeftOutlined />}
          onClick={() => navigate('/doctor/queue')}
          style={{ background: GOLD, borderColor: GOLD, color: '#fff' }}
        >
          {t('leaveReview.backToQueue')}
        </Button>
      </div>
    );
  }

  const { employee, doctor, facility, documents } = leave;

  const employeeAllLeaves = mockSickLeaves.filter((l) => l.employeeId === leave.employeeId);
  const daysUsed = employeeAllLeaves
    .filter((l) => l.status === 'APPROVED' || l.status === 'PARTIALLY_APPROVED')
    .reduce((sum, l) => sum + (l.approvedDays ?? 0), 0);
  const totalBalance = employee.sickLeaveTotal;
  const violations = mockViolations.filter((v) => v.employeeId === leave.employeeId);

  const weekendAdjacent = isWeekendAdjacent(new Date(leave.fromDate), new Date(leave.toDate));
  const repeatPattern = employeeAllLeaves.length > 3;

  const statusTagColor: Record<string, string> = {
    SUBMITTED: 'blue',
    PROCESSING: 'cyan',
    UNDER_REVIEW: 'orange',
    DOCS_REQUESTED: 'purple',
    EXAMINATION_REQUESTED: 'magenta',
    APPROVED: 'green',
    PARTIALLY_APPROVED: 'gold',
    REJECTED: 'red',
  };

  const statusLabel: Record<string, string> = {
    SUBMITTED: t('statuses.submitted'),
    PROCESSING: t('statuses.processing'),
    UNDER_REVIEW: t('statuses.underReview'),
    DOCS_REQUESTED: t('statuses.docsRequested'),
    EXAMINATION_REQUESTED: t('statuses.examinationRequested'),
    APPROVED: t('statuses.approved'),
    PARTIALLY_APPROVED: t('statuses.partiallyApproved'),
    REJECTED: t('statuses.rejected'),
  };

  const fromFormatted = new Date(leave.fromDate).toLocaleDateString(isAr ? 'ar-JO' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const toFormatted = new Date(leave.toDate).toLocaleDateString(isAr ? 'ar-JO' : 'en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const mockCommentEn = 'I started experiencing a severe cough and shortness of breath three days ago. I visited Jordan Hospital where the doctor diagnosed me with acute bronchitis and prescribed antibiotics and rest for 3 days.';
  const mockCommentAr = 'بدأت أعاني من سعال شديد وضيق في التنفس منذ ثلاثة أيام. ذهبت إلى مستشفى الأردن حيث شخص الطبيب حالتي بالتهاب الشعب الهوائية ووصف لي المضادات الحيوية والراحة لمدة 3 أيام.';
  const commentText = leave.employeeComments ?? (isAr ? mockCommentAr : mockCommentEn);

  const cardStyle = { borderRadius: 12, marginBottom: 16 };
  const cardHeadStyle = { color: NAVY, fontWeight: 700 };

  return (
    <div style={{ padding: '24px', background: '#f5f6fa', minHeight: '100vh' }}>
      {/* Top bar */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Button
          icon={isAr ? <ArrowRightOutlined /> : <ArrowLeftOutlined />}
          onClick={() => navigate('/doctor/queue')}
          style={{ borderColor: NAVY, color: NAVY }}
        >
          {t('leaveReview.backToQueue')}
        </Button>
        <Title level={3} style={{ margin: 0, color: NAVY, flex: 1 }}>
          {t('leaveReview.title')}
        </Title>
        <Text style={{ fontSize: 18, fontWeight: 700, color: GOLD }}>{leave.refNumber}</Text>
        <Tag color={statusTagColor[leave.status]} style={{ fontSize: 13, padding: '2px 10px' }}>
          {statusLabel[leave.status]}
        </Tag>
      </div>

      <Row gutter={[20, 20]} align="top">
        {/* ===== LEFT COLUMN ===== */}
        <Col xs={24} lg={14}>

          {/* CARD 1: Employee Information */}
          <Card
            title={<span style={cardHeadStyle}><UserOutlined style={{ marginInlineEnd: 8, color: GOLD }} />{t('leaveReview.employeeInfo')}</span>}
            style={cardStyle}
          >
            <Row gutter={[16, 0]} align="middle">
              <Col flex="80px">
                <Avatar
                  size={64}
                  style={{ background: getAvatarColor(employee.id), fontSize: 28, fontWeight: 700 }}
                >
                  {(isAr ? employee.nameAr : employee.nameEn).charAt(0)}
                </Avatar>
              </Col>
              <Col flex="1">
                <Title level={4} style={{ margin: 0, color: NAVY }}>
                  {isAr ? employee.nameAr : employee.nameEn}
                </Title>
                <Text type="secondary" style={{ fontSize: 13 }}>{employee.employeeNumber}</Text>
                <br />
                <Text style={{ fontSize: 13 }}>
                  {isAr ? employee.department.nameAr : employee.department.nameEn}
                  {' · '}
                  {employee.jobTitle}
                </Text>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />

            <Row gutter={[8, 8]}>
              <Col span={6}>
                <Statistic
                  title={<Text style={{ fontSize: 11 }}>{t('leaveReview.totalLeaves')}</Text>}
                  value={employeeAllLeaves.length}
                  valueStyle={{ fontSize: 20, color: '#1890ff' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={<Text style={{ fontSize: 11 }}>{t('leaveReview.daysUsed')}</Text>}
                  value={daysUsed}
                  valueStyle={{ fontSize: 20, color: '#fa8c16' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={<Text style={{ fontSize: 11 }}>{t('leaveReview.balance')}</Text>}
                  value={`${employee.sickLeaveBalance}/${totalBalance}`}
                  valueStyle={{ fontSize: 20, color: '#52c41a' }}
                />
              </Col>
              <Col span={6}>
                <Statistic
                  title={<Text style={{ fontSize: 11 }}>{t('leaveReview.violations')}</Text>}
                  value={violations.length}
                  valueStyle={{ fontSize: 20, color: violations.length > 0 ? '#ff4d4f' : '#52c41a' }}
                />
              </Col>
            </Row>

            <div style={{ marginTop: 12 }}>
              <a style={{ color: GOLD, fontWeight: 600, fontSize: 13 }}>
                {t('leaveReview.viewProfile')} →
              </a>
            </div>
          </Card>

          {/* CARD 2: Leave Information */}
          <Card
            title={<span style={cardHeadStyle}>{t('leaveReview.leaveInfo')}</span>}
            style={cardStyle}
          >
            <Row gutter={[16, 12]} align="middle">
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.reference')}</Text>
                <Text style={{ fontSize: 20, fontWeight: 700, color: GOLD }}>{leave.refNumber}</Text>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.period')}</Text>
                <Text strong style={{ fontSize: 14 }}>{fromFormatted} — {toFormatted}</Text>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.duration')}</Text>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 52, height: 52, borderRadius: '50%',
                  background: '#e6f7ff', border: '3px solid #1890ff',
                  fontWeight: 700, fontSize: 20, color: '#1890ff',
                }}>
                  {leave.totalDays}
                </span>
                <Text style={{ marginInlineStart: 8, fontSize: 13 }}>{t('common.days')}</Text>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>{t('leaveReview.flags')}</Text>
                <Space wrap>
                  {weekendAdjacent && <Tag color="orange">🏖️ {t('queue.flagWeekend')}</Tag>}
                  {repeatPattern && <Tag color="purple">🔄 {t('queue.flagFrequent')}</Tag>}
                  {(leave.aiAnalysis?.ruleViolations ?? []).length > 0 && (
                    <Tooltip title={(leave.aiAnalysis?.ruleViolations ?? []).join(', ')}>
                      <Tag color="red">⚠️ {t('leaveReview.ruleViolation')}</Tag>
                    </Tooltip>
                  )}
                  {!weekendAdjacent && !repeatPattern && (leave.aiAnalysis?.ruleViolations ?? []).length === 0 && (
                    <Tag color="green">✓ {t('leaveReview.noFlags')}</Tag>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>

          {/* CARD 3: Medical Information */}
          <Card
            title={<span style={cardHeadStyle}>{t('leaveReview.medicalInfo')}</span>}
            style={cardStyle}
          >
            {/* Doctor section */}
            <Text strong style={{ fontSize: 13, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('leaveReview.doctorSection')}
            </Text>

            {doctor.trustScore !== null && doctor.trustScore < 0.4 && (
              <Alert
                message={`🚨 ${t('leaveReview.lowTrustAlert')}`}
                type="error"
                showIcon={false}
                style={{ marginTop: 10, marginBottom: 10, borderRadius: 8 }}
              />
            )}

            <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.doctorName')}</Text>
                <Text strong style={{ fontSize: 15 }}>{isAr ? doctor.nameAr : doctor.nameEn}</Text>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.rank')}</Text>
                <Tag color={doctor.rank === 'GP' || doctor.rank === 'RESIDENT' ? 'default' : doctor.rank === 'SPECIALIST' ? 'blue' : 'purple'}>
                  {t(`doctorRanks.${doctor.rank.toLowerCase()}`)}
                </Tag>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.specialty')}</Text>
                <Text style={{ fontSize: 14 }}>{doctor.specialty}</Text>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.trustScore')}</Text>
                {trustStars(doctor.trustScore)}
                {doctor.trustScore !== null && (
                  <Text style={{ marginInlineStart: 6, fontSize: 12, color: '#888' }}>
                    ({Math.round(doctor.trustScore * 100)}%)
                  </Text>
                )}
              </Col>
              <Col span={24}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('leaveReview.doctorHistory', { count: doctor.leavesIssued, flagged: doctor.leavesFlagged })}
                </Text>
              </Col>
            </Row>

            <Divider style={{ margin: '16px 0' }} />

            {/* Facility section */}
            <Text strong style={{ fontSize: 13, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {t('leaveReview.facilitySection')}
            </Text>

            {facility.isBlocked && (
              <Alert
                message={`🚫 ${t('leaveReview.blockedFacilityAlert')}`}
                type="error"
                showIcon={false}
                style={{ marginTop: 10, marginBottom: 10, borderRadius: 8, fontWeight: 600 }}
              />
            )}

            <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.facilityName')}</Text>
                <Text strong style={{ fontSize: 15 }}>{isAr ? facility.nameAr : facility.nameEn}</Text>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.facilityType')}</Text>
                <Tag>{t(`facilityTypes.${facilityTypeKey(facility.type)}`)}</Tag>
                {facility.isBlocked && <Tag color="red" style={{ marginInlineStart: 4 }}>🚫 {t('queue.blocked')}</Tag>}
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.trustScore')}</Text>
                {trustStars(facility.trustScore)}
                {facility.trustScore !== null && (
                  <Text style={{ marginInlineStart: 6, fontSize: 12, color: '#888' }}>
                    ({Math.round(facility.trustScore * 100)}%)
                  </Text>
                )}
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('leaveReview.facilityHistory', { count: facility.leavesFromFacility })}
                </Text>
              </Col>
            </Row>
          </Card>

          {/* CARD 4: Diagnosis */}
          <Card
            title={<span style={cardHeadStyle}>{t('leaveReview.diagnosisCard')}</span>}
            style={cardStyle}
          >
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.symptoms')}</Text>
                <Text style={{ fontSize: 14 }}>{leave.symptoms}</Text>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.diagnosis')}</Text>
                <Text strong style={{ fontSize: 15 }}>{leave.diagnosis}</Text>
              </Col>
              {leave.icd10Code && (
                <Col xs={24} sm={12}>
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.icd10')}</Text>
                  <code style={{
                    background: '#f0f0f0', padding: '2px 8px', borderRadius: 4,
                    fontSize: 14, fontFamily: 'monospace', color: '#555',
                  }}>
                    {leave.icd10Code}
                  </code>
                </Col>
              )}
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.hospitalized')}</Text>
                <Tag color={leave.wasHospitalized ? 'green' : 'default'}>
                  {leave.wasHospitalized ? t('common.yes') : t('common.no')}
                </Tag>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.chronicDisease')}</Text>
                <Tag color={leave.isChronicDisease ? 'orange' : 'default'}>
                  {leave.isChronicDisease ? t('common.yes') : t('common.no')}
                </Tag>
              </Col>
            </Row>
          </Card>

          {/* CARD 5: Employee's Comment */}
          <Card
            title={<span style={cardHeadStyle}>💬 {t('leaveReview.commentCard')}</span>}
            style={{
              ...cardStyle,
              background: '#e6f7ff',
              borderInlineStart: '4px solid #1890ff',
              borderRadius: 12,
            }}
            bodyStyle={{ paddingTop: 8 }}
          >
            <div style={{ fontSize: 48, color: '#1890ff', lineHeight: 1, marginBottom: 4, opacity: 0.4 }}>"</div>
            <Paragraph
              style={{
                fontSize: 16,
                lineHeight: 1.8,
                color: '#1a1a1a',
                margin: 0,
                direction: isAr ? 'rtl' : 'ltr',
                fontStyle: 'normal',
              }}
            >
              {commentText}
            </Paragraph>

            <Divider style={{ margin: '16px 0', borderColor: '#91d5ff' }} />

            <div style={{ background: '#fff', borderRadius: 8, padding: 12 }}>
              <Text strong style={{ fontSize: 13, color: NAVY, display: 'block', marginBottom: 8 }}>
                🤖 {t('leaveReview.aiCommentAnalysis')}
              </Text>
              <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>
                {t('leaveReview.aiCommentText')}
              </Text>
              <div style={{ marginTop: 12 }}>
                <Row align="middle" gutter={8}>
                  <Col>
                    <Text style={{ fontSize: 12 }}>{t('leaveReview.credibilityScore')}:</Text>
                  </Col>
                  <Col flex="1">
                    <Progress percent={85} strokeColor="#52c41a" size="small" style={{ margin: 0 }} />
                  </Col>
                  <Col>
                    <Text strong style={{ fontSize: 12, color: '#52c41a' }}>85/100</Text>
                  </Col>
                </Row>
              </div>
            </div>
          </Card>

          {/* CARD 6: Documents */}
          <Card
            title={<span style={cardHeadStyle}>📄 {t('leaveReview.documentsCard')} ({documents.length})</span>}
            style={cardStyle}
          >
            <Row gutter={[12, 12]}>
              {documents.map((doc) => {
                const { icon: docIco, bg } = docIcon(doc.classification);
                const detections = docDetections(doc);
                return (
                  <Col xs={24} sm={12} key={doc.id}>
                    <Card
                      size="small"
                      bodyStyle={{ padding: 0 }}
                      style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e8e8e8' }}
                    >
                      {/* Thumbnail */}
                      <div
                        style={{
                          height: 160,
                          background: bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                        onClick={() => setPreviewDoc(doc)}
                      >
                        {docIco}
                        <div style={{
                          position: 'absolute', bottom: 8, right: 8,
                          background: 'rgba(255,255,255,0.25)', borderRadius: 4,
                          padding: '2px 6px', fontSize: 11, color: '#fff',
                        }}>
                          {t('leaveReview.clickToPreview')}
                        </div>
                      </div>

                      <div style={{ padding: 10 }}>
                        <Text strong style={{ fontSize: 12, display: 'block' }} ellipsis={{ tooltip: doc.fileName }}>
                          {doc.fileName}
                        </Text>
                        <Tag
                          style={{ marginTop: 4, marginBottom: 6, fontSize: 11 }}
                          color={bg}
                        >
                          {docClassLabel(doc.classification)}
                        </Tag>
                        <div style={{ marginBottom: 8 }}>
                          <Row align="middle" gutter={4}>
                            <Col>
                              <Text style={{ fontSize: 11 }}>{t('leaveReview.confidence')}:</Text>
                            </Col>
                            <Col flex="1">
                              <Progress
                                percent={Math.round(doc.confidence * 100)}
                                strokeColor={doc.confidence >= 0.9 ? '#52c41a' : doc.confidence >= 0.7 ? '#faad14' : '#ff4d4f'}
                                size="small"
                                style={{ margin: 0 }}
                              />
                            </Col>
                            <Col>
                              <Text style={{ fontSize: 11 }}>{Math.round(doc.confidence * 100)}%</Text>
                            </Col>
                          </Row>
                        </div>

                        {/* Detection badges */}
                        <Space size={4} wrap>
                          {detections.doctorStamp && (
                            <Tooltip title={t('leaveReview.doctorStamp')}>
                              <span style={{ fontSize: 11, color: '#52c41a' }}>
                                <CheckCircleFilled /> {t('leaveReview.doctorStamp')}
                              </span>
                            </Tooltip>
                          )}
                          {detections.facilityStamp && (
                            <Tooltip title={t('leaveReview.facilityStamp')}>
                              <span style={{ fontSize: 11, color: '#52c41a' }}>
                                <CheckCircleFilled /> {t('leaveReview.facilityStamp')}
                              </span>
                            </Tooltip>
                          )}
                          {!detections.prescription && doc.classification !== 'PRESCRIPTION' && (
                            <span style={{ fontSize: 11, color: '#ff4d4f' }}>
                              <CloseCircleFilled /> {t('leaveReview.noPrescription')}
                            </span>
                          )}
                          {detections.noTampering && (
                            <Tooltip title={t('leaveReview.noTampering')}>
                              <span style={{ fontSize: 11, color: '#52c41a' }}>
                                <CheckCircleFilled /> {t('leaveReview.noTampering')}
                              </span>
                            </Tooltip>
                          )}
                        </Space>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>

            {/* Document Checklist */}
            <Divider style={{ margin: '16px 0' }}>{t('leaveReview.docChecklist')}</Divider>
            <List
              size="small"
              dataSource={[
                {
                  label: t('leaveReview.checkSickLeaf'),
                  found: documents.some((d) => d.classification === 'SICK_LEAVE_CERTIFICATE'),
                  required: true,
                },
                {
                  label: t('leaveReview.checkReceipt'),
                  found: documents.some((d) => d.classification === 'FINANCIAL_RECEIPT'),
                  required: true,
                },
                {
                  label: t('leaveReview.checkPrescription'),
                  found: documents.some((d) => d.classification === 'PRESCRIPTION'),
                  required: false,
                },
                {
                  label: t('leaveReview.checkFacilityStamp'),
                  found: documents.some((d) => d.classification === 'SICK_LEAVE_CERTIFICATE'),
                  required: true,
                },
                {
                  label: t('leaveReview.checkDoctorStamp'),
                  found: documents.some((d) => d.classification === 'SICK_LEAVE_CERTIFICATE'),
                  required: true,
                },
                {
                  label: t('leaveReview.checkLab'),
                  found: documents.some((d) => d.classification === 'LAB_RESULTS'),
                  required: false,
                  note: t('leaveReview.checkLabNote'),
                },
                {
                  label: t('leaveReview.checkXray'),
                  found: documents.some((d) => d.classification === 'XRAY'),
                  required: false,
                  note: t('leaveReview.checkXrayNote'),
                },
              ]}
              renderItem={(item) => (
                <List.Item style={{ padding: '6px 0' }}>
                  <Space>
                    {item.found ? (
                      <CheckCircleFilled style={{ color: '#52c41a', fontSize: 15 }} />
                    ) : item.required ? (
                      <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 15 }} />
                    ) : (
                      <ExclamationCircleFilled style={{ color: '#faad14', fontSize: 15 }} />
                    )}
                    <Text style={{ fontSize: 13 }}>{item.label}</Text>
                    {!item.found && item.note && (
                      <Text type="secondary" style={{ fontSize: 11 }}>— {item.note}</Text>
                    )}
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* ===== RIGHT COLUMN (placeholder) ===== */}
        <Col xs={24} lg={10}>
          <Card
            title={
              <span style={{ ...cardHeadStyle, color: GOLD }}>
                <ToolOutlined style={{ marginInlineEnd: 8 }} />
                {t('leaveReview.aiDecisionTitle')}
              </span>
            }
            style={{
              ...cardStyle,
              borderTop: `4px solid ${GOLD}`,
              position: 'sticky',
              top: 24,
            }}
          >
            <div style={{ textAlign: 'center', padding: '60px 24px', color: '#aaa' }}>
              <ToolOutlined style={{ fontSize: 48, marginBottom: 16, color: GOLD, opacity: 0.5 }} />
              <br />
              <Text type="secondary" style={{ fontSize: 16 }}>
                {t('leaveReview.comingInPart2')}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Document Preview Modal */}
      <Modal
        open={previewDoc !== null}
        onCancel={() => setPreviewDoc(null)}
        footer={null}
        title={previewDoc?.fileName}
        centered
        width={600}
      >
        {previewDoc && (() => {
          const { icon: modalIcon, bg: modalBg } = docIcon(previewDoc.classification);
          return (
            <div style={{
              height: 360, background: modalBg,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', borderRadius: 8,
            }}>
              {modalIcon}
              <Text style={{ color: '#fff', marginTop: 16, fontWeight: 600, fontSize: 15 }}>
                {docClassLabel(previewDoc.classification)}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>
                {previewDoc.fileName}
              </Text>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
};

export default LeaveReview;
