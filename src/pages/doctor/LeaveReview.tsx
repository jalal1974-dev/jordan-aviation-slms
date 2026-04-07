import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
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
  Radio,
  Checkbox,
  Input,
  Select,
  DatePicker,
  Collapse,
  Switch,
  Timeline,
  message,
} from 'antd';
import type { RadioChangeEvent } from 'antd';
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
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  FileAddOutlined,
  CheckOutlined,
  InfoCircleFilled,
  WarningFilled,
  RobotOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { mockSickLeaves, mockViolations } from '../../services/mockData';
import type { UploadedDocument } from '../../types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const NAVY = '#0a1628';
const GOLD = '#D4AF37';

/* ── Pure helpers ─────────────────────────────────────────────────────── */

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
    case 'FINANCIAL_RECEIPT':      return { icon: <DollarOutlined style={{ fontSize: 48, color: '#fff' }} />, bg: '#52c41a' };
    case 'PRESCRIPTION':           return { icon: <MedicineBoxOutlined style={{ fontSize: 48, color: '#fff' }} />, bg: '#722ed1' };
    case 'LAB_RESULTS':            return { icon: <ExperimentOutlined style={{ fontSize: 48, color: '#fff' }} />, bg: '#13c2c2' };
    case 'XRAY':                   return { icon: <FileTextOutlined style={{ fontSize: 48, color: '#fff' }} />, bg: '#fa8c16' };
    default:                       return { icon: <FileTextOutlined style={{ fontSize: 48, color: '#fff' }} />, bg: '#8c8c8c' };
  }
};

const docClassLabel = (cls: string): string => {
  const map: Record<string, string> = {
    SICK_LEAVE_CERTIFICATE: 'Sick Leave Certificate',
    FINANCIAL_RECEIPT: 'Financial Receipt',
    PRESCRIPTION: 'Prescription',
    LAB_RESULTS: 'Lab Results',
    XRAY: 'X-ray / Imaging',
    HOSPITAL_REPORT: 'Hospital Report',
    OTHER: 'Other',
  };
  return map[cls] || cls;
};

const docDetections = (doc: UploadedDocument) => {
  const cls = doc.classification;
  return {
    doctorStamp:   cls === 'SICK_LEAVE_CERTIFICATE' || cls === 'PRESCRIPTION',
    facilityStamp: cls === 'SICK_LEAVE_CERTIFICATE' || cls === 'FINANCIAL_RECEIPT' || cls === 'LAB_RESULTS',
    noTampering:   true,
    prescription:  cls === 'PRESCRIPTION',
  };
};

const facilityTypeKey = (type: string): string => {
  const map: Record<string, string> = {
    GOVERNMENT_HOSPITAL:   'governmentHospital',
    PRIVATE_HOSPITAL:      'privateHospital',
    UNIVERSITY_HOSPITAL:   'universityHospital',
    ROYAL_MEDICAL_SERVICES:'royalMedicalServices',
    HEALTH_CENTER:         'healthCenter',
    PRIVATE_CLINIC:        'privateClinic',
    PRIVATE_24H:           'private24h',
    SPECIALIZED_CENTER:    'specializedCenter',
    MILITARY_HOSPITAL:     'militaryHospital',
  };
  return map[type] ?? 'other';
};

const isWeekendAdjacent = (fromDate: Date, toDate: Date): boolean => {
  const dayBefore = new Date(fromDate); dayBefore.setDate(dayBefore.getDate() - 1);
  const dayAfter  = new Date(toDate);   dayAfter.setDate(dayAfter.getDate() + 1);
  const isJordanWeekend = (d: Date) => d.getDay() === 5 || d.getDay() === 6;
  return isJordanWeekend(dayBefore) || isJordanWeekend(dayAfter) || isJordanWeekend(fromDate) || isJordanWeekend(toDate);
};

const gaugeColor = (score: number, isRisk = false): string => {
  if (isRisk) return score < 40 ? '#52c41a' : score < 70 ? '#faad14' : '#ff4d4f';
  return score > 75 ? '#52c41a' : score >= 50 ? '#faad14' : '#ff4d4f';
};

const avatarColors = ['#1890ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2'];
const getAvatarColor = (id: string) => avatarColors[id.charCodeAt(id.length - 1) % avatarColors.length];

const examTimes: string[] = [];
for (let h = 8; h <= 14; h++) { examTimes.push(`${h}:00`); examTimes.push(`${h}:30`); }
examTimes.push('15:00');

/* ── Component ────────────────────────────────────────────────────────── */

