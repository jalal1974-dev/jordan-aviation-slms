import React, { useState } from 'react';
import {
  Modal,
  Button,
  Card,
  Typography,
  Tag,
  Divider,
  notification,
} from 'antd';
import {
  SendOutlined,
  CheckCircleFilled,
  ExclamationCircleFilled,
  CloseCircleFilled,
  MailOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { SickLeave } from '../../types';

const { Text } = Typography;

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

interface SendResultModalProps {
  visible: boolean;
  onClose: () => void;
  leave: SickLeave | null;
  onSent?: (leaveId: string) => void;
}

const SendResultModal: React.FC<SendResultModalProps> = ({ visible, onClose, leave, onSent }) => {
  const { t, i18n } = useTranslation();
  const [sending, setSending] = useState(false);
  const isAr = i18n.language === 'ar';

  if (!leave) return null;

  const decision = leave.companyDoctorDecision;
  const employeeName = isAr ? leave.employee.nameAr : leave.employee.nameEn;
  const doctorName = isAr ? leave.doctor.nameAr : leave.doctor.nameEn;

  const handleSend = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    notification.success({
      message: t('adminDash.emailSentSuccess'),
      description: t('adminDash.emailSentTo', { email: leave.employee.email }),
      placement: 'topRight',
    });
    onSent?.(leave.id);
    onClose();
  };

  const headerColor =
    decision === 'APPROVED'
      ? '#52c41a'
      : decision === 'PARTIALLY_APPROVED'
      ? '#fa8c16'
      : '#ff4d4f';

  const headerIcon =
    decision === 'APPROVED' ? (
      <CheckCircleFilled style={{ fontSize: 28, color: '#fff' }} />
    ) : decision === 'PARTIALLY_APPROVED' ? (
      <ExclamationCircleFilled style={{ fontSize: 28, color: '#fff' }} />
    ) : (
      <CloseCircleFilled style={{ fontSize: 28, color: '#fff' }} />
    );

  const headerText =
    decision === 'APPROVED'
      ? t('adminDash.emailHeaderApproved')
      : decision === 'PARTIALLY_APPROVED'
      ? t('adminDash.emailHeaderPartial')
      : t('adminDash.emailHeaderRejected');

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      width={720}
      title={
        <span style={{ fontWeight: 700, color: '#001529', fontSize: 16 }}>
          <MailOutlined style={{ marginInlineEnd: 8, color: '#D4AF37' }} />
          {t('adminDash.sendResultTitle')}
        </span>
      }
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common.cancel')}
        </Button>,
        <Button key="edit" variant="outlined">
          {t('adminDash.editEmail')}
        </Button>,
        <Button
          key="send"
          type="primary"
          icon={<SendOutlined />}
          loading={sending}
          onClick={handleSend}
          style={{ background: '#D4AF37', borderColor: '#D4AF37', fontWeight: 600 }}
        >
          {t('adminDash.sendEmail')}
        </Button>,
      ]}
    >
      <Card
        style={{ border: '1px solid #d9d9d9', borderRadius: 12, overflow: 'hidden' }}
        bodyStyle={{ padding: 0 }}
      >
        {/* Email Meta Header */}
        <div style={{ background: '#fafafa', padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <Text type="secondary" style={{ width: 60, flexShrink: 0 }}>{t('adminDash.emailTo')}:</Text>
            <Text strong>{leave.employee.email}</Text>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
            <Text type="secondary" style={{ width: 60, flexShrink: 0 }}>{t('adminDash.emailSubject')}:</Text>
            <Text>{t('adminDash.emailSubjectText', { ref: leave.refNumber })}</Text>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Text type="secondary" style={{ width: 60, flexShrink: 0 }}>{t('adminDash.emailFrom')}:</Text>
            <Text>{t('adminDash.emailFromText')}</Text>
          </div>
        </div>

        {/* Decision Header Bar */}
        <div
          style={{
            background: headerColor,
            padding: '20px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          {headerIcon}
          <div>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{headerText}</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
              {t('adminDash.emailDear', { name: employeeName })}
            </div>
          </div>
        </div>

        {/* Email Body */}
        <div style={{ padding: '20px 24px' }}>
          {/* Leave Details */}
          <div
            style={{
              background: '#f9f9f9',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              padding: '14px 16px',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('adminDash.refNumber')}</Text>
                <div>
                  <Text strong style={{ color: '#D4AF37' }}>{leave.refNumber}</Text>
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('adminDash.emailPeriod')}</Text>
                <div>
                  <Text strong>
                    {formatDate(leave.fromDate)} — {formatDate(leave.toDate)}
                  </Text>
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('adminDash.emailDoctor')}</Text>
                <div>
                  <Text strong>{doctorName}</Text>
                </div>
              </div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('adminDash.emailDays')}</Text>
                <div>
                  <Text strong>{leave.totalDays} {t('common.days')}</Text>
                </div>
              </div>
            </div>
          </div>

          {/* APPROVED content */}
          {decision === 'APPROVED' && (
            <>
              <div
                style={{
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 14,
                }}
              >
                <Text style={{ color: '#389e0d' }}>
                  {t('adminDash.approvedFullPay')}
                </Text>
              </div>
              <div style={{ marginBottom: 10 }}>
                <Text type="secondary">{t('adminDash.updatedBalance')}: </Text>
                <Text strong>{leave.employee.sickLeaveBalance}/{leave.employee.sickLeaveTotal} {t('common.days')}</Text>
              </div>
              {leave.companyDoctorInstructions && (
                <div style={{ marginBottom: 10 }}>
                  <Text type="secondary">{t('adminDash.doctorInstructions')}: </Text>
                  <Text>{leave.companyDoctorInstructions}</Text>
                </div>
              )}
            </>
          )}

          {/* PARTIALLY APPROVED content */}
          {decision === 'PARTIALLY_APPROVED' && leave.partialApprovalDetails && (
            <>
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Text strong>{t('adminDash.approvedPeriod')}:</Text>
                  <Text>
                    {formatDate(leave.partialApprovalDetails.approvedFrom)} —{' '}
                    {formatDate(leave.partialApprovalDetails.approvedTo)}{' '}
                    ({leave.partialApprovalDetails.approvedDays} {t('common.day')})
                  </Text>
                  <Tag color="green">{t('leaveDetail.fullPay')}</Tag>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Text strong>{t('adminDash.rejectedPeriod')}:</Text>
                  <Text>
                    {formatDate(leave.partialApprovalDetails.rejectedFrom)} —{' '}
                    {formatDate(leave.partialApprovalDetails.rejectedTo)}{' '}
                    ({leave.partialApprovalDetails.rejectedDays} {t('common.days')})
                  </Text>
                  <Tag color="red">{t('leaveDetail.unpaid')}</Tag>
                </div>
                <div
                  style={{
                    background: '#fff7e6',
                    border: '1px solid #ffd591',
                    borderRadius: 8,
                    padding: '10px 14px',
                    marginTop: 8,
                  }}
                >
                  <Text type="secondary">{t('adminDash.partialReason')}: </Text>
                  <Text>{leave.partialApprovalDetails.reason}</Text>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <Text type="secondary">{t('adminDash.penaltyApplied')}: </Text>
                <Text strong style={{ color: '#ff4d4f' }}>
                  {t('adminDash.penaltyFirst')}
                </Text>
              </div>
              <div style={{ marginBottom: 10 }}>
                <Text type="secondary">{t('adminDash.updatedBalance')}: </Text>
                <Text strong>{leave.employee.sickLeaveBalance}/{leave.employee.sickLeaveTotal} {t('common.days')}</Text>
              </div>
              {leave.companyDoctorInstructions && (
                <div style={{ marginBottom: 10 }}>
                  <Text type="secondary">{t('adminDash.doctorInstructions')}: </Text>
                  <Text>{leave.companyDoctorInstructions}</Text>
                </div>
              )}
            </>
          )}

          {/* REJECTED content */}
          {decision === 'REJECTED' && (
            <>
              <div
                style={{
                  background: '#fff1f0',
                  border: '1px solid #ffa39e',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 14,
                }}
              >
                <div>
                  <Text type="secondary">{t('adminDash.rejectionReason')}: </Text>
                  <Text strong>{leave.rejectionReason ?? t('adminDash.policyViolation')}</Text>
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <Text type="secondary">{t('adminDash.penaltyApplied')}: </Text>
                <Text strong style={{ color: '#ff4d4f' }}>
                  {t('adminDash.penaltyFirst')}
                </Text>
              </div>
              <div
                style={{
                  background: '#f5f5f5',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 10,
                }}
              >
                <Text type="secondary">{t('adminDash.leaveCountedUnpaid')}</Text>
              </div>
              {leave.companyDoctorInstructions && (
                <div style={{ marginBottom: 10 }}>
                  <Text type="secondary">{t('adminDash.doctorInstructions')}: </Text>
                  <Text>{leave.companyDoctorInstructions}</Text>
                </div>
              )}
            </>
          )}

          <Divider />

          {/* Footer */}
          <div style={{ textAlign: 'center', color: '#8c8c8c' }}>
            <div style={{ fontWeight: 600, color: '#001529', marginBottom: 2 }}>
              Jordan Aviation — Human Resources Department
            </div>
            <div style={{ fontSize: 12 }}>إدارة الموارد البشرية — الأردنية للطيران</div>
          </div>
        </div>
      </Card>

      <div style={{ marginTop: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>
          💡 {t('adminDash.emailAutoGenerated')}
        </Text>
      </div>
    </Modal>
  );
};

export default SendResultModal;
