export type UserRole = 'member' | 'officer' | 'admin';
export type CertStatus = 'active' | 'expiring_soon' | 'expired' | 'pending_renewal';
export type CertType = 'CCPE' | 'PCPE';
export type RenewalStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'payment_verification'
  | 'document_verification'
  | 'recommended_approval'
  | 'recommended_rejection'
  | 'approved'
  | 'rejected';

export type DocumentType =
  | 'profile_photo'
  | 'old_id'
  | 'regional_certificate'
  | 'national_certificate'
  | 'proof_of_payment'
  | 'signature'
  | 'other';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface Profile {
  id: string;
  role: UserRole;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  email: string | null;
  communication_email: string | null;
  mobile_number: string | null;
  place_of_birth: string | null;
  unit_number: string | null;
  village_subdivision: string | null;
  street: string | null;
  barangay: string | null;
  city_town: string | null;
  zip_code: string | null;
  icpep_region: string | null;
  certification_number: string | null;
  certification_type: CertType | null;
  date_issued: string | null;
  expiration_date: string | null;
  profile_photo_url: string | null;
  cert_status: CertStatus;
  created_at: string;
  updated_at: string;
}

export interface Renewal {
  id: string;
  member_id: string;
  renewal_type: CertType;
  certification_number: string;
  date_id_validity: string | null;
  amount_paid: number | null;
  bank_name: string | null;
  branch_location: string | null;
  deposit_date: string | null;
  deposit_time: string | null;
  reference_number: string | null;
  batch_number: string | null;
  signature_url: string | null;
  date_signed: string | null;
  declaration_agreed: boolean;
  status: RenewalStatus;
  remarks: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
  documents?: Document[];
}

export interface Document {
  id: string;
  renewal_id: string;
  document_type: DocumentType;
  file_name: string;
  file_url: string;
  file_size: number | null;
  upload_date: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  created_at: string;
}

export interface RenewalStatusHistory {
  id: string;
  renewal_id: string;
  status: RenewalStatus;
  changed_by: string | null;
  remarks: string | null;
  created_at: string;
  profiles?: Pick<Profile, 'first_name' | 'last_name' | 'role'>;
}

export const ICPEP_REGIONS = [
  'NCR', 'CAR', 'Region I', 'Region II', 'Region III',
  'Region IV-A', 'Region IV-B', 'Region V', 'Region VI',
  'Region VII', 'Region VIII', 'Region IX', 'Region X',
  'Region XI', 'Region XII', 'Region XIII', 'BARMM', 'Negros Island Region (NIR)',
  'Singapore', 'Qatar', 'Kingdom of Saudi Arabia (KSA)',
];

export const STATUS_LABELS: Record<RenewalStatus, string> = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  payment_verification: 'Payment Verification',
  document_verification: 'Document Verification',
  recommended_approval: 'Recommended for Approval',
  recommended_rejection: 'Recommended for Rejection',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const STATUS_COLORS: Record<RenewalStatus, string> = {
  draft: 'bg-gray-100 text-gray-700',
  submitted: 'bg-blue-100 text-blue-800',
  under_review: 'bg-yellow-100 text-yellow-800',
  payment_verification: 'bg-orange-100 text-orange-800',
  document_verification: 'bg-purple-100 text-purple-800',
  recommended_approval: 'bg-teal-100 text-teal-800',
  recommended_rejection: 'bg-red-100 text-red-700',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

export const CERT_STATUS_COLORS: Record<CertStatus, string> = {
  active: 'bg-green-100 text-green-800',
  expiring_soon: 'bg-yellow-100 text-yellow-800',
  expired: 'bg-red-100 text-red-800',
  pending_renewal: 'bg-blue-100 text-blue-800',
};
