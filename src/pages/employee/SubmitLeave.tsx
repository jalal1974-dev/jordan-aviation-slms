import React, { useState, useMemo, useEffect } from 'react';
import {
  Steps,
  Card,
  Button,
  Upload,
  Input,
  Select,
  DatePicker,
  Checkbox,
  Alert,
  Progress,
  Tag,
  Row,
  Col,
  Typography,
  Divider,
  List,
  Modal,
  AutoComplete,
  message,
} from 'antd';
import type { UploadFile } from 'antd';
import {
  CloudUploadOutlined,
  EditOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  FilePdfOutlined,
  FileImageOutlined,
  PlusOutlined,
  CheckCircleFilled,
  CloseCircleFilled,
  ExclamationCircleFilled,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  FileAddOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs, { Dayjs } from 'dayjs';
import { useAuthStore } from '../../store/authStore';
import { useLeaveStore } from '../../store/leaveStore';
import { leavesAPI, doctorsAPI, facilitiesAPI, documentsAPI, uploadToCloudinary, ocrAPI, aiAPI } from '../../services/api';
import type { DoctorRank, FacilityType, Doctor, Facility } from '../../types';

const { Text, Title } = Typography;
const { TextArea } = Input;

// ── Types ──────────────────────────────────────────────────────────────────
interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: 'image' | 'pdf';
  classification: string;
  confidence: number;
  fileUrl?: string;
  uploading?: boolean;
  uploadError?: string;
  rawFile?: File;
}

interface FormState {
  doctorName: string;
  doctorRank: DoctorRank;
  doctorSpecialty: string;
  facilityName: string;
  facilityType: FacilityType;
  fromDate: Dayjs;
  toDate: Dayjs;
  wasHospitalized: boolean;
  isChronicDisease: boolean;
  symptoms: string;
  diagnosis: string;
  icd10Code: string;
}

// ── Mock pre-filled data ───────────────────────────────────────────────────
const INITIAL_FILES: UploadedFile[] = [];
const MOCK_COMMENT = 'كنت أعاني من آلام شديدة في المعدة في الساعة الثانية صباحاً واضطررت للذهاب إلى الطوارئ. الطبيب شخص الحالة بالتهاب المعدة الحاد ووصف لي العلاج.';

const INITIAL_FORM: FormState = {
  doctorName: 'Dr. Ahmad Saleh',
  doctorRank: 'SPECIALIST',
  doctorSpecialty: 'INTERNAL_MEDICINE',
  facilityName: 'Jordan Hospital',
  facilityType: 'PRIVATE_HOSPITAL',
  fromDate: dayjs('2024-06-12'),
  toDate: dayjs('2024-06-13'),
  wasHospitalized: false,
  isChronicDisease: false,
  symptoms: 'Severe stomach pain, nausea, vomiting',
  diagnosis: 'Acute Gastritis',
  icd10Code: 'K29.1',
};

const formatSize = (bytes: number) => {
  if (bytes >= 1000000) return `${(bytes / 1000000).toFixed(1)} MB`;
  return `${(bytes / 1000).toFixed(0)} KB`;
};

const CLASSIFICATION_OPTIONS = [
  { value: 'SICK_LEAVE_CERTIFICATE', labelEn: 'Sick Leave Certificate', labelAr: 'شهادة إجازة مرضية' },
  { value: 'FINANCIAL_RECEIPT', labelEn: 'Financial Receipt', labelAr: 'وصل مالي' },
  { value: 'PRESCRIPTION', labelEn: 'Prescription', labelAr: 'وصفة علاج' },
  { value: 'LAB_RESULTS', labelEn: 'Lab Results', labelAr: 'نتائج فحوصات' },
  { value: 'XRAY', labelEn: 'X-ray / Imaging', labelAr: 'أشعة' },
  { value: 'HOSPITAL_REPORT', labelEn: 'Hospital Report', labelAr: 'تقرير مستشفى' },
  { value: 'OTHER', labelEn: 'Other', labelAr: 'أخرى' },
];

const SPECIALTIES = [
  { value: 'GENERAL_MEDICINE', label: 'General Medicine' },
  { value: 'INTERNAL_MEDICINE', label: 'Internal Medicine' },
  { value: 'ORTHOPEDICS', label: 'Orthopedics' },
  { value: 'GASTROENTEROLOGY', label: 'Gastroenterology' },
  { value: 'NEUROLOGY', label: 'Neurology' },
  { value: 'CARDIOLOGY', label: 'Cardiology' },
  { value: 'PULMONOLOGY', label: 'Pulmonology' },
  { value: 'ENT', label: 'ENT (Ear, Nose, Throat)' },
  { value: 'OPHTHALMOLOGY', label: 'Ophthalmology' },
  { value: 'DERMATOLOGY', label: 'Dermatology' },
  { value: 'UROLOGY', label: 'Urology' },
  { value: 'PSYCHIATRY', label: 'Psychiatry' },
  { value: 'PEDIATRICS', label: 'Pediatrics' },
  { value: 'SURGERY', label: 'General Surgery' },
  { value: 'EMERGENCY', label: 'Emergency Medicine' },
  { value: 'FAMILY_MEDICINE', label: 'Family Medicine' },
];

