import type { ComplianceItem, ComplianceSummary } from "@/types";

export const MOCK_COMPLIANCE_SUMMARY: ComplianceSummary = {
  overallPercent: 84,
  acknowledgementsDone: 7,
  acknowledgementsTotal: 9,
  trainingDone: 12,
  trainingTotal: 16,
  credentialsValid: 3,
  credentialsTotal: 4,
  expiringSoonCount: 1,
  overdueCount: 1,
};

export const MOCK_COMPLIANCE_ITEMS: ComplianceItem[] = [
  {
    id: "ci_1",
    kind: "acknowledgement",
    title: "Read & Acknowledge: Medication Administration v6.0",
    state: "due-soon",
    dueAt: "2025-05-30T00:00:00+10:00",
    linkedDocumentId: "doc_med_admin",
  },
  {
    id: "ci_2",
    kind: "training",
    title: "Medication Safety Refresher",
    state: "due-soon",
    dueAt: "2025-05-30T00:00:00+10:00",
    linkedTrainingId: "tr_med_safety",
    progressPercent: 0,
  },
  {
    id: "ci_3",
    kind: "training",
    title: "SIRS Reportable Incidents",
    state: "overdue",
    dueAt: "2025-05-18T00:00:00+10:00",
    linkedTrainingId: "tr_sirs",
    progressPercent: 30,
  },
  {
    id: "ci_4",
    kind: "credential",
    title: "AHPRA Registration",
    state: "due-soon",
    dueAt: "2025-05-31T00:00:00+10:00",
  },
  {
    id: "ci_5",
    kind: "policy-signoff",
    title: "Falls Prevention v4.2",
    state: "complete",
    completedAt: "2025-04-12T11:25:00+10:00",
    linkedDocumentId: "doc_falls_prev",
  },
  {
    id: "ci_6",
    kind: "training",
    title: "Falls Prevention in Practice",
    state: "in-progress",
    progressPercent: 60,
    linkedTrainingId: "tr_falls",
  },
];
