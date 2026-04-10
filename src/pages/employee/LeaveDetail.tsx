import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Typography,
  Alert,
  Progress,
  Timeline,
  Collapse,
  Upload,
  Checkbox,
  Modal,
  List,
  Spin,
} from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  MedicineBoxOutlined,
  LoadingOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  CloudUploadOutlined,
  WarningFilled,
  StarFilled,
  PlusOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useLeaveStore } from '../../store/leaveStore';
import type { LeaveStatus } from '../../types';

const { Text, Title } = Typography;

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtDate = (d: Date | string) => dayjs(d).format('DD MMM YYYY');
const fmtDateTime = (d: Date | string) => dayjs(d).format('DD MMM YYYY, h:mm A');

const renderStars = (score: number | null) => {
  if (score === null) return <Text type="secondary">N/A</Text>;
  const full = Math.round(score * 5);
  return (
    <span>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarFilled
          key={i}
          style={{ color: i <= full ? '#faad14' : '#d9d9d9', fontSize: 12 }}
        />
      ))}
      <Text style={{ marginInlineStart: 4, fontSize: 12 }}>{score.toFixed(2)}</Text>
    </span>
  );
};

const STATUS_META: Record<
  LeaveStatus,
  { bg: string; text: string; border: string }
> = {
  SUBMITTED: { bg: '#1890ff', text: '#fff', border: '#1890ff' },
  PROCESSING: { bg: '#13c2c2', text: '#fff', border: '#13c2c2' },
  UNDER_REVIEW: { bg: '#fa8c16', text: '#fff', border: '#fa8c16' },
  DOCS_REQUESTED: { bg: '#722ed1', text: '#fff', border: '#722ed1' },
  EXAMINATION_REQUESTED: { bg: '#eb2f96', text: '#fff', border: '#eb2f96' },
  APPROVED: { bg: '#52c41a', text: '#fff', border: '#52c41a' },
  PARTIALLY_APPROVED: { bg: '#fa8c16', text: '#fff', border: '#fa8c16' },
  REJECTED: { bg: '#ff4d4f', text: '#fff', border: '#ff4d4f' },
  PENDING_COMMITTEE: { bg: '#fa541c', text: '#fff', border: '#fa541c' },
};

const DOC_TYPE_COLOR: Record<string, string> = {
  SICK_LEAVE_CERTIFICATE: 'blue',
  FINANCIAL_RECEIPT: 'green',
  PRESCRIPTION: 'purple',
  LAB_RESULTS: 'orange',
  XRAY: 'cyan',
  HOSPITAL_REPORT: 'geekblue',
  OTHER: 'default',
};

const DOC_TYPE_LABEL: Record<string, string> = {
  SICK_LEAVE_CERTIFICATE: 'Sick Leave Certificate',
  FINANCIAL_RECEIPT: 'Financial Receipt',
  PRESCRIPTION: 'Prescription',
  LAB_RESULTS: 'Lab Results',
  XRAY: 'X-ray / Imaging',
  HOSPITAL_REPORT: 'Hospital Report',
  OTHER: 'Other',
};

const RANK_LABEL: Record<string, string> = {
  GP: 'GP',
  RESIDENT: 'Resident',
  SPECIALIST: 'Specialist',
  CONSULTANT: 'Consultant',
};

const FACILITY_TYPE_LABEL: Record<string, string> = {
  GOVERNMENT_HOSPITAL: 'Government Hospital',
  PRIVATE_HOSPITAL: 'Private Hospital',
  UNIVERSITY_HOSPITAL: 'University Hospital',
  ROYAL_MEDICAL_SERVICES: 'Royal Medical Services',
  HEALTH_CENTER: 'Health Center',
  PRIVATE_CLINIC: 'Private Clinic',
  PRIVATE_24H: 'Private 24h Center',
  SPECIALIZED_CENTER: 'Specialized Center',
  MILITARY_HOSPITAL: 'Military Hospital',
};