const FACILITY_TYPES: { value: FacilityType; labelEn: string; labelAr: string }[] = [
  { value: 'GOVERNMENT_HOSPITAL', labelEn: 'Government Hospital', labelAr: 'مستشفى حكومي' },
  { value: 'PRIVATE_HOSPITAL', labelEn: 'Private Hospital', labelAr: 'مستشفى خاص' },
  { value: 'UNIVERSITY_HOSPITAL', labelEn: 'University Hospital', labelAr: 'مستشفى جامعي' },
  { value: 'ROYAL_MEDICAL_SERVICES', labelEn: 'Royal Medical Services', labelAr: 'الخدمات الطبية الملكية' },
  { value: 'HEALTH_CENTER', labelEn: 'Health Center', labelAr: 'مركز صحي' },
  { value: 'PRIVATE_CLINIC', labelEn: 'Private Clinic', labelAr: 'عيادة خاصة' },
  { value: 'PRIVATE_24H', labelEn: 'Private 24h Center', labelAr: 'مركز خاص 24 ساعة' },
  { value: 'SPECIALIZED_CENTER', labelEn: 'Specialized Center', labelAr: 'مركز متخصص' },
  { value: 'MILITARY_HOSPITAL', labelEn: 'Military Hospital', labelAr: 'مستشفى عسكري' },
];

