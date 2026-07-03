import type {
  ActivityItem,
  NotificationItem,
  QuickReferenceItem,
  SafeVoiceSubmission,
  SurveySummary,
} from "@/types";

export const MOCK_QUICK_REFS: QuickReferenceItem[] = [
  {
    id: "qr_1",
    kind: "policy",
    title: "Falls Prevention",
    subtitle: "v4.2 · Clinical Safety",
    pinnedAt: "2025-05-12T10:11:00+10:00",
    targetId: "doc_falls_prev",
  },
  {
    id: "qr_2",
    kind: "emergency",
    title: "Fire Response (R.A.C.E.)",
    subtitle: "Offline available",
    pinnedAt: "2025-04-22T11:00:00+10:00",
    targetId: "doc_emerg_fire",
  },
  {
    id: "qr_3",
    kind: "ai-answer",
    title: "Unwitnessed fall — first response",
    subtitle: "Saved from Assistant",
    pinnedAt: "2025-05-23T08:55:00+10:00",
  },
  {
    id: "qr_4",
    kind: "form",
    title: "Post-Fall Observation Chart",
    subtitle: "Clinical form",
    pinnedAt: "2025-05-08T07:30:00+10:00",
  },
  {
    id: "qr_5",
    kind: "procedure",
    title: "Clinical Handover",
    subtitle: "v2.2",
    pinnedAt: "2025-05-02T07:30:00+10:00",
    targetId: "doc_handover",
  },
  {
    id: "qr_6",
    kind: "site-link",
    title: "Wing C Evacuation Map",
    subtitle: "Brunswick Care Community",
    pinnedAt: "2025-04-10T12:00:00+10:00",
  },
];

export const MOCK_SURVEYS: SurveySummary[] = [
  {
    id: "sv_1",
    title: "Quarterly safety pulse",
    description: "Five questions about safety culture and recent incidents.",
    status: "active",
    questionCount: 5,
    estimatedMinutes: 3,
    closesAt: "2025-06-04T00:00:00+10:00",
    anonymous: true,
  },
  {
    id: "sv_2",
    title: "Onboarding experience",
    description: "Tell us how the first 30 days went.",
    status: "active",
    questionCount: 8,
    estimatedMinutes: 5,
    closesAt: "2025-06-12T00:00:00+10:00",
    anonymous: false,
  },
  {
    id: "sv_3",
    title: "Q1 wellbeing check-in",
    status: "completed",
    questionCount: 6,
    estimatedMinutes: 4,
    completedAt: "2025-04-02T13:14:00+10:00",
    anonymous: true,
  },
];

export const MOCK_SAFE_VOICE: SafeVoiceSubmission[] = [
  {
    id: "sv_a",
    submittedAt: "2025-05-18T22:14:00+10:00",
    category: "near-miss",
    message:
      "Medication trolley left unattended for 2 minutes during emergency call.",
    anonymous: true,
    status: "reviewing",
  },
  {
    id: "sv_b",
    submittedAt: "2025-04-29T07:42:00+10:00",
    category: "improvement",
    message: "Suggest larger room labels on Wing C corridor for visual clarity.",
    anonymous: false,
    status: "actioned",
  },
];

export const MOCK_ACTIVITY: ActivityItem[] = [
  {
    id: "ac_1",
    kind: "ai-question",
    at: "2025-05-23T08:55:00+10:00",
    title: "Asked: Unwitnessed fall — first response",
  },
  {
    id: "ac_2",
    kind: "incident-submitted",
    at: "2025-05-22T14:18:00+10:00",
    title: "Submitted INC-2025-0498 — Near miss medication",
  },
  {
    id: "ac_3",
    kind: "training-completed",
    at: "2025-05-20T16:02:00+10:00",
    title: "Completed: Safe Use of Mechanical Hoists",
  },
  {
    id: "ac_4",
    kind: "policy-acknowledged",
    at: "2025-04-12T11:25:00+10:00",
    title: "Acknowledged: Falls Prevention v4.2",
  },
  {
    id: "ac_5",
    kind: "quick-ref-pinned",
    at: "2025-05-23T08:55:30+10:00",
    title: "Pinned: Unwitnessed fall — first response",
  },
  {
    id: "ac_6",
    kind: "survey-submitted",
    at: "2025-04-02T13:14:00+10:00",
    title: "Submitted: Q1 wellbeing check-in",
  },
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n_1",
    category: "compliance",
    level: "warn",
    title: "AHPRA registration expires in 8 days",
    body: "Renew before 31 May to maintain working status.",
    at: "2025-05-23T07:00:00+10:00",
    read: false,
    actionLabel: "Update credential",
    href: "/app/compliance",
  },
  {
    id: "n_2",
    category: "training",
    level: "info",
    title: "Medication Safety Refresher due in 7 days",
    at: "2025-05-23T07:01:00+10:00",
    read: false,
    actionLabel: "Open training",
    href: "/app/training",
  },
  {
    id: "n_3",
    category: "broadcast",
    level: "info",
    title: "Wing C corridor refurbishment — 24 May 8:00–14:00",
    body: "Plan resident routes via central lounge.",
    at: "2025-05-22T17:30:00+10:00",
    read: true,
  },
  {
    id: "n_4",
    category: "incident",
    level: "info",
    title: "INC-2025-0492 update from Team Leader",
    at: "2025-05-22T11:14:00+10:00",
    read: false,
    actionLabel: "View incident",
    href: "/app/incidents",
  },
];
