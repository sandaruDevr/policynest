import type { ID, ISODateString, StaffRole } from "./common";

export type TrainingType =
  | "induction"
  | "module"
  | "microlearning"
  | "video"
  | "competency";

export type TrainingStatus =
  | "not-started"
  | "in-progress"
  | "completed"
  | "overdue"
  | "due-soon";

export interface TrainingModule {
  id: ID;
  title: string;
  type: TrainingType;
  category: string;
  durationMinutes: number;
  status: TrainingStatus;
  progressPercent: number;
  dueAt?: ISODateString;
  rolesRelevant: StaffRole[];
  linkedPolicyId?: ID;
  thumbnailHint?: string;
  required?: boolean;
}

export interface InductionStep {
  id: ID;
  index: number;
  title: string;
  status: "completed" | "current" | "upcoming";
  durationMinutes: number;
  type: TrainingType;
}

export interface SignedDocument {
  id: ID;
  documentId: ID;
  documentTitle: string;
  version: string;
  signedAt: ISODateString;
  signatureMethod: "typed" | "drawn" | "biometric";
}

export type CredentialStatus = "valid" | "expiring-soon" | "expired" | "in-review" | "missing";

export interface CredentialItem {
  id: ID;
  name: string;
  issuer: string;
  number?: string;
  issuedAt?: ISODateString;
  expiresAt?: ISODateString;
  status: CredentialStatus;
  required?: boolean;
  fileName?: string;
}