// ── Main Component ─────────────────────────────────────────────────────────
const SubmitLeave: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const submitLeave = useLeaveStore((s) => s.submitLeave);

  const isAr = i18n.language === 'ar';
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);

  useEffect(() => {
    doctorsAPI.getAll().then((res) => {
      const data = res.data?.data ?? res.data ?? [];
      setDoctors(Array.isArray(data) ? data : []);
    }).catch(() => {});
    facilitiesAPI.getAll().then((res) => {
      const data = res.data?.data ?? res.data ?? [];
      setFacilities(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const [currentStep, setCurrentStep] = useState(0);
  const [files, setFiles] = useState<UploadedFile[]>(INITIAL_FILES);
  const [comment, setComment] = useState(MOCK_COMMENT);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrDone, setOcrDone] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [refNumber, setRefNumber] = useState('');

  // ── Computed values ────────────────────────────────────────────────────
  const totalDays = useMemo(() => {
    const diff = form.toDate.diff(form.fromDate, 'day') + 1;
    return diff > 0 ? diff : 1;
  }, [form.fromDate, form.toDate]);

  const selectedFacility = useMemo(
    () => facilities.find((f) =>
      (isAr ? f.nameAr : f.nameEn).toLowerCase() === form.facilityName.toLowerCase() ||
      f.nameEn.toLowerCase() === form.facilityName.toLowerCase()
    ),
    [facilities, form.facilityName, isAr]
  );

  const selectedDoctor = useMemo(
    () => doctors.find((d) =>
      (isAr ? d.nameAr : d.nameEn).toLowerCase() === form.doctorName.toLowerCase() ||
      d.nameEn.toLowerCase() === form.doctorName.toLowerCase()
    ),
    [doctors, form.doctorName, isAr]
  );

  const isGpViolation = form.doctorRank === 'GP' && totalDays > 1;
  const isSpecialistWarning = ['SPECIALIST', 'RESIDENT'].includes(form.doctorRank) && totalDays > 2 && !form.wasHospitalized && !form.isChronicDisease;
  const isBlockedFacility = selectedFacility?.isBlocked ?? false;
  const isPrivate24h = form.facilityType === 'PRIVATE_24H';
  const hasPrescription = files.some((f) => f.classification === 'PRESCRIPTION');
  const overallConfidence = Math.round(files.reduce((s, f) => s + f.confidence, 0) / (files.length || 1));

  const doctorOptions = doctors.map((d) => ({
    value: isAr ? d.nameAr : d.nameEn,
    label: isAr ? d.nameAr : d.nameEn,
  }));

  const facilityOptions = facilities.map((f) => ({
    value: isAr ? f.nameAr : f.nameEn,
    label: isAr ? f.nameAr : f.nameEn,
  }));

  // ── File handling ──────────────────────────────────────────────────────
  const handleUpload = async (info: { file: UploadFile }) => {
    const file = info.file;
    if (file.size && file.size > 10 * 1024 * 1024) {
      message.error('File too large. Maximum 10MB allowed.');
      return false;
    }
    const isPdf = file.name?.toLowerCase().endsWith('.pdf');
    const fileId = `f-${Date.now()}`;
    const newFile: UploadedFile = {
      id: fileId,
      name: file.name ?? 'document',
      size: file.size ?? 0,
      type: isPdf ? 'pdf' : 'image',
      classification: 'OTHER',
      confidence: 0,
      uploading: true,
      rawFile: file.originFileObj || (file as unknown as File),
    };
    setFiles((prev) => [...prev, newFile]);
    try {
      const rawFile = file.originFileObj || (file as unknown as File);
      const result = await uploadToCloudinary(rawFile);
      setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, fileUrl: result.url, uploading: false, confidence: 95, uploadError: undefined } : f));
      message.success(`${file.name} uploaded successfully!`);

      // ── OCR Auto-fill ──
      if (!isPdf && result.url && !ocrDone) {
        setOcrLoading(true);
        try {
          const ocrRes = await ocrAPI.extract(result.url);
          const fields = ocrRes.data?.data?.fields ?? ocrRes.data?.fields;
          if (fields) {
            setForm((prev) => ({
              ...prev,
              ...(fields.doctorName ? { doctorName: fields.doctorName } : {}),
              ...(fields.facilityName ? { facilityName: fields.facilityName } : {}),
              ...(fields.diagnosis ? { diagnosis: fields.diagnosis } : {}),
              ...(fields.icdCode ? { icd10Code: fields.icdCode } : {}),
              ...(fields.startDate ? { fromDate: dayjs(fields.startDate) } : {}),
              ...(fields.endDate ? { toDate: dayjs(fields.endDate) } : {}),
              ...(fields.isHospitalized !== undefined ? { wasHospitalized: fields.isHospitalized } : {}),
            }));
            setOcrDone(true);
            const count = Object.values(fields).filter(Boolean).length;
            message.success(t('submitLeave.ocrSuccess') || `OCR extracted ${count} fields automatically!`);
          }
        } catch (ocrErr) {
          console.warn('[OCR] Auto-fill failed:', ocrErr);
        } finally {
          setOcrLoading(false);
        }
      }
    } catch (error) {
      setFiles((prev) => prev.map((f) => f.id === fileId ? { ...f, uploading: false, confidence: 0, uploadError: 'Upload failed' } : f));
      message.error(`Failed to upload ${file.name}`);
    }
    return false;
  };

  const removeFile = (id: string) => setFiles((prev) => prev.filter((f) => f.id !== id));

  const updateClassification = (id: string, classification: string) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, classification } : f)));
  };

  // ── Submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      // Build real payload from form
      const payload = {
        fromDate: form.fromDate.toISOString(),
        toDate: form.toDate.toISOString(),
        employeeComment: comment || null,
        symptoms: form.symptoms || null,
        diagnosis: form.diagnosis || null,
        icdCode: form.icd10Code || null,
        isHospitalized: form.wasHospitalized,
        isChronicDisease: form.isChronicDisease,
        doctorId: selectedDoctor?.id || null,
        facilityId: selectedFacility?.id || null,
      };

      const response = await leavesAPI.submit(payload);
      const leaveData = response.data?.data ?? response.data;
      const leaveId = leaveData?.id;
      const ref = leaveData?.referenceNumber ?? leaveData?.refNumber ?? 'SL-' + Date.now();

      // Save uploaded documents to the leave
      if (leaveId) {
        for (const f of files) {
          if (f.fileUrl) {
            try {
              await documentsAPI.upload({
                leaveId,
                fileName: f.name,
                fileSize: f.size,
                fileType: f.type === 'pdf' ? 'application/pdf' : 'image/jpeg',
                fileUrl: f.fileUrl,
                documentType: f.classification || 'OTHER',
              });
            } catch (docErr) {
              console.warn('Failed to save document:', docErr);
            }
          }
        }

        // Auto-trigger AI analysis
        try {
          await aiAPI.analyze(leaveId);
        } catch (aiErr) {
          console.warn('[AI] Auto-analysis failed:', aiErr);
        }
      }

      setRefNumber(ref);
      setSuccessModal(true);
    } catch (err: unknown) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Submission failed';
      message.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const setField = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  // ── Step 1 ─────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="slide-in">
      <Card
        title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('submitLeave.uploadTitle')}</span>}
        style={{ borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
      >
        <Upload.Dragger
          multiple
          accept=".jpg,.jpeg,.png,.pdf"
          beforeUpload={() => false}
          onChange={handleUpload}
          showUploadList={false}
          style={{
            borderColor: '#D4AF37',
            borderRadius: 12,
            background: '#fffdf0',
            marginBottom: 20,
          }}
        >
          <div style={{ padding: '20px 0' }}>
            <CloudUploadOutlined style={{ fontSize: 48, color: '#D4AF37', marginBottom: 12 }} />
            <p style={{ fontSize: 16, fontWeight: 600, color: '#001529', margin: '0 0 6px' }}>
              {t('submitLeave.dragDrop')}
            </p>
            <p style={{ color: '#8c8c8c', margin: '0 0 8px' }}>{t('submitLeave.clickBrowse')}</p>
            <p style={{ color: '#bfbfbf', fontSize: 12 }}>{t('submitLeave.uploadDragHint')}</p>
          </div>
        </Upload.Dragger>

        {/* Uploaded files list */}
        {files.length > 0 && (
          <div>
            <Text strong style={{ color: '#001529', display: 'block', marginBottom: 12 }}>
              {t('submitLeave.documentsDetected')} ({files.length})
            </Text>
            {files.map((file) => (
              <div
                key={file.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  marginBottom: 8,
                  background: '#fafafa',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ fontSize: 28, color: file.type === 'pdf' ? '#ff4d4f' : '#1890ff' }}>
                  {file.type === 'pdf' ? <FilePdfOutlined /> : <FileImageOutlined />}
                </div>
                <div style={{ flex: 1, minWidth: 120 }}>
                  <Text strong style={{ fontSize: 13, display: 'block' }}>{file.name}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{formatSize(file.size)}</Text>
                </div>
                <Select
                  value={file.classification}
                  onChange={(val) => updateClassification(file.id, val)}
                  size="small"
                  style={{ width: 180 }}
                >
                  {CLASSIFICATION_OPTIONS.map((opt) => (
                    <Select.Option key={opt.value} value={opt.value}>
                      {isAr ? opt.labelAr : opt.labelEn}
                    </Select.Option>
                  ))}
                </Select>
                <Button
                  type="text"
                  icon={<DeleteOutlined />}
                  danger
                  size="small"
                  onClick={() => removeFile(file.id)}
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Comment section */}
      <Card
        title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('submitLeave.commentsLabel')}</span>}
        style={{ borderRadius: 12, marginBottom: 20, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
      >
        <TextArea
          rows={5}
          maxLength={2000}
          showCount
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t('submitLeave.commentsPlaceholder')}
          style={{ borderRadius: 8 }}
          dir={isAr ? 'rtl' : 'ltr'}
        />
        <Text type="secondary" style={{ fontSize: 12, marginTop: 6, display: 'block' }}>
          💡 {t('submitLeave.commentHelper')}
        </Text>
      </Card>

      <Alert
        type="info"
        showIcon
        message={t('submitLeave.aiSystemAlert')}
        style={{ borderRadius: 10, marginBottom: 20 }}
      />
    </div>
  );

  // ── Step 2 ─────────────────────────────────────────────────────────────
  const renderStep2 = () => (
    <div className="slide-in">
      <Alert
        type={ocrDone ? "success" : ocrLoading ? "info" : "warning"}
        showIcon
        message={ocrLoading
          ? (t('submitLeave.ocrProcessing') || '🔄 AI is reading your document and auto-filling fields...')
          : ocrDone
            ? (t('submitLeave.ocrComplete') || '✅ AI auto-filled fields from your document. Please verify.')
            : t('submitLeave.aiAnalyzedDocuments')
        }
        style={{ borderRadius: 10, marginBottom: 20 }}
      />

      <Row gutter={[20, 20]}>
        {/* LEFT COLUMN — Editable form */}
        <Col xs={24} lg={14}>
          {/* Doctor Info */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('submitLeave.doctorInfo')}</span>}
            style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>{t('submitLeave.doctorName')}</label>
              <AutoComplete
                value={form.doctorName}
                options={doctorOptions}
                onChange={(val) => setField('doctorName', val)}
                style={{ width: '100%' }}
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                <Input style={{ borderRadius: 8 }} />
              </AutoComplete>
              {selectedDoctor && (
                <Tag color="green" style={{ marginTop: 6 }}>
                  ✓ {t('submitLeave.knownDoctor')} ★{selectedDoctor.trustScore?.toFixed(2) ?? 'N/A'}
                </Tag>
              )}
              {form.doctorName && !selectedDoctor && (
                <Tag color="blue" style={{ marginTop: 6 }}>{t('submitLeave.newDoctor')}</Tag>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>
                {t('submitLeave.doctorRank')} <span style={{ color: '#ff4d4f' }}>*</span>
              </label>
              <Select
                value={form.doctorRank}
                onChange={(val: DoctorRank) => setField('doctorRank', val)}
                style={{ width: '100%', borderRadius: 8 }}
              >
                <Select.Option value="GP">GP / General Practitioner</Select.Option>
                <Select.Option value="RESIDENT">Resident</Select.Option>
                <Select.Option value="SPECIALIST">Specialist</Select.Option>
                <Select.Option value="CONSULTANT">Consultant</Select.Option>
              </Select>
              {isGpViolation && (
                <Alert
                  type="error"
                  showIcon
                  message={t('submitLeave.gpViolationFull', { days: totalDays })}
                  style={{ borderRadius: 8, marginTop: 8 }}
                />
              )}
              {isSpecialistWarning && (
                <Alert
                  type="warning"
                  showIcon
                  message={t('submitLeave.specialistWarningFull')}
                  style={{ borderRadius: 8, marginTop: 8 }}
                />
              )}
            </div>

            <div>
              <label style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>{t('submitLeave.doctorSpecialty')}</label>
              <Select
                value={form.doctorSpecialty}
                onChange={(val) => setField('doctorSpecialty', val)}
                style={{ width: '100%' }}
                showSearch
              >
                {SPECIALTIES.map((s) => (
                  <Select.Option key={s.value} value={s.value}>{s.label}</Select.Option>
                ))}
              </Select>
            </div>
          </Card>

          {/* Facility Info */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('submitLeave.facilityInfo')}</span>}
            style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>{t('submitLeave.facilityName')}</label>
              <AutoComplete
                value={form.facilityName}
                options={facilityOptions}
                onChange={(val) => {
                  setField('facilityName', val);
                  const found = facilities.find(
                    (f) => f.nameEn.toLowerCase() === val.toLowerCase() || f.nameAr === val
                  );
                  if (found) setField('facilityType', found.type as FacilityType);
                }}
                style={{ width: '100%' }}
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
              >
                <Input style={{ borderRadius: 8 }} />
              </AutoComplete>
              {selectedFacility && !isBlockedFacility && (
                <Tag color="green" style={{ marginTop: 6 }}>
                  {t('submitLeave.knownFacilityTrusted', {
                    score: selectedFacility.trustScore?.toFixed(2) ?? 'N/A',
                  })}
                </Tag>
              )}
              {isBlockedFacility && (
                <Alert
                  type="error"
                  showIcon
                  message={t('submitLeave.blockedFacilityBanner')}
                  style={{ borderRadius: 8, marginTop: 8, fontWeight: 600 }}
                />
              )}
            </div>

            <div>
              <label style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>{t('submitLeave.facilityType')}</label>
              <Select
                value={form.facilityType}
                onChange={(val: FacilityType) => setField('facilityType', val)}
                style={{ width: '100%' }}
              >
                {FACILITY_TYPES.map((ft) => (
                  <Select.Option key={ft.value} value={ft.value}>
                    {isAr ? ft.labelAr : ft.labelEn}
                  </Select.Option>
                ))}
              </Select>
              {isPrivate24h && (
                <Alert
                  type="error"
                  showIcon
                  message={t('submitLeave.private24hAlert')}
                  style={{ borderRadius: 8, marginTop: 8, fontWeight: 600 }}
                />
              )}
            </div>
          </Card>

          {/* Leave Period */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('submitLeave.leavePeriod')}</span>}
            style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Row gutter={16} style={{ marginBottom: 14 }}>
              <Col xs={24} sm={12}>
                <label style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>{t('submitLeave.fromDate')}</label>
                <DatePicker
                  value={form.fromDate}
                  onChange={(d) => d && setField('fromDate', d)}
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </Col>
              <Col xs={24} sm={12}>
                <label style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>{t('submitLeave.toDate')}</label>
                <DatePicker
                  value={form.toDate}
                  onChange={(d) => d && setField('toDate', d)}
                  style={{ width: '100%', borderRadius: 8 }}
                />
              </Col>
            </Row>

            <div
              style={{
                background: '#e6f7ff',
                border: '1px solid #91d5ff',
                borderRadius: 8,
                padding: '10px 16px',
                marginBottom: 14,
                textAlign: 'center',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: 700, color: '#1890ff' }}>
                {t('submitLeave.totalDaysCalc', { days: totalDays })}
              </Text>
            </div>

            {isGpViolation && (
              <Alert
                type="error"
                showIcon
                message={t('submitLeave.ruleViolationGP', { days: totalDays })}
                style={{ borderRadius: 8, marginBottom: 10 }}
              />
            )}
            {isSpecialistWarning && (
              <Alert
                type="warning"
                showIcon
                message={t('submitLeave.ruleWarningSpecialist')}
                style={{ borderRadius: 8, marginBottom: 10 }}
              />
            )}

            {(['SPECIALIST', 'CONSULTANT'].includes(form.doctorRank) && totalDays > 2) && (
              <div style={{ marginTop: 8 }}>
                <Checkbox
                  checked={form.wasHospitalized}
                  onChange={(e) => setField('wasHospitalized', e.target.checked)}
                  style={{ marginBottom: 8, display: 'block' }}
                >
                  {t('submitLeave.hospRequired')}
                </Checkbox>
                <Checkbox
                  checked={form.isChronicDisease}
                  onChange={(e) => setField('isChronicDisease', e.target.checked)}
                >
                  {t('submitLeave.chronicRequired')}
                </Checkbox>
              </div>
            )}
          </Card>

          {/* Diagnosis */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('submitLeave.diagnosisInfo')}</span>}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>{t('submitLeave.symptoms')}</label>
              <Input
                value={form.symptoms}
                onChange={(e) => setField('symptoms', e.target.value)}
                style={{ borderRadius: 8 }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>{t('submitLeave.primaryDiagnosis')}</label>
              <Input
                value={form.diagnosis}
                onChange={(e) => setField('diagnosis', e.target.value)}
                style={{ borderRadius: 8 }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>
                {t('submitLeave.icd10Code')}
                <Text type="secondary" style={{ fontSize: 11, marginInlineStart: 8 }}>
                  (International Classification of Diseases)
                </Text>
              </label>
              <Input
                value={form.icd10Code}
                onChange={(e) => setField('icd10Code', e.target.value)}
                style={{ borderRadius: 8, maxWidth: 200 }}
                placeholder="K29.1"
              />
            </div>
          </Card>
        </Col>

        {/* RIGHT COLUMN — Documents summary */}
        <Col xs={24} lg={10}>
          {/* Uploaded docs */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('submitLeave.documents')}</span>}
            style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            extra={
              <Button size="small" icon={<PlusOutlined />}>
                {t('submitLeave.addMoreDocuments')}
              </Button>
            }
          >
            {files.map((file) => {
              const cls = CLASSIFICATION_OPTIONS.find((c) => c.value === file.classification);
              return (
                <div
                  key={file.id}
                  style={{
                    padding: '10px 0',
                    borderBottom: '1px solid #f5f5f5',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 22, color: file.type === 'pdf' ? '#ff4d4f' : '#1890ff' }}>
                    {file.type === 'pdf' ? <FilePdfOutlined /> : <FileImageOutlined />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, display: 'block', fontWeight: 500 }} ellipsis>
                      {file.name}
                    </Text>
                    <Tag color="blue" style={{ fontSize: 10, marginTop: 2 }}>
                      {isAr ? cls?.labelAr : cls?.labelEn}
                    </Tag>
                  </div>
                  <div style={{ textAlign: isAr ? 'left' : 'right', minWidth: 60 }}>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: file.confidence >= 80 ? '#52c41a' : file.confidence >= 60 ? '#faad14' : '#ff4d4f',
                      }}
                    >
                      {file.confidence}%
                    </Text>
                    <Progress
                      percent={file.confidence}
                      size="small"
                      showInfo={false}
                      strokeColor={file.confidence >= 80 ? '#52c41a' : file.confidence >= 60 ? '#faad14' : '#ff4d4f'}
                    />
                  </div>
                </div>
              );
            })}
          </Card>

          {/* Checklist */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('submitLeave.docChecklist')}</span>}
            style={{ borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            {[
              {
                label: t('submitLeave.sickLeaveCertificate'),
                detected: files.some((f) => f.classification === 'SICK_LEAVE_CERTIFICATE'),
                required: true,
              },
              {
                label: t('submitLeave.financialReceipt'),
                detected: files.some((f) => f.classification === 'FINANCIAL_RECEIPT'),
                required: true,
              },
              {
                label: t('submitLeave.prescription'),
                detected: files.some((f) => f.classification === 'PRESCRIPTION'),
                required: false,
              },
              {
                label: t('submitLeave.facilityStampDetected'),
                detected: true,
                required: true,
              },
              {
                label: t('submitLeave.doctorStampDetected'),
                detected: true,
                required: true,
              },
              ...(form.facilityType === 'ROYAL_MEDICAL_SERVICES' ? [{
                label: t('submitLeave.medRecordRequired'),
                detected: false,
                required: true,
              }] : []),
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 0',
                  borderBottom: '1px solid #f5f5f5',
                }}
              >
                {item.detected ? (
                  <CheckCircleFilled style={{ color: '#52c41a', fontSize: 16 }} />
                ) : item.required ? (
                  <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 16 }} />
                ) : (
                  <ExclamationCircleFilled style={{ color: '#faad14', fontSize: 16 }} />
                )}
                <Text style={{ fontSize: 13 }}>{item.label}</Text>
              </div>
            ))}
          </Card>

          {/* Confidence */}
          <Card
            title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('submitLeave.overallConfidence')}</span>}
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <Progress
                type="circle"
                percent={overallConfidence}
                strokeColor={overallConfidence >= 80 ? '#52c41a' : overallConfidence >= 60 ? '#faad14' : '#ff4d4f'}
                size={100}
              />
              <Text
                style={{
                  display: 'block',
                  marginTop: 12,
                  fontWeight: 500,
                  color: overallConfidence >= 80 ? '#52c41a' : '#faad14',
                }}
              >
                {overallConfidence >= 80
                  ? t('submitLeave.highConfidenceMsg')
                  : t('submitLeave.mediumConfidenceMsg')}
              </Text>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );

  // ── Step 3 ─────────────────────────────────────────────────────────────
  const renderStep3 = () => {
    const facilityTypeLabel = FACILITY_TYPES.find((ft) => ft.value === form.facilityType);

    return (
      <div className="slide-in">
        <Title level={4} style={{ color: '#001529', marginBottom: 20 }}>
          {t('submitLeave.confirmHeading')}
        </Title>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            {/* Your information */}
            <Card
              title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('submitLeave.yourInformation')}</span>}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}
            >
              {[
                { label: isAr ? 'الاسم' : 'Name', value: isAr ? user?.nameAr : user?.nameEn },
                { label: isAr ? 'الرقم الوظيفي' : 'Employee #', value: user?.employeeNumber },
                { label: isAr ? 'الدائرة' : 'Department', value: isAr ? user?.department?.nameAr : user?.department?.nameEn },
                { label: isAr ? 'المسمى الوظيفي' : 'Job Title', value: user?.jobTitle },
              ].map((row, i) => (
                <Row key={i} style={{ padding: '6px 0', borderBottom: i < 3 ? '1px solid #f5f5f5' : 'none' }}>
                  <Col span={10}><Text type="secondary" style={{ fontSize: 13 }}>{row.label}</Text></Col>
                  <Col span={14}><Text style={{ fontSize: 13, fontWeight: 500 }}>{row.value}</Text></Col>
                </Row>
              ))}
            </Card>

            {/* Medical info */}
            <Card
              title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('submitLeave.medicalInformation')}</span>}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}
            >
              {[
                { label: t('submitLeave.symptoms'), value: form.symptoms },
                { label: t('submitLeave.primaryDiagnosis'), value: form.diagnosis },
                { label: t('submitLeave.icd10Code'), value: form.icd10Code || '—' },
                { label: t('submitLeave.wasHospitalized'), value: form.wasHospitalized ? t('common.yes') : t('common.no') },
                { label: t('submitLeave.chronicDisease'), value: form.isChronicDisease ? t('common.yes') : t('common.no') },
              ].map((row, i) => (
                <Row key={i} style={{ padding: '6px 0', borderBottom: i < 4 ? '1px solid #f5f5f5' : 'none' }}>
                  <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>{row.label}</Text></Col>
                  <Col span={14}><Text style={{ fontSize: 12, fontWeight: 500 }}>{row.value}</Text></Col>
                </Row>
              ))}
            </Card>
          </Col>

          <Col xs={24} md={12}>
            {/* Leave details */}
            <Card
              title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('submitLeave.leaveDetails')}</span>}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}
            >
              {[
                { label: t('submitLeave.fromDate'), value: form.fromDate.format('DD MMM YYYY') },
                { label: t('submitLeave.toDate'), value: form.toDate.format('DD MMM YYYY') },
                { label: t('common.total'), value: <Tag color="blue">{totalDays} {t('common.days')}</Tag> },
                { label: t('submitLeave.doctorName'), value: `${form.doctorName} (${form.doctorRank})` },
                { label: t('submitLeave.facilityName'), value: form.facilityName },
                { label: t('submitLeave.facilityType'), value: isAr ? facilityTypeLabel?.labelAr : facilityTypeLabel?.labelEn },
              ].map((row, i) => (
                <Row key={i} style={{ padding: '6px 0', borderBottom: i < 5 ? '1px solid #f5f5f5' : 'none' }}>
                  <Col span={10}><Text type="secondary" style={{ fontSize: 12 }}>{row.label}</Text></Col>
                  <Col span={14}><Text style={{ fontSize: 12, fontWeight: 500 }}>{row.value}</Text></Col>
                </Row>
              ))}
            </Card>

            {/* Comment */}
            <Card
              title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('submitLeave.yourComments')}</span>}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}
            >
              <div
                style={{
                  background: comment ? '#e6f7ff' : '#fafafa',
                  borderRadius: 8,
                  padding: '10px 14px',
                }}
              >
                <Text style={{ fontSize: 13, color: comment ? '#001529' : '#8c8c8c' }}>
                  {comment || t('submitLeave.noComment')}
                </Text>
              </div>
            </Card>
          </Col>

          {/* Documents */}
          <Col xs={24}>
            <Card
              title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('submitLeave.documents')}</span>}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}
            >
              <Row gutter={[12, 12]}>
                {files.map((file) => {
                  const cls = CLASSIFICATION_OPTIONS.find((c) => c.value === file.classification);
                  return (
                    <Col key={file.id} xs={24} sm={8}>
                      <div
                        style={{
                          border: '1px solid #f0f0f0',
                          borderRadius: 8,
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <div style={{ fontSize: 24, color: file.type === 'pdf' ? '#ff4d4f' : '#1890ff' }}>
                          {file.type === 'pdf' ? <FilePdfOutlined /> : <FileImageOutlined />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <Text ellipsis style={{ fontSize: 12, display: 'block' }}>{file.name}</Text>
                          <Tag color="processing" style={{ fontSize: 10, marginTop: 2 }}>
                            {isAr ? cls?.labelAr : cls?.labelEn}
                          </Tag>
                          <Text style={{ fontSize: 11, color: '#52c41a', display: 'block' }}>
                            {file.confidence}% {t('submitLeave.extractionConfidence')}
                          </Text>
                        </div>
                      </div>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </Col>

          {/* Rule compliance */}
          <Col xs={24}>
            <Card
              title={<span style={{ fontWeight: 700, color: '#001529' }}>{t('submitLeave.ruleCompliancePreview')}</span>}
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 16 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {isGpViolation && (
                  <Alert type="error" showIcon message={t('submitLeave.ruleViolationConfirm')} style={{ borderRadius: 8 }} />
                )}
                {isSpecialistWarning && (
                  <Alert type="warning" showIcon message={t('submitLeave.specialistWarningConfirm')} style={{ borderRadius: 8 }} />
                )}
                {(isBlockedFacility || isPrivate24h) && (
                  <Alert type="error" showIcon message={t('submitLeave.blockedFacilityConfirm')} style={{ borderRadius: 8 }} />
                )}
                {!hasPrescription && (
                  <Alert type="warning" showIcon message={t('submitLeave.missingPrescriptionConfirm')} style={{ borderRadius: 8 }} />
                )}
                {!isGpViolation && !isSpecialistWarning && (
                  <Alert type="success" showIcon message={t('submitLeave.ruleCompliant')} style={{ borderRadius: 8 }} />
                )}
                {hasPrescription && (
                  <Alert type="success" showIcon message={t('submitLeave.allDocsGood')} style={{ borderRadius: 8 }} />
                )}
              </div>
            </Card>
          </Col>

          {/* Confirmation */}
          <Col xs={24}>
            <Card style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', background: '#fffdf0', border: '1px solid #D4AF37' }}>
              <Checkbox
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                style={{ fontSize: 13 }}
              >
                {t('submitLeave.confirmationText')}
              </Checkbox>
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // ── Steps config ───────────────────────────────────────────────────────
  const steps = [
    {
      title: t('submitLeave.step1'),
      icon: <CloudUploadOutlined />,
      content: renderStep1,
    },
    {
      title: t('submitLeave.step2'),
      icon: <EditOutlined />,
      content: renderStep2,
    },
    {
      title: t('submitLeave.step3'),
      icon: <CheckCircleOutlined />,
      content: renderStep3,
    },
  ];

  const canGoNext = currentStep === 0 ? files.length > 0 : true;
  const canSubmit = confirmed && !submitting;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Page header */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <FileAddOutlined style={{ fontSize: 28, color: '#D4AF37' }} />
        <Title level={3} style={{ margin: 0, color: '#001529' }}>
          {t('submitLeave.title')}
        </Title>
      </div>

      {/* Steps indicator */}
      <Card style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Steps
          current={currentStep}
          items={steps.map((s) => ({ title: s.title, icon: s.icon }))}
          style={{ padding: '8px 0' }}
        />
      </Card>

      {/* Step content */}
      {steps[currentStep].content()}

      {/* Navigation buttons */}
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 32 }}>
        <Button
          size="large"
          icon={isAr ? <ArrowRightOutlined /> : <ArrowLeftOutlined />}
          onClick={() => setCurrentStep((s) => s - 1)}
          disabled={currentStep === 0}
          style={{ borderRadius: 8, minWidth: 120 }}
        >
          {t('common.back')}
        </Button>

        {currentStep < steps.length - 1 ? (
          <Button
            type="primary"
            size="large"
            className="btn-gold"
            icon={isAr ? <ArrowLeftOutlined /> : <ArrowRightOutlined />}
            onClick={() => setCurrentStep((s) => s + 1)}
            disabled={!canGoNext}
            style={{ borderRadius: 8, minWidth: 140 }}
          >
            {t('common.next')}
          </Button>
        ) : (
          <Button
            type="primary"
            size="large"
            className="btn-gold"
            icon={<CheckCircleOutlined />}
            onClick={handleSubmit}
            loading={submitting}
            disabled={!canSubmit}
            style={{ borderRadius: 8, minWidth: 200, fontWeight: 700 }}
          >
            {t('submitLeave.submitButton')}
          </Button>
        )}
      </div>

      {/* Success Modal */}
      <Modal
        open={successModal}
        footer={null}
        closable={false}
        centered
        width={480}
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <CheckCircleFilled style={{ fontSize: 64, color: '#52c41a', marginBottom: 16 }} />
          <Title level={3} style={{ color: '#001529', marginBottom: 8 }}>
            {t('submitLeave.successTitle')}
          </Title>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>{t('submitLeave.successRefLabel')}</Text>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#D4AF37',
                letterSpacing: 1,
                marginTop: 4,
              }}
            >
              {refNumber}
            </div>
          </div>
          <Text type="secondary" style={{ display: 'block', marginBottom: 6 }}>
            {t('submitLeave.successAnalyzing')}
          </Text>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 12 }}>
            {t('submitLeave.successTracking')}
          </Text>
          <Row gutter={12}>
            <Col span={12}>
              <Button
                block
                size="large"
                onClick={() => navigate('/employee/my-leaves')}
                style={{ borderRadius: 8 }}
              >
                {t('submitLeave.successViewMyLeaves')}
              </Button>
            </Col>
            <Col span={12}>
              <Button
                block
                type="primary"
                size="large"
                className="btn-gold"
                onClick={() => navigate('/employee/dashboard')}
                style={{ borderRadius: 8 }}
              >
                {t('submitLeave.backToDashboard')}
              </Button>
            </Col>
          </Row>
        </div>
      </Modal>
    </div>
  );
};

export default SubmitLeave;
