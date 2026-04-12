import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Tag, Button, Typography, Alert, Progress, Timeline,
  Collapse, Upload, Checkbox, Modal, Spin, Image, message,
} from 'antd';
import {
  ArrowLeftOutlined, ArrowRightOutlined, CheckCircleFilled, CloseCircleFilled,
  ExclamationCircleFilled, CheckCircleOutlined, ExclamationCircleOutlined,
  MedicineBoxOutlined, LoadingOutlined, FilePdfOutlined, FileImageOutlined,
  CloudUploadOutlined, WarningFilled, StarFilled, PlusOutlined, EyeOutlined,
  DownloadOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { useLeaveStore } from '../../store/leaveStore';
import { documentsAPI, uploadToCloudinary } from '../../services/api';
import type { LeaveStatus, Violation, UploadedDocument } from '../../types';
import { mockViolations } from '../../services/mockData';

const { Text, Title } = Typography;
const fmtDate = (d: Date | string) => dayjs(d).format('DD MMM YYYY');
const fmtDateTime = (d: Date | string) => dayjs(d).format('DD MMM YYYY, h:mm A');

const renderStars = (score: number | null | undefined) => {
  if (score === null || score === undefined) return <Text type="secondary">N/A</Text>;
  const full = Math.round(score * 5);
  return (
    <span>
      {[1,2,3,4,5].map((i) => (
        <StarFilled key={i} style={{ color: i <= full ? '#faad14' : '#d9d9d9', fontSize: 12 }} />
      ))}
      <Text type="secondary" style={{ fontSize: 11, marginInlineStart: 4 }}>({(score*100).toFixed(0)}%)</Text>
    </span>
  );
};

const mapStatus = (status: string): LeaveStatus => {
  const m: Record<string, LeaveStatus> = {
    PENDING:'SUBMITTED', SUBMITTED:'SUBMITTED', PROCESSING:'PROCESSING',
    UNDER_REVIEW:'UNDER_REVIEW', DOCS_REQUESTED:'DOCS_REQUESTED',
    EXAMINATION_REQUESTED:'EXAMINATION_REQUESTED', APPROVED:'APPROVED',
    PARTIALLY_APPROVED:'PARTIALLY_APPROVED', REJECTED:'REJECTED',
    PENDING_COMMITTEE:'PENDING_COMMITTEE',
  };
  return m[status] || (status as LeaveStatus);
};

const mapLeaveData = (raw: Record<string, unknown>) => {
  const decision = raw.decision as Record<string, unknown> | null;
  return {
    ...raw,
    refNumber: raw.referenceNumber || raw.refNumber || '',
    status: mapStatus((raw.status as string) || 'SUBMITTED'),
    employeeComments: raw.employeeComment || raw.employeeComments || '',
    icd10Code: raw.icdCode || raw.icd10Code || '',
    wasHospitalized: raw.isHospitalized ?? raw.wasHospitalized ?? false,
    isChronicDisease: raw.isChronicDisease ?? false,
    companyDoctorAssessment: decision?.medicalAssessment || raw.companyDoctorAssessment || '',
    companyDoctorInstructions: decision?.instructionsToEmployee || raw.companyDoctorInstructions || '',
    rejectionReason: (() => {
      if (decision?.rejectionReasons) {
        const r = decision.rejectionReasons as string[];
        return Array.isArray(r) ? r.join('; ') : String(r);
      }
      return raw.rejectionReason || '';
    })(),
    documents: raw.documents || [],
    timeline: raw.timeline || [
      { id:'1', timestamp: raw.submittedAt||raw.createdAt||new Date(), type:'SUBMITTED', description:'Leave request submitted', color:'blue' },
      ...(raw.reviewedAt ? [{ id:'2', timestamp:raw.reviewedAt, type:'REVIEWED', description:'Under review by company doctor', color:'orange' }] : []),
      ...(raw.decidedAt ? [{ id:'3', timestamp:raw.decidedAt, type:'DECIDED', description:'Decision: '+mapStatus((raw.status as string)||''), color: raw.status==='APPROVED'?'green':raw.status==='REJECTED'?'red':'gold' }] : []),
    ],
  };
};

const mapDocument = (doc: Record<string, unknown>): UploadedDocument => ({
  id: (doc.id as string)||'', fileName: (doc.fileName as string)||'Document',
  fileSize: (doc.fileSize as number)||0, fileType: (doc.fileType as string)||'image/jpeg',
  url: (doc.fileUrl as string)||(doc.url as string)||'',
  classification: ((doc.documentType as string)||(doc.classification as string)||'OTHER') as UploadedDocument['classification'],
  confidence: (doc.confidence as number)||0.9, uploadedAt: (doc.uploadedAt as Date)||(doc.createdAt as Date)||new Date(),
});

const STATUS_META: Record<string, {bg:string;text:string;border:string}> = {
  SUBMITTED:{bg:'#1890ff',text:'#fff',border:'#1890ff'}, PROCESSING:{bg:'#13c2c2',text:'#fff',border:'#13c2c2'},
  UNDER_REVIEW:{bg:'#fa8c16',text:'#fff',border:'#fa8c16'}, DOCS_REQUESTED:{bg:'#722ed1',text:'#fff',border:'#722ed1'},
  EXAMINATION_REQUESTED:{bg:'#eb2f96',text:'#fff',border:'#eb2f96'}, APPROVED:{bg:'#52c41a',text:'#fff',border:'#52c41a'},
  PARTIALLY_APPROVED:{bg:'#fa8c16',text:'#fff',border:'#fa8c16'}, REJECTED:{bg:'#ff4d4f',text:'#fff',border:'#ff4d4f'},
  PENDING_COMMITTEE:{bg:'#fa541c',text:'#fff',border:'#fa541c'},
};
const DOC_TYPE_COLOR: Record<string,string> = { SICK_LEAVE_CERTIFICATE:'blue', FINANCIAL_RECEIPT:'green', PRESCRIPTION:'purple', LAB_RESULTS:'orange', XRAY:'cyan', HOSPITAL_REPORT:'geekblue', OTHER:'default' };
const DOC_TYPE_LABEL: Record<string,string> = { SICK_LEAVE_CERTIFICATE:'Sick Leave Certificate', FINANCIAL_RECEIPT:'Financial Receipt', PRESCRIPTION:'Prescription', LAB_RESULTS:'Lab Results', XRAY:'X-ray', HOSPITAL_REPORT:'Hospital Report', OTHER:'Other' };
const RANK_LABEL: Record<string,string> = { GP:'GP', GENERAL_PRACTITIONER:'GP', RESIDENT:'Resident', SPECIALIST:'Specialist', CONSULTANT:'Consultant' };
const FACILITY_TYPE_LABEL: Record<string,string> = { GOVERNMENT_HOSPITAL:'Government Hospital', PRIVATE_HOSPITAL:'Private Hospital', UNIVERSITY_HOSPITAL:'University Hospital', ROYAL_MEDICAL_SERVICES:'Royal Medical Services', HEALTH_CENTER:'Health Center', PRIVATE_CLINIC:'Private Clinic', PRIVATE_24H:'Private 24h Center', PRIVATE_24H_CENTER:'Private 24h Center', SPECIALIZED_CENTER:'Specialized Center', MILITARY_HOSPITAL:'Military Hospital' };
const isImageUrl = (u:string) => { if(!u) return false; const l=u.toLowerCase(); return l.includes('.jpg')||l.includes('.jpeg')||l.includes('.png')||l.includes('.gif')||l.includes('.webp')||l.includes('/image/'); };
const isPdfUrl = (u:string) => { if(!u) return false; return u.toLowerCase().includes('.pdf')||u.toLowerCase().includes('/raw/'); };

const LeaveDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [attendanceConfirmed, setAttendanceConfirmed] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [realDocuments, setRealDocuments] = useState<UploadedDocument[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { currentLeave: rawLeave, loadLeaveById, isLoading } = useLeaveStore();
  const leave = rawLeave ? mapLeaveData(rawLeave as unknown as Record<string, unknown>) as unknown as import('../../types').SickLeave : null;

  useEffect(() => { if (id) loadLeaveById(id); }, [id, loadLeaveById]);

  useEffect(() => {
    if (id) {
      setDocsLoading(true);
      documentsAPI.getByLeave(id)
        .then((res) => {
          const docs = res.data?.data ?? res.data ?? [];
          setRealDocuments((Array.isArray(docs)?docs:[]).map((d:Record<string,unknown>)=>mapDocument(d)));
        })
        .catch(() => setRealDocuments([]))
        .finally(() => setDocsLoading(false));
    }
  }, [id]);

  const allDocuments: UploadedDocument[] = [
    ...(leave?.documents ?? []).map((d:unknown) => mapDocument(d as Record<string,unknown>)),
    ...realDocuments.filter((rd) => !(leave?.documents ?? []).some((ld:{id:string}) => ld.id === rd.id)),
  ];

  const violation: Violation | undefined = leave?.violationId
    ? mockViolations.find((v) => v.id === leave.violationId) : undefined;

  const handleUploadDocument = async (file: File) => {
    if (!id) return;
    setUploading(true);
    try {
      const { url } = await uploadToCloudinary(file);
      await documentsAPI.upload({ leaveId:id, fileName:file.name, fileSize:file.size, fileType:file.type, fileUrl:url, documentType:'OTHER' });
      const res = await documentsAPI.getByLeave(id);
      const docs = res.data?.data ?? res.data ?? [];
      setRealDocuments((Array.isArray(docs)?docs:[]).map((d:Record<string,unknown>)=>mapDocument(d)));
      message.success('Document uploaded successfully!');
    } catch { message.error('Failed to upload document'); }
    finally { setUploading(false); }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await documentsAPI.delete(docId);
      setRealDocuments((prev) => prev.filter((d) => d.id !== docId));
      message.success('Document deleted');
    } catch { message.error('Failed to delete document'); }
  };

  if (isLoading) return <div style={{ textAlign:'center', padding:'80px 20px' }}><Spin size="large" /></div>;
  if (!leave) return (
    <div style={{ textAlign:'center', padding:'80px 20px' }}>
      <CloseCircleFilled style={{ fontSize:64, color:'#ff4d4f', marginBottom:16 }} />
      <Title level={3}>Leave not found</Title>
      <Button onClick={() => navigate('/employee/my-leaves')}>{t('leaveDetail.backToMyLeaves')}</Button>
    </div>
  );

  const meta = STATUS_META[leave.status] || STATUS_META.SUBMITTED;
  const examDaysLeft = leave.examinationDetails ? dayjs(leave.examinationDetails.date).diff(dayjs(),'day') : 0;

  const renderBanner = () => {
    const base: React.CSSProperties = { background:meta.bg, color:meta.text, padding:'20px 28px', borderRadius:12, marginBottom:24 };
    switch (leave.status) {
      case 'SUBMITTED':
        return (<div style={base}><div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}><CheckCircleOutlined style={{fontSize:24}} /><Text style={{color:'#fff',fontSize:17,fontWeight:700}}>{t('leaveDetail.statusSubmitted')}</Text></div><Text style={{color:'rgba(255,255,255,0.85)',fontSize:13}}>{t('leaveDetail.submittedOn')}: {fmtDateTime(leave.submittedAt)}</Text></div>);
      case 'PROCESSING':
        return (<div style={base}><div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}><LoadingOutlined style={{fontSize:24}} spin /><Text style={{color:'#fff',fontSize:17,fontWeight:700}}>{t('leaveDetail.statusProcessing')}</Text></div><Progress percent={60} showInfo={false} strokeColor="#fff" trailColor="rgba(255,255,255,0.3)" size="small" /></div>);
      case 'UNDER_REVIEW':
        return (<div style={base}><div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}><ExclamationCircleOutlined style={{fontSize:24}} /><Text style={{color:'#fff',fontSize:17,fontWeight:700}}>{t('leaveDetail.statusUnderReview')}</Text></div><Text style={{color:'rgba(255,255,255,0.85)',fontSize:13}}>Company Doctor Review</Text></div>);
      case 'DOCS_REQUESTED':
        return (<div><div style={base}><div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}><ExclamationCircleFilled style={{fontSize:24}} /><Text style={{color:'#fff',fontSize:17,fontWeight:700}}>{t('leaveDetail.statusDocsRequested')}</Text></div></div>{leave.requestedDocuments && leave.requestedDocuments.length > 0 && (<Card style={{borderRadius:10,marginBottom:16,borderColor:'#722ed1'}}><Text strong style={{display:'block',marginBottom:12,color:'#722ed1',fontSize:14}}>Requested Documents</Text>{leave.requestedDocuments.map((doc:string,i:number) => (<Alert key={i} type="warning" showIcon message={doc} style={{marginBottom:6,borderRadius:6}} />))}<Button type="primary" icon={<PlusOutlined />} style={{marginTop:12,background:'#722ed1',borderColor:'#722ed1',borderRadius:8}}>Upload Documents</Button></Card>)}</div>);
      case 'EXAMINATION_REQUESTED':
        return (<div><div style={base}><div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}><MedicineBoxOutlined style={{fontSize:24}} /><Text style={{color:'#fff',fontSize:20,fontWeight:700}}>{t('leaveDetail.statusExaminationRequested')}</Text></div></div>{leave.examinationDetails && (<Card style={{borderRadius:12,marginBottom:16,border:'2px solid #eb2f96'}}><Row gutter={[20,12]}><Col xs={24} md={14}><Title level={5} style={{color:'#eb2f96',marginBottom:16}}>Examination Appointment</Title>{[{icon:'📅',label:'Date',val:fmtDate(leave.examinationDetails.date)},{icon:'🕐',label:'Time',val:leave.examinationDetails.time},{icon:'📍',label:'Location',val:leave.examinationDetails.location}].map((row,i) => (<div key={i} style={{marginBottom:8,display:'flex',gap:8}}><span>{row.icon}</span><div><Text type="secondary" style={{fontSize:11,display:'block'}}>{row.label}</Text><Text style={{fontSize:13,fontWeight:500}}>{row.val}</Text></div></div>))}</Col><Col xs={24} md={10}>{examDaysLeft >= 0 && (<div style={{background:'#fff2f0',border:'1px solid #ffccc7',borderRadius:8,padding:'10px 14px',textAlign:'center',marginBottom:8}}><Text style={{color:'#ff4d4f',fontSize:13,fontWeight:600}}>⏱️ {examDaysLeft} days remaining</Text></div>)}<Button block type="primary" style={{background:'#52c41a',borderColor:'#52c41a',borderRadius:8,fontWeight:700}} onClick={() => setConfirmModalVisible(true)} disabled={leave.examinationDetails?.confirmed || attendanceConfirmed}>{attendanceConfirmed || leave.examinationDetails?.confirmed ? '✓ Confirmed' : 'Confirm Attendance'}</Button></Col></Row></Card>)}</div>);
      case 'APPROVED':
        return (<div style={base}><div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}><CheckCircleFilled style={{fontSize:28}} /><div><Text style={{color:'#fff',fontSize:20,fontWeight:700,display:'block'}}>{t('leaveDetail.statusApproved')}</Text><Text style={{color:'rgba(255,255,255,0.85)',fontSize:13}}>{leave.approvedDays||leave.totalDays} {t('common.days')} — {fmtDate(leave.fromDate)} → {fmtDate(leave.toDate)}</Text></div></div></div>);
      case 'PARTIALLY_APPROVED': {
        const pa = leave.partialApprovalDetails;
        return (<div><div style={base}><div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}><ExclamationCircleFilled style={{fontSize:28}} /><Text style={{color:'#fff',fontSize:20,fontWeight:700}}>Partially Approved</Text></div>{pa && (<Row gutter={16}><Col><Tag color="green" style={{fontWeight:600}}>✅ {pa.approvedDays} days approved</Tag></Col><Col><Tag color="red" style={{fontWeight:600}}>❌ {pa.rejectedDays} days rejected</Tag></Col></Row>)}</div></div>);
      }
      case 'REJECTED':
        return (<div style={base}><div style={{display:'flex',alignItems:'center',gap:12,marginBottom:4}}><CloseCircleFilled style={{fontSize:28}} /><div><Text style={{color:'#fff',fontSize:20,fontWeight:700,display:'block'}}>{t('leaveDetail.statusRejected')}</Text>{leave.rejectionReason && (<Text style={{color:'rgba(255,255,255,0.85)',fontSize:13}}>{leave.rejectionReason}</Text>)}</div></div></div>);
      default:
        return (<div style={base}><Text style={{color:'#fff',fontSize:16,fontWeight:700}}>{leave.status}</Text></div>);
    }
  };

  const timelineItems = (leave.timeline||[]).map((evt) => ({
    color: evt.color,
    children: (<div><Text style={{fontSize:13,fontWeight:500,display:'block'}}>{evt.description}</Text><Text type="secondary" style={{fontSize:11}}>{fmtDateTime(evt.timestamp)}</Text></div>),
  }));
  const showDecision = ['APPROVED','PARTIALLY_APPROVED','REJECTED'].includes(leave.status);

  return (
    <div style={{ maxWidth:1100, margin:'0 auto' }}>
      <div style={{ marginBottom:20 }}>
        <Button icon={isAr ? <ArrowRightOutlined /> : <ArrowLeftOutlined />} onClick={() => navigate('/employee/my-leaves')} style={{borderRadius:8}}>{t('leaveDetail.backToMyLeaves')}</Button>
      </div>
      {renderBanner()}
      <Row gutter={[20,20]}>
        <Col xs={24} lg={14}>
          <Card title={<span style={{fontWeight:700,color:'#001529'}}>{t('leaveDetail.leaveInformation')}</span>} style={{borderRadius:12,marginBottom:20,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{marginBottom:12}}>
              <Text type="secondary" style={{fontSize:12}}>{t('leaveDetail.referenceNumber')}</Text>
              <div style={{fontFamily:'monospace',fontSize:22,fontWeight:800,color:'#D4AF37',letterSpacing:1}}>{leave.refNumber}</div>
            </div>
            {[
              {label:t('leaveDetail.submittedOn'),val:fmtDateTime(leave.submittedAt)},
              {label:t('leaveDetail.period'),val:`${fmtDate(leave.fromDate)} → ${fmtDate(leave.toDate)}`},
              {label:t('leaveDetail.duration'),val:<Tag color="blue" style={{fontWeight:700,fontSize:14}}>{leave.totalDays} {t('common.days')}</Tag>},
              {label:t('leaveDetail.currentStatus'),val:<Tag color={meta.bg} style={{fontWeight:600,color:'#fff'}}>{leave.status.replace(/_/g,' ')}</Tag>},
            ].map((row,i) => (
              <Row key={i} style={{padding:'8px 0',borderBottom:i<3?'1px solid #f5f5f5':'none'}}>
                <Col span={10}><Text type="secondary" style={{fontSize:12}}>{row.label}</Text></Col>
                <Col span={14}><Text style={{fontSize:13,fontWeight:500}}>{row.val}</Text></Col>
              </Row>
            ))}
          </Card>
          <Card title={<span style={{fontWeight:700,color:'#001529'}}>{t('leaveDetail.medicalInformation')}</span>} style={{borderRadius:12,marginBottom:20,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{marginBottom:14,paddingBottom:14,borderBottom:'1px solid #f5f5f5'}}>
              <Text type="secondary" style={{fontSize:11,display:'block',marginBottom:4}}>Treating Doctor</Text>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <Text style={{fontWeight:600,fontSize:14}}>{isAr?leave.doctor?.nameAr:leave.doctor?.nameEn}</Text>
                <Tag color="blue">{RANK_LABEL[leave.doctor?.rank]||leave.doctor?.rank}</Tag>
                {leave.facility?.isBlocked && <Tag color="red">BLOCKED</Tag>}
              </div>
              <div style={{marginTop:4}}>{renderStars(leave.doctor?.trustScore)}</div>
            </div>
            <div>
              <Text type="secondary" style={{fontSize:11,display:'block',marginBottom:4}}>Medical Facility</Text>
              <div style={{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                <Text style={{fontWeight:600,fontSize:14}}>{isAr?leave.facility?.nameAr:leave.facility?.nameEn}</Text>
                <Tag color="default">{FACILITY_TYPE_LABEL[leave.facility?.type]||leave.facility?.type}</Tag>
              </div>
              <div style={{marginTop:4}}>{renderStars(leave.facility?.trustScore)}</div>
              {leave.facility?.isBlocked && <Alert type="error" showIcon message="This facility is BLOCKED" style={{borderRadius:8,marginTop:8,fontSize:12}} />}
            </div>
          </Card>
          <Card title={<span style={{fontWeight:700,color:'#001529'}}>{t('leaveDetail.diagnosis')}</span>} style={{borderRadius:12,marginBottom:20,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            {[
              {label:t('leaveDetail.symptoms'),val:leave.symptoms||'—'},
              {label:t('leaveDetail.diagnosis'),val:leave.diagnosis||'—'},
              {label:t('leaveDetail.icd10'),val:leave.icd10Code||'—'},
              {label:t('leaveDetail.hospitalized'),val:<Tag color={leave.wasHospitalized?'orange':'green'}>{leave.wasHospitalized?t('common.yes'):t('common.no')}</Tag>},
              {label:t('leaveDetail.chronicDisease'),val:<Tag color={leave.isChronicDisease?'orange':'green'}>{leave.isChronicDisease?t('common.yes'):t('common.no')}</Tag>},
            ].map((row,i) => (
              <Row key={i} style={{padding:'8px 0',borderBottom:i<4?'1px solid #f5f5f5':'none'}}>
                <Col span={10}><Text type="secondary" style={{fontSize:12}}>{row.label}</Text></Col>
                <Col span={14}><Text style={{fontSize:13}}>{row.val}</Text></Col>
              </Row>
            ))}
          </Card>
          {showDecision && (
            <Card title={<span style={{fontWeight:700,color:'#001529'}}>{t('leaveDetail.companyDoctorDecision')}</span>} style={{borderRadius:12,marginBottom:20,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
              <div style={{marginBottom:12}}>
                <Tag color={leave.status==='APPROVED'?'green':leave.status==='PARTIALLY_APPROVED'?'gold':'red'} style={{fontSize:15,padding:'4px 14px',fontWeight:700}}>
                  {leave.status==='APPROVED'?'✅ Approved':leave.status==='PARTIALLY_APPROVED'?'⚠️ Partially Approved':'❌ Rejected'}
                </Tag>
              </div>
              {leave.companyDoctorAssessment && (
                <div style={{marginBottom:14}}>
                  <Text type="secondary" style={{fontSize:11,display:'block',marginBottom:4}}>Medical Assessment</Text>
                  <div style={{background:'#f0f7ff',borderRadius:8,padding:'10px 14px',fontSize:13}}>{leave.companyDoctorAssessment}</div>
                </div>
              )}
              {leave.status==='REJECTED' && leave.rejectionReason && (
                <Alert type="error" showIcon message="Rejection Reasons" description={leave.rejectionReason} style={{borderRadius:8,marginBottom:10}} />
              )}
              {leave.companyDoctorInstructions && (
                <div>
                  <Text type="secondary" style={{fontSize:11,display:'block',marginBottom:4}}>Instructions</Text>
                  <Alert type="info" showIcon message={leave.companyDoctorInstructions} style={{borderRadius:8}} />
                </div>
              )}
            </Card>
          )}
          {violation && (
            <Card title={<span style={{fontWeight:700,color:'#ff4d4f'}}><WarningFilled style={{marginInlineEnd:8}} />Penalty</span>} style={{borderRadius:12,marginBottom:20,borderInlineStart:'4px solid #ff4d4f'}}>
              {[
                {label:'Violation',val:violation.violationNumber===1?'First':violation.violationNumber===2?'Second':'Third'},
                {label:'Penalty',val:violation.penaltyDays?`${violation.penaltyDays} days deduction`:'Written Warning'},
                {label:'Date',val:fmtDate(violation.date)},
              ].map((row,i) => (
                <Row key={i} style={{padding:'8px 0',borderBottom:i<2?'1px solid #fff1f0':'none'}}>
                  <Col span={10}><Text type="secondary" style={{fontSize:12}}>{row.label}</Text></Col>
                  <Col span={14}><Text style={{fontSize:13,fontWeight:500,color:'#ff4d4f'}}>{row.val}</Text></Col>
                </Row>
              ))}
              <Alert type="error" showIcon message={violation.description} style={{borderRadius:8,marginTop:10}} />
            </Card>
          )}
        </Col>
        <Col xs={24} lg={10}>
          <Card title={<span style={{fontWeight:700,color:'#001529'}}>{t('leaveDetail.myComment')}</span>} style={{borderRadius:12,marginBottom:20,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            <div style={{background:leave.employeeComments?'#e6f7ff':'#fafafa',borderRadius:8,padding:'12px 16px',minHeight:60}}>
              <Text style={{fontSize:13,color:leave.employeeComments?'#001529':'#8c8c8c',fontStyle:leave.employeeComments?'normal':'italic'}} dir={isAr?'rtl':'ltr'}>
                {leave.employeeComments || t('leaveDetail.noComment')}
              </Text>
            </div>
          </Card>
          <Card title={<span style={{fontWeight:700,color:'#001529'}}>📄 {t('leaveDetail.myDocuments')}{allDocuments.length>0 && <Tag color="blue" style={{marginInlineStart:8}}>{allDocuments.length}</Tag>}</span>} style={{borderRadius:12,marginBottom:20,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            {docsLoading ? (
              <div style={{textAlign:'center',padding:20}}><Spin size="small" /><Text type="secondary" style={{display:'block',marginTop:8,fontSize:12}}>Loading documents...</Text></div>
            ) : allDocuments.length === 0 ? (
              <div style={{textAlign:'center',padding:'20px 0'}}>
                <FileImageOutlined style={{fontSize:40,color:'#d9d9d9'}} />
                <Text type="secondary" style={{display:'block',marginTop:8,fontSize:13}}>No documents uploaded yet</Text>
                <Text type="secondary" style={{fontSize:11}}>Upload documents using the section below</Text>
              </div>
            ) : (
              <Image.PreviewGroup>
                <Row gutter={[10,10]} style={{marginBottom:16}}>
                  {allDocuments.map((doc) => {
                    const isImg = isImageUrl(doc.url)||doc.fileType?.startsWith('image/');
                    const isPdf = isPdfUrl(doc.url)||doc.fileType==='application/pdf';
                    return (
                      <Col key={doc.id} xs={24} sm={12}>
                        <div style={{border:'1px solid #f0f0f0',borderRadius:8,overflow:'hidden'}}>
                          {isImg && doc.url ? (
                            <Image src={doc.url} alt={doc.fileName} width="100%" height={140} style={{objectFit:'cover'}} placeholder={<div style={{width:'100%',height:140,display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f5'}}><Spin size="small" /></div>} />
                          ) : isPdf ? (
                            <div style={{height:140,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#fff2f0',cursor:'pointer'}} onClick={() => window.open(doc.url,'_blank')}>
                              <FilePdfOutlined style={{fontSize:48,color:'#ff4d4f'}} /><Text style={{fontSize:11,color:'#ff4d4f',marginTop:4}}>Click to view PDF</Text>
                            </div>
                          ) : (
                            <div style={{height:140,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#f0f5ff',cursor:'pointer'}} onClick={() => window.open(doc.url,'_blank')}>
                              <FileImageOutlined style={{fontSize:48,color:'#1890ff'}} /><Text style={{fontSize:11,color:'#1890ff',marginTop:4}}>Click to view</Text>
                            </div>
                          )}
                          <div style={{padding:'8px 10px'}}>
                            <Text style={{fontSize:11,display:'block',fontWeight:500}} ellipsis>{doc.fileName}</Text>
                            <div style={{display:'flex',alignItems:'center',gap:4,marginTop:4,flexWrap:'wrap'}}>
                              <Tag color={DOC_TYPE_COLOR[doc.classification]||'default'} style={{fontSize:9,margin:0}}>{DOC_TYPE_LABEL[doc.classification]||doc.classification||'Document'}</Tag>
                              {doc.fileSize>0 && <Text type="secondary" style={{fontSize:9}}>{(doc.fileSize/1024).toFixed(0)} KB</Text>}
                            </div>
                            <div style={{display:'flex',gap:4,marginTop:6}}>
                              {doc.url && <Button size="small" type="link" icon={<EyeOutlined />} onClick={() => window.open(doc.url,'_blank')} style={{fontSize:11,padding:'0 4px'}}>View</Button>}
                              {doc.url && <Button size="small" type="link" icon={<DownloadOutlined />} onClick={() => {const a=document.createElement('a');a.href=doc.url;a.target='_blank';a.download=doc.fileName;a.click();}} style={{fontSize:11,padding:'0 4px'}}>Download</Button>}
                              <Button size="small" type="link" danger icon={<DeleteOutlined />} onClick={() => handleDeleteDocument(doc.id)} style={{fontSize:11,padding:'0 4px'}}>Delete</Button>
                            </div>
                          </div>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </Image.PreviewGroup>
            )}
            <div style={{borderTop:'1px solid #f5f5f5',paddingTop:12}}>
              <Text type="secondary" style={{fontSize:11,display:'block',marginBottom:8}}>📋 Document Checklist</Text>
              {[
                {ok:allDocuments.some((d)=>d.classification==='SICK_LEAVE_CERTIFICATE'),label:t('submitLeave.sickLeaveCertificate'),required:true},
                {ok:allDocuments.some((d)=>d.classification==='FINANCIAL_RECEIPT'),label:t('submitLeave.financialReceipt'),required:true},
                {ok:allDocuments.some((d)=>d.classification==='PRESCRIPTION'),label:t('submitLeave.prescription'),required:false},
              ].map((item,i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'4px 0'}}>
                  {item.ok?<CheckCircleFilled style={{color:'#52c41a',fontSize:14}} />:item.required?<CloseCircleFilled style={{color:'#ff4d4f',fontSize:14}} />:<ExclamationCircleFilled style={{color:'#faad14',fontSize:14}} />}
                  <Text style={{fontSize:12}}>{item.label}</Text>
                </div>
              ))}
            </div>
          </Card>
          <Card title={<span style={{fontWeight:700,color:'#001529'}}>{t('leaveDetail.timeline')}</span>} style={{borderRadius:12,marginBottom:20,boxShadow:'0 2px 8px rgba(0,0,0,0.06)'}}>
            {timelineItems.length>0 ? <Timeline items={timelineItems} /> : <Text type="secondary" style={{fontSize:12}}>No timeline events yet</Text>}
          </Card>
          <Collapse items={[{
            key:'1',
            label:<span style={{fontWeight:600,color:'#001529'}}><CloudUploadOutlined style={{marginInlineEnd:8,color:'#D4AF37'}} />{t('leaveDetail.uploadAdditionalDocuments')}{uploading && <Spin size="small" style={{marginInlineStart:8}} />}</span>,
            children:(
              <div>
                <Text type="secondary" style={{fontSize:12,display:'block',marginBottom:12}}>Upload additional documents to cloud storage.</Text>
                <Upload.Dragger multiple accept=".jpg,.jpeg,.png,.pdf" showUploadList={false} disabled={uploading}
                  customRequest={({file,onSuccess,onError}) => {handleUploadDocument(file as File).then(()=>onSuccess?.('ok')).catch((err)=>onError?.(err as Error));}}
                  style={{borderRadius:8}}>
                  {uploading?(<><LoadingOutlined style={{fontSize:32,color:'#D4AF37'}} /><p style={{marginTop:8,color:'#595959'}}>Uploading...</p></>):(<><CloudUploadOutlined style={{fontSize:32,color:'#D4AF37'}} /><p style={{marginTop:8,color:'#595959'}}>Click or drag files here</p><p style={{color:'#8c8c8c',fontSize:11}}>JPG, PNG, PDF (max 10MB)</p></>)}
                </Upload.Dragger>
              </div>
            ),
          }]} style={{borderRadius:12,marginBottom:20}} />
          <div style={{paddingBottom:32}}>
            <Button block size="large" icon={isAr?<ArrowRightOutlined />:<ArrowLeftOutlined />} onClick={() => navigate('/employee/my-leaves')} style={{borderRadius:8}}>{t('leaveDetail.backToMyLeaves')}</Button>
          </div>
        </Col>
      </Row>
      <Modal open={confirmModalVisible} title="Confirm Attendance" onCancel={() => setConfirmModalVisible(false)}
        footer={[<Button key="c" onClick={() => setConfirmModalVisible(false)}>Cancel</Button>,
          <Button key="ok" type="primary" style={{background:'#52c41a',borderColor:'#52c41a'}} disabled={!attendanceConfirmed} onClick={() => setConfirmModalVisible(false)}>Confirm</Button>]}>
        <Checkbox checked={attendanceConfirmed} onChange={(e) => setAttendanceConfirmed(e.target.checked)}>
          I confirm attendance {leave.examinationDetails && `— ${fmtDate(leave.examinationDetails.date)}`}
        </Checkbox>
      </Modal>
    </div>
  );
};

export default LeaveDetail;