// ── Main component ─────────────────────────────────────────────────────────
const LeaveDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [attendanceConfirmed, setAttendanceConfirmed] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const { currentLeave: leave, loadLeaveById, isLoading } = useLeaveStore();

  useEffect(() => {
    if (id) loadLeaveById(id);
  }, [id, loadLeaveById]);

  const violation = leave?.violationId ? undefined : undefined;

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!leave) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <CloseCircleFilled style={{ fontSize: 64, color: '#ff4d4f', marginBottom: 16 }} />
        <Title level={3}>Leave not found</Title>
        <Button onClick={() => navigate('/employee/my-leaves')}>
          {t('leaveDetail.backToMyLeaves')}
        </Button>
      </div>
    );
  }

  const meta = STATUS_META[leave.status];
  const examDaysLeft = leave.examinationDetails
    ? dayjs(leave.examinationDetails.date).diff(dayjs(), 'day')
    : 0;

  // ── Status Banner ────────────────────────────────────────────────────────
  const renderBanner = () => {
    const base: React.CSSProperties = {
      background: meta.bg,
      color: meta.text,
      padding: '20px 28px',
      borderRadius: 12,
      marginBottom: 24,
    };

    switch (leave.status) {
      case 'SUBMITTED':
        return (
          <div style={base}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <CheckCircleOutlined style={{ fontSize: 24 }} />
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>
                {t('leaveDetail.statusSubmitted')}
              </Text>
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
              {t('leaveDetail.submittedOn')}: {fmtDateTime(leave.submittedAt)}
            </Text>
          </div>
        );

      case 'PROCESSING':
        return (
          <div style={base}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <LoadingOutlined style={{ fontSize: 24 }} spin />
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>
                {t('leaveDetail.statusProcessing')}
              </Text>
            </div>
            <Progress percent={60} showInfo={false} strokeColor="#fff" trailColor="rgba(255,255,255,0.3)" size="small" />
          </div>
        );

      case 'UNDER_REVIEW':
        return (
          <div style={base}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <ExclamationCircleOutlined style={{ fontSize: 24 }} />
              <Text style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>
                {t('leaveDetail.statusUnderReview')}
              </Text>
            </div>
            <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
              Dr. Jalal Al-Khashman
            </Text>
          </div>
        );

      case 'DOCS_REQUESTED':
        return (
          <div>
            <div style={base}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <ExclamationCircleFilled style={{ fontSize: 24 }} />
                <Text style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>
                  {t('leaveDetail.statusDocsRequested')}
                </Text>
              </div>
              <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                {t('leaveDetail.requestedDocsList')}
              </Text>
            </div>
            {leave.requestedDocuments && leave.requestedDocuments.length > 0 && (
              <Card
                style={{ borderRadius: 10, marginBottom: 16, borderColor: '#722ed1' }}
              >
                <Text strong style={{ display: 'block', marginBottom: 12, color: '#722ed1', fontSize: 14 }}>
                  {t('leaveDetail.requestedDocs')}
                </Text>
                {leave.requestedDocuments.map((doc, i) => (
                  <Alert key={i} type="warning" showIcon message={doc} style={{ marginBottom: 6, borderRadius: 6 }} />
                ))}
                <div style={{ marginTop: 12 }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {t('leaveDetail.deadline')}: {fmtDate(new Date(Date.now() + 5 * 86400000))}
                    {' — '}
                    <Text style={{ color: '#fa8c16', fontWeight: 600 }}>
                      {t('leaveDetail.daysRemaining', { days: 5 })}
                    </Text>
                  </Text>
                </div>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  style={{ marginTop: 12, background: '#722ed1', borderColor: '#722ed1', borderRadius: 8 }}
                >
                  {t('leaveDetail.uploadAdditionalDocuments')}
                </Button>
              </Card>
            )}
          </div>
        );

      case 'EXAMINATION_REQUESTED':
        return (
          <div>
            <div style={base}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                <MedicineBoxOutlined style={{ fontSize: 24 }} />
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>
                  {t('leaveDetail.statusExaminationRequested')}
                </Text>
              </div>
            </div>
            {leave.examinationDetails && (
              <Card
                style={{ borderRadius: 12, marginBottom: 16, border: '2px solid #eb2f96' }}
              >
                <Row gutter={[20, 12]}>
                  <Col xs={24} md={14}>
                    <Title level={5} style={{ color: '#eb2f96', marginBottom: 16 }}>
                      📅 {t('leaveDetail.examinationAppointment', {
                        date: fmtDate(leave.examinationDetails.date),
                        time: leave.examinationDetails.time,
                      })}
                    </Title>
                    {[
                      { icon: '📅', label: t('leaveDetail.examDate'), val: fmtDate(leave.examinationDetails.date) },
                      { icon: '🕐', label: t('leaveDetail.examTime'), val: leave.examinationDetails.time },
                      { icon: '📍', label: t('leaveDetail.examLocation'), val: leave.examinationDetails.location },
                    ].map((row, i) => (
                      <div key={i} style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 16 }}>{row.icon}</span>
                        <div>
                          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>{row.label}</Text>
                          <Text style={{ fontSize: 13, fontWeight: 500 }}>{row.val}</Text>
                        </div>
                      </div>
                    ))}
                  </Col>
                  <Col xs={24} md={10}>
                    <Card
                      style={{ background: '#fff7e6', border: '1px solid #ffd591', borderRadius: 8 }}
                      bodyStyle={{ padding: '12px 16px' }}
                    >
                      <Text strong style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                        📋 {t('leaveDetail.examinationRequirements')}
                      </Text>
                      {[
                        t('leaveDetail.originalSickLeave'),
                        t('leaveDetail.allDocuments'),
                        t('leaveDetail.photoID'),
                        t('leaveDetail.currentMedications'),
                      ].map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />
                          <Text style={{ fontSize: 12 }}>{item}</Text>
                        </div>
                      ))}
                    </Card>
                    {examDaysLeft >= 0 && (
                      <div
                        style={{
                          marginTop: 12,
                          background: '#fff2f0',
                          border: '1px solid #ffccc7',
                          borderRadius: 8,
                          padding: '10px 14px',
                          textAlign: 'center',
                        }}
                      >
                        <Text style={{ color: '#ff4d4f', fontSize: 13, fontWeight: 600 }}>
                          ⏱️ {t('leaveDetail.countdown', { days: examDaysLeft })}
                        </Text>
                      </div>
                    )}
                    <Alert
                      type="error"
                      showIcon
                      message={t('leaveDetail.failureWarning')}
                      style={{ borderRadius: 8, marginTop: 8, fontSize: 11 }}
                    />
                    <Button
                      block
                      type="primary"
                      style={{
                        marginTop: 12,
                        background: '#52c41a',
                        borderColor: '#52c41a',
                        borderRadius: 8,
                        fontWeight: 700,
                      }}
                      onClick={() => setConfirmModalVisible(true)}
                      disabled={leave.examinationDetails?.confirmed || attendanceConfirmed}
                    >
                      {attendanceConfirmed || leave.examinationDetails?.confirmed
                        ? '✓ Attendance Confirmed'
                        : t('leaveDetail.confirmAttendance')}
                    </Button>
                  </Col>
                </Row>
              </Card>
            )}
          </div>
        );

      case 'APPROVED':
        return (
          <div style={base}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <CheckCircleFilled style={{ fontSize: 28 }} />
              <div>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: 700, display: 'block' }}>
                  {t('leaveDetail.statusApproved')}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                  {leave.approvedDays} {t('common.days')} — {fmtDate(leave.fromDate)} → {fmtDate(leave.toDate)}
                </Text>
              </div>
            </div>
          </div>
        );

      case 'PARTIALLY_APPROVED': {
        const pa = leave.partialApprovalDetails;
        return (
          <div>
            <div style={base}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <ExclamationCircleFilled style={{ fontSize: 28 }} />
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: 700 }}>
                  {t('leaveDetail.statusPartiallyApproved')}
                </Text>
              </div>
              {pa && (
                <div>
                  <div style={{ display: 'flex', height: 14, borderRadius: 7, overflow: 'hidden', marginBottom: 8, maxWidth: 400 }}>
                    <div
                      style={{
                        width: `${(pa.approvedDays / leave.totalDays) * 100}%`,
                        background: '#52c41a',
                      }}
                    />
                    <div
                      style={{
                        width: `${(pa.rejectedDays / leave.totalDays) * 100}%`,
                        background: '#ff4d4f',
                      }}
                    />
                  </div>
                  <Row gutter={16}>
                    <Col>
                      <Tag color="green" style={{ fontWeight: 600 }}>
                        ✅ {pa.approvedDays} {t('common.days')} {t('leaveDetail.approved')} — {t('leaveDetail.fullPay')}
                      </Tag>
                    </Col>
                    <Col>
                      <Tag color="red" style={{ fontWeight: 600 }}>
                        ❌ {pa.rejectedDays} {t('common.days')} {t('leaveDetail.rejected')} — {t('leaveDetail.unpaid')}
                      </Tag>
                    </Col>
                  </Row>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'REJECTED':
        return (
          <div style={base}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <CloseCircleFilled style={{ fontSize: 28 }} />
              <div>
                <Text style={{ color: '#fff', fontSize: 20, fontWeight: 700, display: 'block' }}>
                  {t('leaveDetail.statusRejected')}
                </Text>
                {leave.rejectionReason && (
                  <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                    {leave.rejectionReason}
                  </Text>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div style={base}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{leave.status}</Text>
          </div>
        );
    }
  };

  // ── Timeline items ──────────────────────────────────────────────────────
  const timelineItems = leave.timeline.map((evt) => ({
    color: evt.color,
    children: (
      <div>
        <Text style={{ fontSize: 13, fontWeight: 500, display: 'block' }}>{evt.description}</Text>
        <Text type="secondary" style={{ fontSize: 11 }}>{fmtDateTime(evt.timestamp)}</Text>
      </div>
    ),
  }));

  // ── Doctor decision card ────────────────────────────────────────────────
  const showDecision = ['APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'].includes(leave.status);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Back button */}
      <div style={{ marginBottom: 20 }}>
        <Button
          icon={isAr ? <ArrowRightOutlined /> : <ArrowLeftOutlined />}
          onClick={() => navigate('/employee/my-leaves')}
          style={{ borderRadius: 8 }}
        >
          {t('leaveDetail.backToMyLeaves')}
        </Button>
      </div>

      {/* Status Banner */}
      {renderBanner()}

      <Row gutter={[20, 20]}>
        {/* LEFT column — main info */}
        <Col xs={24} lg={14}>
          {/* Leave Information */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('leaveDetail.leaveInformation')}</span>}
            style={{ borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div style={{ marginBottom: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>{t('leaveDetail.referenceNumber')}</Text>
              <div
                style={{
                  fontFamily: 'monospace',
                  fontSize: 22,
                  fontWeight: 800,
                  color: '#D4AF37',
                  letterSpacing: 1,
                }}
              >
                {leave.refNumber}
              </div>
            </div>

            {[
              { label: t('leaveDetail.submittedOn'), val: fmtDateTime(leave.submittedAt) },
              {
                label: t('leaveDetail.period'),
                val: `${fmtDate(leave.fromDate)} → ${fmtDate(leave.toDate)}`,
              },
              {
                label: t('leaveDetail.duration'),
                val: (
                  <Tag color="blue" style={{ fontWeight: 700, fontSize: 14 }}>
                    {leave.totalDays} {t('common.days')}
                  </Tag>
                ),
              },
              {
                label: t('leaveDetail.currentStatus'),
                val: (
                  <Tag
                    color={STATUS_META[leave.status].bg}
                    style={{ fontWeight: 600, color: '#fff' }}
                  >
                    {leave.status.replace('_', ' ')}
                  </Tag>
                ),
              },
            ].map((row, i) => (
              <Row
                key={i}
                style={{ padding: '8px 0', borderBottom: i < 3 ? '1px solid #f5f5f5' : 'none' }}
              >
                <Col span={10}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{row.label}</Text>
                </Col>
                <Col span={14}>
                  <Text style={{ fontSize: 13, fontWeight: 500 }}>{row.val}</Text>
                </Col>
              </Row>
            ))}
          </Card>

          {/* Medical Information */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('leaveDetail.medicalInformation')}</span>}
            style={{ borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            {/* Doctor */}
            <div style={{ marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f5f5f5' }}>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                {t('leaveDetail.diagnosis').replace('التشخيص', 'Doctor')} Doctor
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={{ fontWeight: 600, fontSize: 14 }}>
                  {isAr ? leave.doctor.nameAr : leave.doctor.nameEn}
                </Text>
                <Tag color="blue">{RANK_LABEL[leave.doctor.rank] || leave.doctor.rank}</Tag>
                {leave.facility.isBlocked && <Tag color="red">BLOCKED</Tag>}
              </div>
              <div style={{ marginTop: 4 }}>{renderStars(leave.doctor.trustScore)}</div>
            </div>

            {/* Facility */}
            <div>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                {t('leaveDetail.medicalInformation').replace('المعلومات الطبية', 'Facility')} Facility
              </Text>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={{ fontWeight: 600, fontSize: 14 }}>
                  {isAr ? leave.facility.nameAr : leave.facility.nameEn}
                </Text>
                <Tag color="default">{FACILITY_TYPE_LABEL[leave.facility.type] || leave.facility.type}</Tag>
              </div>
              <div style={{ marginTop: 4 }}>{renderStars(leave.facility.trustScore)}</div>
              {leave.facility.isBlocked && (
                <Alert
                  type="error"
                  showIcon
                  message="This facility is BLOCKED — leaves from this facility are not approved"
                  style={{ borderRadius: 8, marginTop: 8, fontSize: 12 }}
                />
              )}
            </div>
          </Card>

          {/* Diagnosis */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('leaveDetail.diagnosis')}</span>}
            style={{ borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            {[
              { label: t('leaveDetail.symptoms'), val: leave.symptoms },
              { label: t('leaveDetail.diagnosis'), val: leave.diagnosis },
              { label: t('leaveDetail.icd10'), val: leave.icd10Code || '—' },
              {
                label: t('leaveDetail.hospitalized'),
                val: (
                  <Tag color={leave.wasHospitalized ? 'orange' : 'green'}>
                    {leave.wasHospitalized ? t('common.yes') : t('common.no')}
                  </Tag>
                ),
              },
              {
                label: t('leaveDetail.chronicDisease'),
                val: (
                  <Tag color={leave.isChronicDisease ? 'orange' : 'green'}>
                    {leave.isChronicDisease ? t('common.yes') : t('common.no')}
                  </Tag>
                ),
              },
            ].map((row, i) => (
              <Row
                key={i}
                style={{ padding: '8px 0', borderBottom: i < 4 ? '1px solid #f5f5f5' : 'none' }}
              >
                <Col span={10}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{row.label}</Text>
                </Col>
                <Col span={14}>
                  <Text style={{ fontSize: 13 }}>{row.val}</Text>
                </Col>
              </Row>
            ))}
          </Card>

          {/* Company Doctor Decision */}
          {showDecision && (
            <Card
              title={
                <span style={{ fontWeight: 700, color: '#001529' }}>
                  {t('leaveDetail.companyDoctorDecision')}
                </span>
              }
              style={{ borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              <div style={{ marginBottom: 12 }}>
                <Tag
                  color={
                    leave.status === 'APPROVED'
                      ? 'green'
                      : leave.status === 'PARTIALLY_APPROVED'
                      ? 'gold'
                      : 'red'
                  }
                  style={{ fontSize: 15, padding: '4px 14px', fontWeight: 700 }}
                >
                  {leave.status === 'APPROVED'
                    ? `✅ ${t('leaveDetail.approved')}`
                    : leave.status === 'PARTIALLY_APPROVED'
                    ? `⚠️ ${t('leaveDetail.statusPartiallyApproved')}`
                    : `❌ ${t('leaveDetail.rejected')}`}
                </Tag>
              </div>

              {leave.companyDoctorAssessment && (
                <div style={{ marginBottom: 14 }}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                    {t('leaveDetail.medicalAssessment')}
                  </Text>
                  <div
                    style={{
                      background: '#f0f7ff',
                      borderRadius: 8,
                      padding: '10px 14px',
                      fontSize: 13,
                    }}
                  >
                    {leave.companyDoctorAssessment}
                  </div>
                </div>
              )}

              {leave.status === 'PARTIALLY_APPROVED' && leave.partialApprovalDetails && (
                <div style={{ marginBottom: 14 }}>
                  {[
                    {
                      label: t('leaveDetail.approvedPeriod'),
                      color: 'green',
                      content: `${fmtDate(leave.partialApprovalDetails.approvedFrom)} — ${fmtDate(leave.partialApprovalDetails.approvedTo)} (${leave.partialApprovalDetails.approvedDays} ${t('common.days')})`,
                      badge: t('leaveDetail.fullPay'),
                      badgeColor: '#52c41a',
                    },
                    {
                      label: t('leaveDetail.rejectedPeriod'),
                      color: 'red',
                      content: `${fmtDate(leave.partialApprovalDetails.rejectedFrom)} — ${fmtDate(leave.partialApprovalDetails.rejectedTo)} (${leave.partialApprovalDetails.rejectedDays} ${t('common.days')})`,
                      badge: t('leaveDetail.unpaid'),
                      badgeColor: '#ff4d4f',
                    },
                  ].map((row, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 8,
                        background: row.color === 'green' ? '#f6ffed' : '#fff2f0',
                        border: `1px solid ${row.color === 'green' ? '#b7eb8f' : '#ffccc7'}`,
                        marginBottom: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div>
                        <Text
                          style={{
                            fontSize: 11,
                            color: row.badgeColor,
                            fontWeight: 600,
                            display: 'block',
                          }}
                        >
                          {row.label}
                        </Text>
                        <Text style={{ fontSize: 13 }}>{row.content}</Text>
                      </div>
                      <Tag
                        style={{
                          background: row.badgeColor,
                          borderColor: row.badgeColor,
                          color: '#fff',
                          fontWeight: 600,
                        }}
                      >
                        {row.badge}
                      </Tag>
                    </div>
                  ))}

                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: 11 }}>{t('leaveDetail.reason')}: </Text>
                    <Text style={{ fontSize: 12 }}>{leave.partialApprovalDetails.reason}</Text>
                  </div>

                  <div
                    style={{
                      marginTop: 12,
                      padding: '10px 14px',
                      background: '#fff7e6',
                      borderRadius: 8,
                      border: '1px solid #ffd591',
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                      {t('leaveDetail.updatedBalance')}
                    </Text>
                    <Text style={{ fontSize: 13, fontWeight: 600 }}>
                      8/14 → 7/14 {t('common.days')}
                      <Tag color="orange" style={{ marginInlineStart: 8, fontSize: 11 }}>
                        {t('leaveDetail.daysDeducted', { days: leave.partialApprovalDetails.approvedDays })}
                      </Tag>
                    </Text>
                  </div>
                </div>
              )}

              {leave.status === 'REJECTED' && leave.rejectionReason && (
                <Alert
                  type="error"
                  showIcon
                  message={t('leaveDetail.rejectionReasons')}
                  description={leave.rejectionReason}
                  style={{ borderRadius: 8, marginBottom: 10 }}
                />
              )}

              {leave.companyDoctorInstructions && (
                <div>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                    {t('leaveDetail.instructionsToEmployee')}
                  </Text>
                  <Alert
                    type="info"
                    showIcon
                    message={leave.companyDoctorInstructions}
                    style={{ borderRadius: 8 }}
                  />
                </div>
              )}
            </Card>
          )}

          {/* Penalty card */}
          {violation && (
            <Card
              title={
                <span style={{ fontWeight: 700, color: '#ff4d4f' }}>
                  <WarningFilled style={{ marginInlineEnd: 8 }} />
                  {t('leaveDetail.penalty')}
                </span>
              }
              style={{
                borderRadius: 12,
                marginBottom: 20,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                borderInlineStart: '4px solid #ff4d4f',
              }}
            >
              {[
                {
                  label: t('leaveDetail.violationNumber'),
                  val: violation.violationNumber === 1
                    ? t('leaveDetail.firstViolation')
                    : violation.violationNumber === 2
                    ? t('leaveDetail.secondViolation')
                    : t('leaveDetail.thirdViolation'),
                },
                {
                  label: t('leaveDetail.penaltyType'),
                  val: violation.penaltyDays
                    ? t('leaveDetail.salaryDeduction', { days: violation.penaltyDays })
                    : t('leaveDetail.writtenWarning'),
                },
                {
                  label: t('leaveDetail.appliedDate'),
                  val: fmtDate(violation.date),
                },
              ].map((row, i) => (
                <Row key={i} style={{ padding: '8px 0', borderBottom: i < 2 ? '1px solid #fff1f0' : 'none' }}>
                  <Col span={10}>
                    <Text type="secondary" style={{ fontSize: 12 }}>{row.label}</Text>
                  </Col>
                  <Col span={14}>
                    <Text style={{ fontSize: 13, fontWeight: 500, color: '#ff4d4f' }}>{row.val}</Text>
                  </Col>
                </Row>
              ))}
              <Alert
                type="error"
                showIcon
                message={violation.description}
                style={{ borderRadius: 8, marginTop: 10, fontSize: 12 }}
              />
            </Card>
          )}
        </Col>

        {/* RIGHT column — docs + timeline */}
        <Col xs={24} lg={10}>
          {/* My Comment */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('leaveDetail.myComment')}</span>}
            style={{ borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div
              style={{
                background: leave.employeeComments ? '#e6f7ff' : '#fafafa',
                borderRadius: 8,
                padding: '12px 16px',
                minHeight: 60,
              }}
            >
              <Text
                style={{
                  fontSize: 13,
                  color: leave.employeeComments ? '#001529' : '#8c8c8c',
                  fontStyle: leave.employeeComments ? 'normal' : 'italic',
                }}
                dir={isAr ? 'rtl' : 'ltr'}
              >
                {leave.employeeComments || t('leaveDetail.noComment')}
              </Text>
            </div>
          </Card>

          {/* My Documents */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('leaveDetail.myDocuments')}</span>}
            style={{ borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Row gutter={[10, 10]} style={{ marginBottom: 16 }}>
              {leave.documents.map((doc) => {
                const isPdf = doc.fileType === 'application/pdf';
                return (
                  <Col key={doc.id} xs={24} sm={12}>
                    <div
                      style={{
                        border: '1px solid #f0f0f0',
                        borderRadius: 8,
                        padding: '10px 12px',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                      }}
                    >
                      <div style={{ fontSize: 24, color: isPdf ? '#ff4d4f' : '#1890ff' }}>
                        {isPdf ? <FilePdfOutlined /> : <FileImageOutlined />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Text style={{ fontSize: 11, display: 'block', fontWeight: 500 }} ellipsis>
                          {doc.fileName}
                        </Text>
                        <Tag
                          color={DOC_TYPE_COLOR[doc.classification] || 'default'}
                          style={{ fontSize: 9, marginTop: 2 }}
                        >
                          {DOC_TYPE_LABEL[doc.classification] || doc.classification}
                        </Tag>
                        <div style={{ marginTop: 4 }}>
                          <Text
                            style={{
                              fontSize: 11,
                              color:
                                doc.confidence >= 0.8
                                  ? '#52c41a'
                                  : doc.confidence >= 0.6
                                  ? '#faad14'
                                  : '#ff4d4f',
                              fontWeight: 600,
                            }}
                          >
                            {Math.round(doc.confidence * 100)}%
                          </Text>
                          <Progress
                            percent={Math.round(doc.confidence * 100)}
                            showInfo={false}
                            size="small"
                            strokeColor={
                              doc.confidence >= 0.8
                                ? '#52c41a'
                                : doc.confidence >= 0.6
                                ? '#faad14'
                                : '#ff4d4f'
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>

            {/* Checklist */}
            <div style={{ borderTop: '1px solid #f5f5f5', paddingTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
                {t('submitLeave.documentChecklist')}
              </Text>
              {[
                {
                  ok: leave.documents.some((d) => d.classification === 'SICK_LEAVE_CERTIFICATE'),
                  label: t('submitLeave.sickLeaveCertificate'),
                  required: true,
                },
                {
                  ok: leave.documents.some((d) => d.classification === 'FINANCIAL_RECEIPT'),
                  label: t('submitLeave.financialReceipt'),
                  required: true,
                },
                {
                  ok: leave.documents.some((d) => d.classification === 'PRESCRIPTION'),
                  label: t('submitLeave.prescription'),
                  required: false,
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}
                >
                  {item.ok ? (
                    <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
                  ) : item.required ? (
                    <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
                  ) : (
                    <ExclamationCircleFilled style={{ color: '#faad14', fontSize: 14 }} />
                  )}
                  <Text style={{ fontSize: 12 }}>{item.label}</Text>
                </div>
              ))}
            </div>
          </Card>

          {/* Timeline */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('leaveDetail.timeline')}</span>}
            style={{ borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Timeline items={timelineItems} />
          </Card>

          {/* Upload additional documents */}
          <Collapse
            items={[
              {
                key: '1',
                label: (
                  <span style={{ fontWeight: 600, color: '#001529' }}>
                    <CloudUploadOutlined style={{ marginInlineEnd: 8, color: '#D4AF37' }} />
                    {t('leaveDetail.uploadAdditionalDocuments')}
                  </span>
                ),
                children: (
                  <div>
                    <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 12 }}>
                      💡 {t('leaveDetail.uploadHelpText')}
                    </Text>
                    <Upload.Dragger
                      multiple
                      accept=".jpg,.jpeg,.png,.pdf"
                      beforeUpload={() => false}
                      style={{ borderRadius: 8 }}
                    >
                      <CloudUploadOutlined style={{ fontSize: 32, color: '#D4AF37' }} />
                      <p style={{ marginTop: 8, color: '#595959' }}>
                        {t('submitLeave.dragDrop')}
                      </p>
                    </Upload.Dragger>
                  </div>
                ),
              },
            ]}
            style={{ borderRadius: 12, marginBottom: 20 }}
          />

          {/* Back button */}
          <div style={{ paddingBottom: 32 }}>
            <Button
              block
              size="large"
              icon={isAr ? <ArrowRightOutlined /> : <ArrowLeftOutlined />}
              onClick={() => navigate('/employee/my-leaves')}
              style={{ borderRadius: 8 }}
            >
              {t('leaveDetail.backToMyLeaves')}
            </Button>
          </div>
        </Col>
      </Row>

      {/* Attendance Confirmation Modal */}
      <Modal
        open={confirmModalVisible}
        title={t('leaveDetail.confirmAttendance')}
        onCancel={() => setConfirmModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setConfirmModalVisible(false)}>
            {t('common.back')}
          </Button>,
          <Button
            key="confirm"
            type="primary"
            style={{ background: '#52c41a', borderColor: '#52c41a' }}
            disabled={!attendanceConfirmed}
            onClick={() => {
              setConfirmModalVisible(false);
            }}
          >
            {t('leaveDetail.confirmAttendance')}
          </Button>,
        ]}
      >
        <Checkbox
          checked={attendanceConfirmed}
          onChange={(e) => setAttendanceConfirmed(e.target.checked)}
        >
          {t('leaveDetail.confirmAttendance')} — {leave.examinationDetails && fmtDate(leave.examinationDetails.date)}
        </Checkbox>
      </Modal>
    </div>
  );
};

export default LeaveDetail;
