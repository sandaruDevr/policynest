import type { ID, ISODateString, Severity } from "./common";

export type IncidentType =
  | "fall"
  | "medication"
  | "behaviour"
  | "skin-integrity"
  | "near-miss"
  | "equipment"
  | "hazard"
  | "missing-person"
  | "other";

export type IncidentStatus =
  | "draft"
  | "submitted"
  | "in-review"
  | "actioned"
  | "closed";

export interface IncidentTimelineEntry {
  id: ID;
  at: ISODateString;
  label: string;
  actor?: string;
  state: IncidentStatus | "comment";
  note?: string;
}

export interface IncidentReport {
  id: ID;
  reference: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: Severity;
  occurredAt: ISODateString;
  reportedAt: ISODateString;
  location: string;
  involvedSummary?: string;
  description: string;
  observedIssues: string[];
  immediateActions: string;
  notifiedParties: string[];
  attachments: { id: ID; fileName: string; mime: string }[];
  aiSuggestedNextSteps?: string[];
  followUpRequired?: boolean;
  anonymous?: boolean;
  timeline: IncidentTimelineEntry[];
}

export interface IncidentDraft
  extends Partial<Omit<IncidentReport, "id" | "reference" | "status" | "timeline">> {
  draftId: ID;
  step: number;
  updatedAt: ISODateString;
}