const LeaveReview: React.FC = () => {
  const { id }       = useParams<{ id: string }>();
  const navigate     = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr         = i18n.language === 'ar';

  const leave = mockSickLeaves.find((l) => l.id === id);

  /* ── All state — must be before any conditional return ── */
  const [previewDoc, setPreviewDoc]           = useState<UploadedDocument | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<string>('');
  const [medicalAssessment, setMedicalAssessment] = useState('');
  const [medicallyJustified, setMedicallyJustified] = useState('');
  const [instructionsToEmployee, setInstructionsToEmployee] = useState('');
  const [recommendationsToAdmin, setRecommendationsToAdmin] = useState('');
  const [blacklistDoctor,  setBlacklistDoctor]  = useState(false);
  const [blacklistDoctorReason, setBlacklistDoctorReason]   = useState('');
  const [blacklistFacility, setBlacklistFacility] = useState(false);
  const [blacklistFacilityReason, setBlacklistFacilityReason] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // Partial
  const [partialFrom,        setPartialFrom]        = useState<Dayjs | null>(leave ? dayjs(leave.fromDate) : null);
  const [partialTo,          setPartialTo]           = useState<Dayjs | null>(leave ? dayjs(leave.fromDate).add(1, 'day') : null);
  const [partialReason,      setPartialReason]       = useState('per_rules');
  const [partialExplanation, setPartialExplanation]  = useState('');
  // Rejection
  const [rejectionReasons,   setRejectionReasons]   = useState<string[]>([]);
  const [rejectionNotes,     setRejectionNotes]     = useState('');
  // Override
  const [overrideReason,     setOverrideReason]     = useState('');
  // Examination
  const [examDate,           setExamDate]           = useState<Dayjs | null>(null);
  const [examTime,           setExamTime]           = useState<string | undefined>(undefined);
  const [examLocation,       setExamLocation]       = useState(
    isAr ? 'عيادة طبيب الشركة، مقر الأردنية للطيران، المبنى 2، الطابق الأرضي'
          : 'Company Doctor Clinic, Jordan Aviation HQ, Building 2'
  );
  const [examPurpose,        setExamPurpose]        = useState('');
  const [mustBring,          setMustBring]          = useState<string[]>(['original_cert', 'all_docs', 'photo_id', 'medications']);
  const [noteToEmployee,     setNoteToEmployee]     = useState(
    isAr ? 'يرجى الحضور في الوقت المحدد. التغيب سيؤدي إلى رفض تلقائي وفقاً للمادة السادسة.'
          : 'Please attend on time. Failure to attend will result in automatic rejection per Rule 6.'
  );
  // Docs request
  const [requestedDocTypes,  setRequestedDocTypes]  = useState<string[]>([]);
  const [docsInstructions,   setDocsInstructions]   = useState('');
  const [docsDeadline,       setDocsDeadline]       = useState<Dayjs | null>(dayjs().add(2, 'day'));
  // Committee
  const [referralReason,     setReferralReason]     = useState('');
  const [referralUrgency,    setReferralUrgency]    = useState('NORMAL');

  /* ── Not-found guard ── */
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

  /* ── Derived values ── */
  const { employee, doctor, facility, documents } = leave;
  const employeeAllLeaves = mockSickLeaves.filter((l) => l.employeeId === leave.employeeId);
  const daysUsed = employeeAllLeaves
    .filter((l) => l.status === 'APPROVED' || l.status === 'PARTIALLY_APPROVED')
    .reduce((sum, l) => sum + (l.approvedDays ?? 0), 0);
  const violations = mockViolations.filter((v) => v.employeeId === leave.employeeId);
  const weekendAdjacent = isWeekendAdjacent(new Date(leave.fromDate), new Date(leave.toDate));
  const repeatPattern   = employeeAllLeaves.length > 3;

  const ai = leave.aiAnalysis;
  const compliance    = ai?.compliance    ?? 72;
  const justifiability = ai?.justifiability ?? 85;
  const riskScore     = ai?.riskScore     ?? 35;
  const documentation = ai?.documentation ?? 75;
  const aiViolations  = ai?.ruleViolations ?? [];

  const aiRec = (() => {
    if (compliance > 70 && riskScore < 40) return { label: t('decision.aiRecommendApprove'), color: 'green',  emoji: '🟢' };
    if (compliance < 50 || riskScore > 60) return { label: t('decision.aiRecommendReject'),  color: 'red',    emoji: '🔴' };
    return                                        { label: t('decision.aiRecommendReview'),  color: 'orange', emoji: '🟡' };
  })();

  const partialApprovedDays = (partialFrom && partialTo)
    ? Math.max(0, partialTo.diff(partialFrom, 'day') + 1)
    : 0;
  const partialRejectedDays = Math.max(0, leave.totalDays - partialApprovedDays);

  const fromFormatted = new Date(leave.fromDate).toLocaleDateString(isAr ? 'ar-JO' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const toFormatted   = new Date(leave.toDate).toLocaleDateString(isAr ? 'ar-JO' : 'en-GB',   { day: 'numeric', month: 'long', year: 'numeric' });

  const mockCommentAr = 'بدأت أعاني من سعال شديد وضيق في التنفس منذ ثلاثة أيام. ذهبت إلى مستشفى الأردن حيث شخص الطبيب حالتي بالتهاب الشعب الهوائية ووصف لي المضادات الحيوية والراحة لمدة 3 أيام.';
  const mockCommentEn = 'I started experiencing a severe cough and shortness of breath three days ago. I visited Jordan Hospital where the doctor diagnosed me with acute bronchitis and prescribed antibiotics and rest for 3 days.';
  const commentText   = leave.employeeComments ?? (isAr ? mockCommentAr : mockCommentEn);

  const statusTagColor: Record<string, string> = {
    SUBMITTED: 'blue', PROCESSING: 'cyan', UNDER_REVIEW: 'orange',
    DOCS_REQUESTED: 'purple', EXAMINATION_REQUESTED: 'magenta',
    APPROVED: 'green', PARTIALLY_APPROVED: 'gold', REJECTED: 'red',
  };
  const statusLabel: Record<string, string> = {
    SUBMITTED:              t('statuses.submitted'),
    PROCESSING:             t('statuses.processing'),
    UNDER_REVIEW:           t('statuses.underReview'),
    DOCS_REQUESTED:         t('statuses.docsRequested'),
    EXAMINATION_REQUESTED:  t('statuses.examinationRequested'),
    APPROVED:               t('statuses.approved'),
    PARTIALLY_APPROVED:     t('statuses.partiallyApproved'),
    REJECTED:               t('statuses.rejected'),
  };

  const canSubmit = selectedDecision !== '' && medicalAssessment.trim().length >= 10;

  const decisionOptions = [
    { value: 'APPROVED',              label: t('decision.approveAll'),     icon: <CheckCircleOutlined />,       color: '#52c41a', bgTint: '#f6ffed', borderColor: '#52c41a' },
    { value: 'PARTIALLY_APPROVED',    label: t('decision.approvePartial'), icon: <ExclamationCircleOutlined />, color: '#fa8c16', bgTint: '#fff7e6', borderColor: '#fa8c16' },
    { value: 'OVERRIDE_APPROVE',      label: t('decision.approveOverride'),icon: <ThunderboltOutlined />,       color: '#faad14', bgTint: '#fffbe6', borderColor: '#faad14' },
    { value: 'REJECTED',              label: t('decision.rejectAll'),      icon: <CloseCircleOutlined />,       color: '#ff4d4f', bgTint: '#fff1f0', borderColor: '#ff4d4f' },
    { value: 'EXAMINATION_REQUESTED', label: t('decision.requestExam'),    icon: <MedicineBoxOutlined />,       color: '#eb2f96', bgTint: '#fff0f6', borderColor: '#eb2f96' },
    { value: 'DOCS_REQUESTED',        label: t('decision.requestDocs'),    icon: <FileAddOutlined />,           color: '#722ed1', bgTint: '#f9f0ff', borderColor: '#722ed1' },
    { value: 'PENDING_COMMITTEE',     label: t('decision.referCommittee'), icon: <TeamOutlined />,              color: '#1890ff', bgTint: '#e6f7ff', borderColor: '#1890ff' },
  ];

  const cardStyle     = { borderRadius: 12, marginBottom: 16 };
  const cardHeadStyle = { color: NAVY, fontWeight: 700 as const };

  const handleSubmit = () => {
    setShowConfirmModal(false);
    message.success({ content: t('decision.submitSuccess'), duration: 3 });
    setTimeout(() => navigate('/doctor/queue'), 1500);
  };

  /* ─────────────────────────────────────────────────────────────────────
     RIGHT COLUMN sub-renders
  ───────────────────────────────────────────────────────────────────── */

  const renderPartialApproval = () => (
    <Card
      style={{ border: '2px solid #fa8c16', borderRadius: 10, marginBottom: 12, background: '#fffbe6' }}
      bodyStyle={{ padding: 16 }}
    >
      <Text strong style={{ color: '#d46b08', display: 'block', marginBottom: 10 }}>
        {t('decision.partialApproval')}
      </Text>
      {/* Day bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 20 }}>
          <div style={{ flex: partialApprovedDays, background: '#52c41a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {partialApprovedDays > 0 && <Text style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{partialApprovedDays}d ✓</Text>}
          </div>
          <div style={{ flex: Math.max(partialRejectedDays, 0), background: '#ff4d4f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {partialRejectedDays > 0 && <Text style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>{partialRejectedDays}d ✗</Text>}
          </div>
        </div>
        <Row style={{ marginTop: 6 }}>
          <Col span={12}><Tag color="green">{t('decision.approvedDays', { count: partialApprovedDays })}</Tag></Col>
          <Col span={12}><Tag color="red">{t('decision.rejectedDays', { count: partialRejectedDays })}</Tag></Col>
        </Row>
      </div>
      <Row gutter={[8, 8]}>
        <Col span={12}>
          <Text style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{t('decision.approvedFrom')}</Text>
          <DatePicker
            value={partialFrom}
            onChange={(d) => setPartialFrom(d)}
            style={{ width: '100%' }}
            disabledDate={(d) => d.isBefore(dayjs(leave.fromDate)) || d.isAfter(dayjs(leave.toDate))}
            size="small"
          />
        </Col>
        <Col span={12}>
          <Text style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{t('decision.approvedTo')}</Text>
          <DatePicker
            value={partialTo}
            onChange={(d) => setPartialTo(d)}
            style={{ width: '100%' }}
            disabledDate={(d) => d.isBefore(dayjs(leave.fromDate)) || d.isAfter(dayjs(leave.toDate))}
            size="small"
          />
        </Col>
      </Row>
      <Text type="danger" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
        ⚠️ {t('decision.rejectedDaysWarn')}
      </Text>
      <Divider style={{ margin: '10px 0' }} />
      <Text style={{ fontSize: 12 }}>{t('decision.partialReasonLabel')}</Text>
      <Radio.Group
        value={partialReason}
        onChange={(e: RadioChangeEvent) => setPartialReason(e.target.value)}
        style={{ display: 'block', marginTop: 6 }}
      >
        <Space direction="vertical" size={4}>
          <Radio value="per_rules">{t('decision.partialReasonRules')}</Radio>
          <Radio value="assessment">{t('decision.partialReasonAssessment')}</Radio>
          <Radio value="insufficient_docs">{t('decision.partialReasonInsufficientDocs')}</Radio>
          <Radio value="other">{t('decision.partialReasonOther')}</Radio>
        </Space>
      </Radio.Group>
      <div style={{ marginTop: 10 }}>
        <Text style={{ fontSize: 12 }}>{t('decision.partialExplanation')} <Text type="danger">*</Text></Text>
        <TextArea rows={3} value={partialExplanation} onChange={(e) => setPartialExplanation(e.target.value)} style={{ marginTop: 4 }} />
      </div>
    </Card>
  );

  const renderRejection = () => (
    <Card style={{ border: '2px solid #ff4d4f', borderRadius: 10, marginBottom: 12, background: '#fff1f0' }} bodyStyle={{ padding: 16 }}>
      <Text strong style={{ color: '#cf1322', display: 'block', marginBottom: 10 }}>{t('decision.rejectionReasons')}</Text>
      <Checkbox.Group
        value={rejectionReasons}
        onChange={(vals) => setRejectionReasons(vals as string[])}
        style={{ display: 'block' }}
      >
        <Space direction="vertical" size={4}>
          {[
            { value: 'missing_docs',     label: t('decision.rejMissingDocs') },
            { value: 'gp_limit',         label: t('decision.rejGpLimit') },
            { value: 'specialist_limit', label: t('decision.rejSpecialistLimit') },
            { value: 'blocked_facility', label: t('decision.rejBlockedFacility') },
            { value: 'tampered_docs',    label: t('decision.rejTamperedDocs') },
            { value: 'no_receipt',       label: t('decision.rejNoReceipt') },
            { value: 'no_prescription',  label: t('decision.rejNoPrescription') },
            { value: 'no_stamp',         label: t('decision.rejNoStamp') },
            { value: 'no_lab',           label: t('decision.rejNoLab') },
            { value: 'no_imaging',       label: t('decision.rejNoImaging') },
            { value: 'unjustified',      label: t('decision.rejUnjustified') },
            { value: 'exceeds_entitlement', label: t('decision.rejExceedsEntitlement') },
            { value: 'other',            label: t('decision.rejOther') },
          ].map((opt) => (
            <Checkbox key={opt.value} value={opt.value}>{opt.label}</Checkbox>
          ))}
        </Space>
      </Checkbox.Group>
      <div style={{ marginTop: 10 }}>
        <Text style={{ fontSize: 12 }}>{t('decision.rejNotes')}</Text>
        <TextArea rows={3} value={rejectionNotes} onChange={(e) => setRejectionNotes(e.target.value)} style={{ marginTop: 4 }} />
      </div>
    </Card>
  );

  const renderOverride = () => (
    <Card style={{ border: '2px solid #faad14', borderRadius: 10, marginBottom: 12, background: '#fffbe6' }} bodyStyle={{ padding: 16 }}>
      <Alert
        type="warning"
        showIcon
        message={t('decision.overrideAlert')}
        description={
          <ul style={{ margin: '4px 0 0 0', paddingInlineStart: 16 }}>
            {aiViolations.map((v, i) => <li key={i}>{v}</li>)}
          </ul>
        }
        style={{ marginBottom: 10 }}
      />
      <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic', display: 'block', marginBottom: 10 }}>
        {t('decision.overrideAuthority')}
      </Text>
      <Text style={{ fontSize: 12 }}>{t('decision.overrideReason')} <Text type="danger">*</Text></Text>
      <TextArea rows={3} value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder={t('decision.overrideReasonPlaceholder')} style={{ marginTop: 4 }} />
    </Card>
  );

  const renderExamination = () => (
    <Card style={{ border: '2px solid #eb2f96', borderRadius: 10, marginBottom: 12, background: '#fff0f6' }} bodyStyle={{ padding: 16 }}>
      <Space style={{ marginBottom: 12 }}>
        <MedicineBoxOutlined style={{ color: '#eb2f96', fontSize: 18 }} />
        <Text strong style={{ color: '#c41d7f' }}>{t('decision.requestExam')}</Text>
      </Space>
      <Row gutter={[8, 10]}>
        <Col span={12}>
          <Text style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{t('decision.examDate')} <Text type="danger">*</Text></Text>
          <DatePicker
            value={examDate}
            onChange={(d) => setExamDate(d)}
            disabledDate={(d) => d.isBefore(dayjs(), 'day')}
            style={{ width: '100%' }}
            size="small"
          />
        </Col>
        <Col span={12}>
          <Text style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{t('decision.examTime')} <Text type="danger">*</Text></Text>
          <Select
            value={examTime}
            onChange={(v) => setExamTime(v)}
            style={{ width: '100%' }}
            size="small"
            options={examTimes.map((t) => ({ value: t, label: t }))}
            placeholder="08:00"
          />
        </Col>
        <Col span={24}>
          <Text style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{t('decision.examLocation')}</Text>
          <Input value={examLocation} onChange={(e) => setExamLocation(e.target.value)} size="small" />
        </Col>
        <Col span={24}>
          <Text style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{t('decision.examPurpose')} <Text type="danger">*</Text></Text>
          <TextArea rows={2} value={examPurpose} onChange={(e) => setExamPurpose(e.target.value)} placeholder={t('decision.examPurposePlaceholder')} />
        </Col>
        <Col span={24}>
          <Text style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{t('decision.mustBring')}</Text>
          <Checkbox.Group value={mustBring} onChange={(vals) => setMustBring(vals as string[])}>
            <Space direction="vertical" size={2}>
              <Checkbox value="original_cert">{t('decision.mustBringCert')}</Checkbox>
              <Checkbox value="all_docs">{t('decision.mustBringAllDocs')}</Checkbox>
              <Checkbox value="photo_id">{t('decision.mustBringId')}</Checkbox>
              <Checkbox value="medications">{t('decision.mustBringMeds')}</Checkbox>
            </Space>
          </Checkbox.Group>
        </Col>
        <Col span={24}>
          <Text style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{t('decision.noteToEmployee')}</Text>
          <TextArea rows={2} value={noteToEmployee} onChange={(e) => setNoteToEmployee(e.target.value)} />
        </Col>
      </Row>
      <Alert
        type="error"
        showIcon={false}
        message={t('decision.examProcessNote')}
        style={{ marginTop: 10, fontSize: 12 }}
      />
    </Card>
  );

  const renderRequestDocs = () => (
    <Card style={{ border: '2px solid #722ed1', borderRadius: 10, marginBottom: 12, background: '#f9f0ff' }} bodyStyle={{ padding: 16 }}>
      <Text strong style={{ color: '#531dab', display: 'block', marginBottom: 10 }}>{t('decision.requestedDocTypes')}</Text>
      <Checkbox.Group value={requestedDocTypes} onChange={(vals) => setRequestedDocTypes(vals as string[])}>
        <Space direction="vertical" size={4}>
          {[
            { value: 'lab',        label: t('decision.rdLab') },
            { value: 'xray',       label: t('decision.rdXray') },
            { value: 'hospital',   label: t('decision.rdHospitalReport') },
            { value: 'admission',  label: t('decision.rdAdmissionReport') },
            { value: 'discharge',  label: t('decision.rdDischargeReport') },
            { value: 'committee',  label: t('decision.rdCommitteeReport') },
            { value: 'other',      label: t('decision.rdOther') },
          ].map((opt) => <Checkbox key={opt.value} value={opt.value}>{opt.label}</Checkbox>)}
        </Space>
      </Checkbox.Group>
      <div style={{ marginTop: 10 }}>
        <Text style={{ fontSize: 12 }}>{t('decision.docsInstructions')}</Text>
        <TextArea rows={2} value={docsInstructions} onChange={(e) => setDocsInstructions(e.target.value)} style={{ marginTop: 4 }} />
      </div>
      <div style={{ marginTop: 10 }}>
        <Text style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>{t('decision.docsDeadline')}</Text>
        <DatePicker
          value={docsDeadline}
          onChange={(d) => setDocsDeadline(d)}
          disabledDate={(d) => d.isBefore(dayjs(), 'day')}
          style={{ width: '100%' }}
          size="small"
        />
      </div>
    </Card>
  );

  const renderCommittee = () => (
    <Card style={{ border: '2px solid #1890ff', borderRadius: 10, marginBottom: 12, background: '#e6f7ff' }} bodyStyle={{ padding: 16 }}>
      <Text strong style={{ color: '#096dd9', display: 'block', marginBottom: 10 }}>{t('decision.referCommittee')}</Text>
      <Text style={{ fontSize: 12 }}>{t('decision.referralReason')} <Text type="danger">*</Text></Text>
      <TextArea rows={3} value={referralReason} onChange={(e) => setReferralReason(e.target.value)} style={{ marginTop: 4, marginBottom: 10 }} />
      <Text style={{ fontSize: 12 }}>{t('decision.referralUrgency')}</Text>
      <Radio.Group value={referralUrgency} onChange={(e: RadioChangeEvent) => setReferralUrgency(e.target.value)} style={{ display: 'block', marginTop: 6 }}>
        <Space>
          <Radio value="NORMAL"><Tag>{t('decision.urgencyNormal')}</Tag></Radio>
          <Radio value="URGENT"><Tag color="orange">{t('decision.urgencyUrgent')}</Tag></Radio>
          <Radio value="CRITICAL"><Tag color="red">{t('decision.urgencyCritical')}</Tag></Radio>
        </Space>
      </Radio.Group>
    </Card>
  );

  /* ── Confirmation modal summary ── */
  const decisionSummary = decisionOptions.find((d) => d.value === selectedDecision);

  return (
    <div style={{ padding: '24px', background: '#f5f6fa', minHeight: '100vh' }}>

      {/* ── Top bar ── */}
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

        {/* ═══════════════════════════════════════
            LEFT COLUMN
        ═══════════════════════════════════════ */}
        <Col xs={24} lg={14}>

          {/* CARD 1: Employee Information */}
          <Card
            title={<span style={cardHeadStyle}><UserOutlined style={{ marginInlineEnd: 8, color: GOLD }} />{t('leaveReview.employeeInfo')}</span>}
            style={cardStyle}
          >
            <Row gutter={[16, 0]} align="middle">
              <Col flex="80px">
                <Avatar size={64} style={{ background: getAvatarColor(employee.id), fontSize: 28, fontWeight: 700 }}>
                  {(isAr ? employee.nameAr : employee.nameEn).charAt(0)}
                </Avatar>
              </Col>
              <Col flex="1">
                <Title level={4} style={{ margin: 0, color: NAVY }}>{isAr ? employee.nameAr : employee.nameEn}</Title>
                <Text type="secondary" style={{ fontSize: 13 }}>{employee.employeeNumber}</Text><br />
                <Text style={{ fontSize: 13 }}>
                  {isAr ? employee.department.nameAr : employee.department.nameEn} · {employee.jobTitle}
                </Text>
              </Col>
            </Row>
            <Divider style={{ margin: '16px 0' }} />
            <Row gutter={[8, 8]}>
              <Col span={6}><Statistic title={<Text style={{ fontSize: 11 }}>{t('leaveReview.totalLeaves')}</Text>} value={employeeAllLeaves.length} valueStyle={{ fontSize: 20, color: '#1890ff' }} /></Col>
              <Col span={6}><Statistic title={<Text style={{ fontSize: 11 }}>{t('leaveReview.daysUsed')}</Text>} value={daysUsed} valueStyle={{ fontSize: 20, color: '#fa8c16' }} /></Col>
              <Col span={6}><Statistic title={<Text style={{ fontSize: 11 }}>{t('leaveReview.balance')}</Text>} value={`${employee.sickLeaveBalance}/${employee.sickLeaveTotal}`} valueStyle={{ fontSize: 20, color: '#52c41a' }} /></Col>
              <Col span={6}><Statistic title={<Text style={{ fontSize: 11 }}>{t('leaveReview.violations')}</Text>} value={violations.length} valueStyle={{ fontSize: 20, color: violations.length > 0 ? '#ff4d4f' : '#52c41a' }} /></Col>
            </Row>
            <div style={{ marginTop: 12 }}>
              <a style={{ color: GOLD, fontWeight: 600, fontSize: 13 }}>{t('leaveReview.viewProfile')} →</a>
            </div>
          </Card>

          {/* CARD 2: Leave Information */}
          <Card title={<span style={cardHeadStyle}>{t('leaveReview.leaveInfo')}</span>} style={cardStyle}>
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
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: '50%', background: '#e6f7ff', border: '3px solid #1890ff', fontWeight: 700, fontSize: 20, color: '#1890ff' }}>
                  {leave.totalDays}
                </span>
                <Text style={{ marginInlineStart: 8, fontSize: 13 }}>{t('common.days')}</Text>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>{t('leaveReview.flags')}</Text>
                <Space wrap>
                  {weekendAdjacent && <Tag color="orange">🏖️ {t('queue.flagWeekend')}</Tag>}
                  {repeatPattern   && <Tag color="purple">🔄 {t('queue.flagFrequent')}</Tag>}
                  {aiViolations.length > 0 && (
                    <Tooltip title={aiViolations.join(', ')}>
                      <Tag color="red">⚠️ {t('leaveReview.ruleViolation')}</Tag>
                    </Tooltip>
                  )}
                  {!weekendAdjacent && !repeatPattern && aiViolations.length === 0 && (
                    <Tag color="green">✓ {t('leaveReview.noFlags')}</Tag>
                  )}
                </Space>
              </Col>
            </Row>
          </Card>

          {/* CARD 3: Medical Information */}
          <Card title={<span style={cardHeadStyle}>{t('leaveReview.medicalInfo')}</span>} style={cardStyle}>
            <Text strong style={{ fontSize: 13, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('leaveReview.doctorSection')}</Text>
            {doctor.trustScore !== null && doctor.trustScore < 0.4 && (
              <Alert message={`🚨 ${t('leaveReview.lowTrustAlert')}`} type="error" showIcon={false} style={{ marginTop: 10, marginBottom: 10, borderRadius: 8 }} />
            )}
            <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
              <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.doctorName')}</Text><Text strong style={{ fontSize: 15 }}>{isAr ? doctor.nameAr : doctor.nameEn}</Text></Col>
              <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.rank')}</Text><Tag color={doctor.rank === 'GP' || doctor.rank === 'RESIDENT' ? 'default' : doctor.rank === 'SPECIALIST' ? 'blue' : 'purple'}>{t(`doctorRanks.${doctor.rank.toLowerCase()}`)}</Tag></Col>
              <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.specialty')}</Text><Text style={{ fontSize: 14 }}>{doctor.specialty}</Text></Col>
              <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.trustScore')}</Text>{trustStars(doctor.trustScore)}{doctor.trustScore !== null && <Text style={{ marginInlineStart: 6, fontSize: 12, color: '#888' }}>({Math.round(doctor.trustScore * 100)}%)</Text>}</Col>
              <Col span={24}><Text type="secondary" style={{ fontSize: 12 }}>{t('leaveReview.doctorHistory', { count: doctor.leavesIssued, flagged: doctor.leavesFlagged })}</Text></Col>
            </Row>
            <Divider style={{ margin: '16px 0' }} />
            <Text strong style={{ fontSize: 13, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('leaveReview.facilitySection')}</Text>
            {facility.isBlocked && (
              <Alert message={`🚫 ${t('leaveReview.blockedFacilityAlert')}`} type="error" showIcon={false} style={{ marginTop: 10, marginBottom: 10, borderRadius: 8, fontWeight: 600 }} />
            )}
            <Row gutter={[16, 8]} style={{ marginTop: 12 }}>
              <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.facilityName')}</Text><Text strong style={{ fontSize: 15 }}>{isAr ? facility.nameAr : facility.nameEn}</Text></Col>
              <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.facilityType')}</Text><Tag>{t(`facilityTypes.${facilityTypeKey(facility.type)}`)}</Tag>{facility.isBlocked && <Tag color="red" style={{ marginInlineStart: 4 }}>🚫 {t('queue.blocked')}</Tag>}</Col>
              <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.trustScore')}</Text>{trustStars(facility.trustScore)}{facility.trustScore !== null && <Text style={{ marginInlineStart: 6, fontSize: 12, color: '#888' }}>({Math.round(facility.trustScore * 100)}%)</Text>}</Col>
              <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 12 }}>{t('leaveReview.facilityHistory', { count: facility.leavesFromFacility })}</Text></Col>
            </Row>
          </Card>

          {/* CARD 4: Diagnosis */}
          <Card title={<span style={cardHeadStyle}>{t('leaveReview.diagnosisCard')}</span>} style={cardStyle}>
            <Row gutter={[16, 12]}>
              <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.symptoms')}</Text><Text style={{ fontSize: 14 }}>{leave.symptoms}</Text></Col>
              <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.diagnosis')}</Text><Text strong style={{ fontSize: 15 }}>{leave.diagnosis}</Text></Col>
              {leave.icd10Code && (
                <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.icd10')}</Text><code style={{ background: '#f0f0f0', padding: '2px 8px', borderRadius: 4, fontSize: 14, fontFamily: 'monospace', color: '#555' }}>{leave.icd10Code}</code></Col>
              )}
              <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.hospitalized')}</Text><Tag color={leave.wasHospitalized ? 'green' : 'default'}>{leave.wasHospitalized ? t('common.yes') : t('common.no')}</Tag></Col>
              <Col xs={24} sm={12}><Text type="secondary" style={{ fontSize: 12, display: 'block' }}>{t('leaveReview.chronicDisease')}</Text><Tag color={leave.isChronicDisease ? 'orange' : 'default'}>{leave.isChronicDisease ? t('common.yes') : t('common.no')}</Tag></Col>
            </Row>
          </Card>

          {/* CARD 5: Employee Comment */}
          <Card
            title={<span style={cardHeadStyle}>💬 {t('leaveReview.commentCard')}</span>}
            style={{ ...cardStyle, background: '#e6f7ff', borderInlineStart: '4px solid #1890ff' }}
            bodyStyle={{ paddingTop: 8 }}
          >
            <div style={{ fontSize: 48, color: '#1890ff', lineHeight: 1, marginBottom: 4, opacity: 0.4 }}>"</div>
            <Paragraph style={{ fontSize: 16, lineHeight: 1.8, color: '#1a1a1a', margin: 0, direction: isAr ? 'rtl' : 'ltr' }}>
              {commentText}
            </Paragraph>
            <Divider style={{ margin: '16px 0', borderColor: '#91d5ff' }} />
            <div style={{ background: '#fff', borderRadius: 8, padding: 12 }}>
              <Text strong style={{ fontSize: 13, color: NAVY, display: 'block', marginBottom: 8 }}>🤖 {t('leaveReview.aiCommentAnalysis')}</Text>
              <Text type="secondary" style={{ fontSize: 13, fontStyle: 'italic' }}>{t('leaveReview.aiCommentText')}</Text>
              <div style={{ marginTop: 12 }}>
                <Row align="middle" gutter={8}>
                  <Col><Text style={{ fontSize: 12 }}>{t('leaveReview.credibilityScore')}:</Text></Col>
                  <Col flex="1"><Progress percent={85} strokeColor="#52c41a" size="small" style={{ margin: 0 }} /></Col>
                  <Col><Text strong style={{ fontSize: 12, color: '#52c41a' }}>85/100</Text></Col>
                </Row>
              </div>
            </div>
          </Card>

          {/* CARD 6: Documents */}
          <Card title={<span style={cardHeadStyle}>📄 {t('leaveReview.documentsCard')} ({documents.length})</span>} style={cardStyle}>
            <Row gutter={[12, 12]}>
              {documents.map((doc) => {
                const { icon: docIco, bg } = docIcon(doc.classification);
                const detections = docDetections(doc);
                return (
                  <Col xs={24} sm={12} key={doc.id}>
                    <Card size="small" bodyStyle={{ padding: 0 }} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e8e8e8' }}>
                      <div style={{ height: 160, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }} onClick={() => setPreviewDoc(doc)}>
                        {docIco}
                        <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(255,255,255,0.25)', borderRadius: 4, padding: '2px 6px', fontSize: 11, color: '#fff' }}>{t('leaveReview.clickToPreview')}</div>
                      </div>
                      <div style={{ padding: 10 }}>
                        <Text strong style={{ fontSize: 12, display: 'block' }} ellipsis={{ tooltip: doc.fileName }}>{doc.fileName}</Text>
                        <Tag style={{ marginTop: 4, marginBottom: 6, fontSize: 11 }} color={bg}>{docClassLabel(doc.classification)}</Tag>
                        <div style={{ marginBottom: 8 }}>
                          <Row align="middle" gutter={4}>
                            <Col><Text style={{ fontSize: 11 }}>{t('leaveReview.confidence')}:</Text></Col>
                            <Col flex="1"><Progress percent={Math.round(doc.confidence * 100)} strokeColor={doc.confidence >= 0.9 ? '#52c41a' : doc.confidence >= 0.7 ? '#faad14' : '#ff4d4f'} size="small" style={{ margin: 0 }} /></Col>
                            <Col><Text style={{ fontSize: 11 }}>{Math.round(doc.confidence * 100)}%</Text></Col>
                          </Row>
                        </div>
                        <Space size={4} wrap>
                          {detections.doctorStamp   && <span style={{ fontSize: 11, color: '#52c41a' }}><CheckCircleFilled /> {t('leaveReview.doctorStamp')}</span>}
                          {detections.facilityStamp && <span style={{ fontSize: 11, color: '#52c41a' }}><CheckCircleFilled /> {t('leaveReview.facilityStamp')}</span>}
                          {!detections.prescription && doc.classification !== 'PRESCRIPTION' && <span style={{ fontSize: 11, color: '#ff4d4f' }}><CloseCircleFilled /> {t('leaveReview.noPrescription')}</span>}
                          {detections.noTampering   && <span style={{ fontSize: 11, color: '#52c41a' }}><CheckCircleFilled /> {t('leaveReview.noTampering')}</span>}
                        </Space>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
            <Divider style={{ margin: '16px 0' }}>{t('leaveReview.docChecklist')}</Divider>
            <List size="small"
              dataSource={[
                { label: t('leaveReview.checkSickLeaf'),    found: documents.some((d) => d.classification === 'SICK_LEAVE_CERTIFICATE'), required: true },
                { label: t('leaveReview.checkReceipt'),     found: documents.some((d) => d.classification === 'FINANCIAL_RECEIPT'),      required: true },
                { label: t('leaveReview.checkPrescription'),found: documents.some((d) => d.classification === 'PRESCRIPTION'),            required: false },
                { label: t('leaveReview.checkFacilityStamp'),found: documents.some((d) => d.classification === 'SICK_LEAVE_CERTIFICATE'),required: true },
                { label: t('leaveReview.checkDoctorStamp'), found: documents.some((d) => d.classification === 'SICK_LEAVE_CERTIFICATE'), required: true },
                { label: t('leaveReview.checkLab'),         found: documents.some((d) => d.classification === 'LAB_RESULTS'),            required: false, note: t('leaveReview.checkLabNote') },
                { label: t('leaveReview.checkXray'),        found: documents.some((d) => d.classification === 'XRAY'),                   required: false, note: t('leaveReview.checkXrayNote') },
              ]}
              renderItem={(item) => (
                <List.Item style={{ padding: '6px 0' }}>
                  <Space>
                    {item.found ? <CheckCircleFilled style={{ color: '#52c41a', fontSize: 15 }} /> : item.required ? <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 15 }} /> : <ExclamationCircleFilled style={{ color: '#faad14', fontSize: 15 }} />}
                    <Text style={{ fontSize: 13 }}>{item.label}</Text>
                    {!item.found && item.note && <Text type="secondary" style={{ fontSize: 11 }}>— {item.note}</Text>}
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* ═══════════════════════════════════════
            RIGHT COLUMN
        ═══════════════════════════════════════ */}
        <Col xs={24} lg={10}>

          {/* CARD 7: AI Analysis */}
          <Card
            title={<span style={{ ...cardHeadStyle, color: GOLD }}><RobotOutlined style={{ marginInlineEnd: 8 }} />{t('decision.aiAnalysisTitle')}</span>}
            style={{ ...cardStyle, borderTop: `4px solid ${GOLD}` }}
          >
            {/* 4 Gauge circles */}
            <Row gutter={[8, 16]} justify="center">
              {[
                { label: t('decision.compliance'),    score: compliance,     isRisk: false },
                { label: t('decision.justifiability'),score: justifiability, isRisk: false },
                { label: t('decision.risk'),          score: riskScore,      isRisk: true  },
                { label: t('decision.documentation'), score: documentation,  isRisk: false },
              ].map(({ label, score, isRisk }) => (
                <Col span={12} key={label} style={{ textAlign: 'center' }}>
                  <Progress
                    type="circle"
                    percent={score}
                    width={88}
                    strokeColor={gaugeColor(score, isRisk)}
                    format={(p) => <span style={{ fontSize: 16, fontWeight: 700, color: gaugeColor(score, isRisk) }}>{p}</span>}
                  />
                  <div style={{ marginTop: 6 }}>
                    <Text style={{ fontSize: 12, color: '#555' }}>{label}</Text>
                  </div>
                </Col>
              ))}
            </Row>

            {/* AI Recommendation */}
            <div style={{ textAlign: 'center', marginTop: 16, marginBottom: 12 }}>
              <Text style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 6 }}>{t('decision.aiRecommendation')}</Text>
              <Tag
                color={aiRec.color}
                style={{ fontSize: 15, padding: '4px 16px', fontWeight: 700 }}
              >
                {aiRec.emoji} {aiRec.label}
              </Tag>
            </div>

            {/* Rule Violations */}
            <Collapse
              size="small"
              style={{ marginBottom: 12 }}
              items={[{
                key: 'violations',
                label: <Text strong style={{ fontSize: 13 }}>{t('decision.ruleChecks')}</Text>,
                children: (
                  <List
                    size="small"
                    dataSource={[
                      { type: 'warning', icon: <WarningFilled style={{ color: '#faad14' }} />, text: t('decision.ruleViolation1') },
                      { type: 'pass',    icon: <CheckCircleFilled style={{ color: '#52c41a' }} />, text: t('decision.rulePass1') },
                      { type: 'pass',    icon: <CheckCircleFilled style={{ color: '#52c41a' }} />, text: t('decision.rulePass2') },
                      { type: 'info',    icon: <InfoCircleFilled style={{ color: '#1890ff' }} />, text: t('decision.ruleInfo1') },
                    ]}
                    renderItem={(item) => (
                      <List.Item style={{ padding: '6px 0' }}>
                        <Space size={8}>
                          {item.icon}
                          <Text style={{ fontSize: 13 }}>{item.text}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                ),
              }]}
            />

            {/* AI Conclusion */}
            <div style={{ background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 8, padding: 12 }}>
              <Text strong style={{ fontSize: 12, color: NAVY, display: 'block', marginBottom: 6 }}>🤖 {t('decision.aiConclusion')}</Text>
              <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic', lineHeight: 1.6 }}>
                {t('decision.aiConclusionText')}
              </Text>
            </div>
          </Card>

          {/* CARD 8: Employee History */}
          <Card style={cardStyle} bodyStyle={{ padding: 0 }}>
            <Collapse
              defaultActiveKey={[]}
              items={[{
                key: 'history',
                label: (
                  <Space>
                    <HistoryOutlined style={{ color: GOLD }} />
                    <Text strong style={{ color: NAVY }}>{t('decision.historyTitle')}</Text>
                  </Space>
                ),
                children: (
                  <>
                    <Timeline
                      style={{ marginTop: 8 }}
                      items={[
                        { color: 'green', content: <Text style={{ fontSize: 12 }}>{t('decision.historyLeave1')}</Text> },
                        { color: 'green', content: <Text style={{ fontSize: 12 }}>{t('decision.historyLeave2')}</Text> },
                        { color: 'red',   content: <Text style={{ fontSize: 12 }}>{t('decision.historyLeave3')}</Text> },
                      ]}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>{t('decision.historySummary')}</Text>
                  </>
                ),
              }]}
            />
          </Card>

          {/* CARD 9: Doctor's Decision */}
          <Card
            title={
              <span style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>
                ⚕️ {t('decision.decisionTitle')}
              </span>
            }
            style={{ ...cardStyle, border: `2px solid ${GOLD}` }}
            bodyStyle={{ padding: '16px 20px' }}
          >
            {/* Decision radio options as cards */}
            <Radio.Group
              value={selectedDecision}
              onChange={(e: RadioChangeEvent) => setSelectedDecision(e.target.value)}
              style={{ display: 'block', width: '100%' }}
            >
              {decisionOptions.map((opt) => {
                const isSelected = selectedDecision === opt.value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => setSelectedDecision(opt.value)}
                    style={{
                      border: `1.5px solid ${isSelected ? opt.color : '#e8e8e8'}`,
                      borderInlineStart: isSelected ? `4px solid ${opt.color}` : '1.5px solid #e8e8e8',
                      background: isSelected ? opt.bgTint : '#fff',
                      borderRadius: 8,
                      padding: '10px 14px',
                      marginBottom: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      transition: 'all 0.2s',
                    }}
                  >
                    <Radio value={opt.value} style={{ marginInlineEnd: 0 }} />
                    <span style={{ color: opt.color, fontSize: 17 }}>{opt.icon}</span>
                    <Text strong style={{ fontSize: 13, color: isSelected ? opt.color : '#333' }}>{opt.label}</Text>
                  </div>
                );
              })}
            </Radio.Group>

            {/* ── Conditional sections ── */}
            {selectedDecision === 'PARTIALLY_APPROVED'    && renderPartialApproval()}
            {selectedDecision === 'REJECTED'              && renderRejection()}
            {selectedDecision === 'OVERRIDE_APPROVE'      && renderOverride()}
            {selectedDecision === 'EXAMINATION_REQUESTED' && renderExamination()}
            {selectedDecision === 'DOCS_REQUESTED'        && renderRequestDocs()}
            {selectedDecision === 'PENDING_COMMITTEE'     && renderCommittee()}

            <Divider style={{ margin: '14px 0' }} />

            {/* ── Always-visible assessment section ── */}
            <div style={{ marginBottom: 14 }}>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
                {t('decision.medicalAssessment')} <Text type="danger">*</Text>
              </Text>
              <TextArea
                rows={5}
                value={medicalAssessment}
                onChange={(e) => setMedicalAssessment(e.target.value)}
                placeholder={t('decision.medicalAssessmentPlaceholder')}
                style={{ fontSize: 13 }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                {t('decision.medicallyJustified')}
              </Text>
              <Radio.Group value={medicallyJustified} onChange={(e: RadioChangeEvent) => setMedicallyJustified(e.target.value)}>
                <Radio value="yes"><Tag color="green">{t('decision.justifiedYes')}</Tag></Radio>
                <Radio value="no"><Tag color="red">{t('decision.justifiedNo')}</Tag></Radio>
                <Radio value="partially"><Tag color="orange">{t('decision.justifiedPartially')}</Tag></Radio>
              </Radio.Group>
            </div>

            <div style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>{t('decision.instructionsToEmployee')}</Text>
              <TextArea rows={3} value={instructionsToEmployee} onChange={(e) => setInstructionsToEmployee(e.target.value)} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <Text style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>{t('decision.recommendationsToAdmin')}</Text>
              <TextArea rows={3} value={recommendationsToAdmin} onChange={(e) => setRecommendationsToAdmin(e.target.value)} />
            </div>

            {/* Blacklist recommendation */}
            <Collapse
              size="small"
              style={{ marginBottom: 16 }}
              items={[{
                key: 'blacklist',
                label: <Text style={{ fontSize: 13, color: '#ff4d4f' }}>⚠️ {t('decision.blacklistSection')}</Text>,
                children: (
                  <Space direction="vertical" style={{ width: '100%' }} size={12}>
                    <div>
                      <Row align="middle" justify="space-between">
                        <Text style={{ fontSize: 13 }}>{t('decision.blacklistDoctor')}</Text>
                        <Switch checked={blacklistDoctor} onChange={setBlacklistDoctor} size="small" />
                      </Row>
                      {blacklistDoctor && (
                        <TextArea
                          rows={2}
                          value={blacklistDoctorReason}
                          onChange={(e) => setBlacklistDoctorReason(e.target.value)}
                          placeholder={t('decision.blacklistReason')}
                          style={{ marginTop: 8 }}
                        />
                      )}
                    </div>
                    <div>
                      <Row align="middle" justify="space-between">
                        <Text style={{ fontSize: 13 }}>{t('decision.blacklistFacility')}</Text>
                        <Switch checked={blacklistFacility} onChange={setBlacklistFacility} size="small" />
                      </Row>
                      {blacklistFacility && (
                        <TextArea
                          rows={2}
                          value={blacklistFacilityReason}
                          onChange={(e) => setBlacklistFacilityReason(e.target.value)}
                          placeholder={t('decision.blacklistReason')}
                          style={{ marginTop: 8 }}
                        />
                      )}
                    </div>
                  </Space>
                ),
              }]}
            />

            {/* Submit button */}
            <Tooltip title={!canSubmit ? t('decision.submitHint') : undefined}>
              <Button
                type="primary"
                size="large"
                icon={<CheckOutlined />}
                block
                disabled={!canSubmit}
                onClick={() => setShowConfirmModal(true)}
                style={{
                  background: canSubmit ? GOLD : undefined,
                  borderColor: canSubmit ? GOLD : undefined,
                  fontWeight: 700,
                  fontSize: 15,
                  height: 48,
                }}
              >
                {t('decision.submitDecision')}
              </Button>
            </Tooltip>
          </Card>
        </Col>
      </Row>

      {/* ── Document Preview Modal ── */}
      <Modal open={previewDoc !== null} onCancel={() => setPreviewDoc(null)} footer={null} title={previewDoc?.fileName} centered width={600}>
        {previewDoc && (() => {
          const { icon: modalIcon, bg: modalBg } = docIcon(previewDoc.classification);
          return (
            <div style={{ height: 360, background: modalBg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>
              {modalIcon}
              <Text style={{ color: '#fff', marginTop: 16, fontWeight: 600, fontSize: 15 }}>{docClassLabel(previewDoc.classification)}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 4 }}>{previewDoc.fileName}</Text>
            </div>
          );
        })()}
      </Modal>

      {/* ── Confirmation Modal ── */}
      <Modal
        open={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onOk={handleSubmit}
        title={<Text strong style={{ color: NAVY, fontSize: 16 }}>⚕️ {t('decision.confirmTitle')}</Text>}
        okText={t('decision.confirmOk')}
        cancelText={t('common.cancel')}
        okButtonProps={{ style: { background: GOLD, borderColor: GOLD, fontWeight: 700 } }}
        centered
      >
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          <Alert
            message={t('decision.confirmWarning')}
            type="warning"
            showIcon
          />
          <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 14 }}>
            <Row gutter={[8, 8]}>
              <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>{t('decision.confirmDecisionLabel')}</Text></Col>
              <Col span={14}>
                {decisionSummary && (
                  <Tag color={decisionSummary.color} style={{ fontWeight: 700 }}>
                    {decisionSummary.label}
                  </Tag>
                )}
              </Col>
              <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>{t('leaveReview.reference')}</Text></Col>
              <Col span={14}><Text strong style={{ color: GOLD }}>{leave.refNumber}</Text></Col>
              <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>{t('leaveReview.employeeInfo')}</Text></Col>
              <Col span={14}><Text strong>{isAr ? employee.nameAr : employee.nameEn}</Text></Col>
              {selectedDecision === 'PARTIALLY_APPROVED' && (
                <>
                  <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>{t('decision.approvedDays', { count: partialApprovedDays })}</Text></Col>
                  <Col span={14}><Tag color="green">{partialApprovedDays} {t('common.days')}</Tag></Col>
                  <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>{t('decision.rejectedDays', { count: partialRejectedDays })}</Text></Col>
                  <Col span={14}><Tag color="red">{partialRejectedDays} {t('common.days')}</Tag></Col>
                </>
              )}
            </Row>
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default LeaveReview;
