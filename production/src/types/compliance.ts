import type { ID, ISODateString } from "./common";

export type ComplianceItemKind =
  | "acknowledgement"
  | "training"
  | "credential"
  | "policy-signoff";

export type ComplianceItemState =
  | "complete"
  | "due-soon"
  | "overdue"
  | "in-progress"
  | "blocked";

export interface ComplianceItem {
  id: ID;
  kind: ComplianceItemKind;
  title: string;
  state: ComplianceItemState;
  dueAt?: ISODateString;
  completedAt?: ISODateString;
  linkedDocumentId?: ID;
  linkedTrainingId?: ID;
  description?: string;
  progressPercent?: number;
}

export interface ComplianceSummary {
  overallPercent: number;
  acknowledgementsDone: number;
  acknowledgementsTotal: number;
  trainingDone: number;
  trainingTotal: number;
  credentialsValid: number;
  credentialsTotal: number;
  expiringSoonCount: number;
  overdueCount: number;
}
