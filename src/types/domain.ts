import type {
  CaseFileKind,
  PaymentStatus,
  ProfileRole,
  StatusStage,
} from "./database";

export type { CaseFileKind, PaymentStatus, ProfileRole, StatusStage };

export function isAdminRole(role: ProfileRole | null | undefined): boolean {
  return role === "admin" || role === "superadmin";
}

export interface Profile {
  id: string;
  fullName: string;
  role: ProfileRole;
  email: string | null;
  phone: string | null;
  licenseNo: string | null;
  profileImage: string | null;
}

export interface Case {
  id: string;
  insurerName: string;
  insuranceType: string;
  policyCategory: string;
  policyNo: string;
  claimNo: string;
  dateOfAccident: string;
  caseReferenceNo: string;
  intimationDate: string;
  assignedSurveyorId: string | null;
  deputedDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Insured {
  id: string;
  insuredName: string;
  insuredCompany: string | null;
  caseId: string;
}

export interface Vehicle {
  id: string;
  vehicleNo: string;
  vehicleRegistrationDate: string | null;
  vehicleType: string | null;
  vehicleCategory: string | null;
  vehicleOwner: string | null;
  caseId: string;
}

export interface Driver {
  id: string;
  driverName: string;
  vehicleId: string;
  drivingLicense: string | null;
}

export interface Visit {
  caseId: string;
  visitNo: number;
  visitDate: string;
  surveyorId: string | null;
  siteAddress: string | null;
  remarks: string | null;
  createdAt: string;
}

export interface CaseStatus {
  caseId: string;
  statusNo: number;
  stage: StatusStage;
  statusDate: string;
  surveyorId: string | null;
  statusRemarks: string | null;
  createdAt: string;
}

export interface Payment {
  id: string;
  caseId: string;
  amount: number;
  paymentStatus: PaymentStatus;
}

export interface CaseFile {
  id: string;
  caseId: string;
  kind: CaseFileKind;
  storagePath: string;
  createdAt: string;
}

/** Ordered lifecycle stages. Keep in sync with the CHECK constraint in supabase/migrations. */
export const STATUS_STAGES: { value: StatusStage; label: string; actor: "admin" | "surveyor" }[] = [
  { value: "intimated", label: "Case Intimated", actor: "admin" },
  { value: "case_created", label: "Case Created", actor: "admin" },
  { value: "deputed", label: "Surveyor Deputed", actor: "admin" },
  { value: "status_report_sent", label: "Status Report Sent", actor: "surveyor" },
  { value: "call_for_document", label: "Call for Document", actor: "surveyor" },
  { value: "documents_pending", label: "Document Pending", actor: "surveyor" },
  { value: "draft_report", label: "Draft Report", actor: "surveyor" },
  { value: "under_review", label: "Under Review", actor: "admin" },
  { value: "submitted", label: "Final Report Submitted", actor: "surveyor" },
  { value: "closed", label: "Case Closed", actor: "admin" },
];

export function stageLabel(stage: StatusStage): string {
  return STATUS_STAGES.find((s) => s.value === stage)?.label ?? stage;
}
