export type UserRole = 'EMPLOYEE' | 'COMPANY_DOCTOR' | 'HR_MANAGER' | 'HR_OFFICER';

export type LeaveStatus =
  | 'SUBMITTED'
  | 'PROCESSING'
  | 'UNDER_REVIEW'
  | 'DOCS_REQUESTED'
  | 'EXAMINATION_REQUESTED'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'
  | 'REJECTED'
  | 'PENDING_COMMITTEE';

export type DoctorRank = 'GP' | 'RESIDENT' | 'SPECIALIST' | 'CONSULTANT';

export type FacilityType =
  | 'GOVERNMENT_HOSPITAL'
  | 'PRIVATE_HOSPITAL'
  | 'UNIVERSITY_HOSPITAL'
  | 'ROYAL_MEDICAL_SERVICES'
  | 'HEALTH_CENTER'
  | 'PRIVATE_CLINIC'
  | 'PRIVATE_24H'
  | 'SPECIALIZED_CENTER'
  | 'MILITARY_HOSPITAL';

export type DocumentType =
  | 'SICK_LEAVE_CERTIFICATE'
  | 'FINANCIAL_RECEIPT'
  | 'PRESCRIPTION'
  | 'LAB_RESULTS'
  | 'XRAY'
  | 'HOSPITAL_REPORT'
  | 'OTHER';

export type CircularType = 'POLICY_UPDATE' | 'FACILITY_BLACKLIST' | 'REMINDER' | 'ANNOUNCEMENT';

export interface Department {
  id: string;
  code: string;
  nameEn: string;
  nameAr: string;
}

export interface User {
  id: string;
  employeeNumber: string;
  email: string;
  nameEn: string;
  nameAr: string;
  department: Department;
  jobTitle: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  sickLeaveBalance: number;
  sickLeaveTotal: number;
}

export interface Doctor {
  id: string;
  nameEn: string;
  nameAr: string;
  rank: DoctorRank;
  specialty: string;
  licenseNumber?: string;
  trustScore: number | null;
  leavesIssued: number;
  leavesFlagged: number;
  isNew?: boolean;
}

export interface Facility {
  id: string;
  nameEn: string;
  nameAr: string;
  type: FacilityType;
  trustScore: number | null;
  leavesFromFacility: number;
  isBlocked: boolean;
  isNew?: boolean;
}

export interface UploadedDocument {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  thumbnail?: string;
  classification: DocumentType;
  confidence: number;
  uploadedAt: Date;
}

export interface SickLeave {
  id: string;
  refNumber: string;
  employeeId: string;
  employee: User;
  submittedAt: Date;
  fromDate: Date;
  toDate: Date;
  totalDays: number;
  status: LeaveStatus;
  doctor: Doctor;
  facility: Facility;
  symptoms: string;
  diagnosis: string;
  icd10Code?: string;
  employeeComments?: string;
  documents: UploadedDocument[];
  wasHospitalized: boolean;
  isChronicDisease: boolean;
  companyDoctorId?: string;
  companyDoctorDecision?: string;
  companyDoctorAssessment?: string;
  companyDoctorInstructions?: string;
  approvedDays?: number;
  rejectionReason?: string;
  partialApprovalDetails?: {
    approvedFrom: Date;
    approvedTo: Date;
    approvedDays: number;
    rejectedFrom: Date;
    rejectedTo: Date;
    rejectedDays: number;
    reason: string;
  };
  examinationDetails?: {
    date: Date;
    time: string;
    location: string;
    confirmed: boolean;
  };
  requestedDocuments?: string[];
  timeline: TimelineEvent[];
  violationId?: string;
}

export interface TimelineEvent {
  id: string;
  timestamp: Date;
  type: string;
  description: string;
  color: string;
  icon?: string;
}

export interface Violation {
  id: string;
  employeeId: string;
  leaveId: string;
  leave: SickLeave;
  date: Date;
  violationType: string;
  penaltyType: string;
  penaltyDays?: number;
  description: string;
  violationNumber: number;
}

export interface Circular {
  id: string;
  refNumber: string;
  title: string;
  titleAr: string;
  type: CircularType;
  date: Date;
  content: string;
  contentAr: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  timestamp: Date;
  read: boolean;
  relatedLeaveId?: string;
  relatedCircularId?: string;
}

export interface LeaveBalance {
  employeeId: string;
  year: number;
  totalEntitlement: number;
  used: number;
  remaining: number;
  history: LeaveBalanceHistory[];
}

export interface LeaveBalanceHistory {
  id: string;
  date: Date;
  leaveId: string;
  daysUsed: number;
  balanceBefore: number;
  balanceAfter: number;
  description: string;
}

export interface KPIData {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: 'up' | 'down' | 'stable';
  color: string;
  icon?: string;
  progress?: number;
}

export interface DoctorReviewFormData {
  decision: 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED' | 'REQUEST_DOCS' | 'REQUEST_EXAMINATION';
  assessment: string;
  instructions: string;
  approvedDays?: number;
  rejectionReason?: string;
  requestedDocuments?: string[];
  examinationDate?: Date;
  examinationTime?: string;
  partialApprovalDetails?: {
    approvedFrom: Date;
    approvedTo: Date;
    rejectedFrom: Date;
    rejectedTo: Date;
    reason: string;
  };
}
