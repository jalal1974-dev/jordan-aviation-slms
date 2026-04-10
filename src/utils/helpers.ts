export const getDoctorRankLabel = (rank: string | undefined | null, t: (key: string) => string): string => {
  const r = rank ?? '';
  if (!r) return '—';
  const map: Record<string, string> = {
    GP: t('doctorRanks.gp'),
    RESIDENT: t('doctorRanks.resident'),
    SPECIALIST: t('doctorRanks.specialist'),
    CONSULTANT: t('doctorRanks.consultant'),
  };
  return map[r] ?? r;
};

export const getStatusLabel = (status: string | undefined | null, t: (key: string) => string): string => {
  const s = status ?? '';
  const map: Record<string, string> = {
    SUBMITTED: t('statuses.submitted'),
    PROCESSING: t('statuses.processing'),
    UNDER_REVIEW: t('statuses.underReview'),
    DOCS_REQUESTED: t('statuses.docsRequested'),
    EXAMINATION_REQUESTED: t('statuses.examinationRequested'),
    APPROVED: t('statuses.approved'),
    PARTIALLY_APPROVED: t('statuses.partiallyApproved'),
    REJECTED: t('statuses.rejected'),
    PENDING_COMMITTEE: t('statuses.pendingCommittee'),
  };
  return map[s] ?? s;
};

export const getFacilityTypeLabel = (type: string | undefined | null, t: (key: string) => string): string => {
  const tp = type ?? '';
  const map: Record<string, string> = {
    GOVERNMENT_HOSPITAL: t('facilityTypes.governmentHospital'),
    PRIVATE_HOSPITAL: t('facilityTypes.privateHospital'),
    UNIVERSITY_HOSPITAL: t('facilityTypes.universityHospital'),
    ROYAL_MEDICAL_SERVICES: t('facilityTypes.royalMedicalServices'),
    HEALTH_CENTER: t('facilityTypes.healthCenter'),
    PRIVATE_CLINIC: t('facilityTypes.privateClinic'),
    PRIVATE_24H: t('facilityTypes.private24h'),
    SPECIALIZED_CENTER: t('facilityTypes.specializedCenter'),
    MILITARY_HOSPITAL: t('facilityTypes.militaryHospital'),
  };
  return map[tp] ?? tp;
};

export const truncateDiagnosis = (text: string | null | undefined, maxLen: number): string => {
  const t = text ?? '';
  return t.length > maxLen ? `${t.slice(0, maxLen)}…` : t;
};

export const safeAvatarColor = (id: string | null | undefined, colors: string[]): string => {
  if (!id || id.length === 0) return colors[0];
  return colors[id.charCodeAt(id.length - 1) % colors.length];
};
