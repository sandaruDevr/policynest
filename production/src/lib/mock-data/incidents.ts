import type { IncidentReport } from "@/types";

export const MOCK_INCIDENTS: IncidentReport[] = [
  {
    id: "inc_001",
    reference: "INC-2025-0492",
    type: "fall",
    status: "in-review",
    severity: "high",
    occurredAt: "2025-05-21T22:18:00+10:00",
    reportedAt: "2025-05-21T22:54:00+10:00",
    location: "Room 14B, Wing C",
    involvedSummary: "Resident — high falls risk profile",
    description:
      "Unwitnessed fall in bathroom. Resident found on floor, alert and orientated, complaining of right hip pain.",
    observedIssues: ["Wet floor near basin", "Call bell out of reach"],
    immediateActions:
      "Did not move resident. Notified RN. Commenced neurovascular obs. Cleared bathroom floor.",
    notifiedParties: ["RN on duty", "Team Leader", "Family contact"],
    attachments: [{ id: "att_1", fileName: "scene-1.jpg", mime: "image/jpeg" }],
    aiSuggestedNextSteps: [
      "Lodge SIRS notification within 24 hours",
      "Update falls risk plan",
      "Schedule review with physiotherapy",
    ],
    followUpRequired: true,
    timeline: [
      {
        id: "t1",
        at: "2025-05-21T22:54:00+10:00",
        label: "Submitted",
        actor: "Aisha Karimov",
        state: "submitted",
      },
      {
        id: "t2",
        at: "2025-05-22T07:32:00+10:00",
        label: "Acknowledged by Team Leader",
        actor: "M. O'Connor",
        state: "in-review",
      },
      {
        id: "t3",
        at: "2025-05-22T11:14:00+10:00",
        label: "Comment added",
        actor: "M. O'Connor",
        state: "comment",
        note: "Physio review scheduled for 24 May.",
      },
    ],
  },
  {
    id: "inc_002",
    reference: "INC-2025-0498",
    type: "near-miss",
    status: "submitted",
    severity: "low",
    occurredAt: "2025-05-22T14:02:00+10:00",
    reportedAt: "2025-05-22T14:18:00+10:00",
    location: "Medication Room, Wing B",
    description:
      "Near-miss: medication chart printed incorrectly with previous resident's name, identified before administration.",
    observedIssues: ["Printer queue cross-contamination"],
    immediateActions:
      "Discarded printed chart, reprinted from correct profile, notified RN.",
    notifiedParties: ["RN on duty"],
    attachments: [],
    timeline: [
      {
        id: "t1",
        at: "2025-05-22T14:18:00+10:00",
        label: "Submitted",
        state: "submitted",
        actor: "Aisha Karimov",
      },
    ],
  },
  {
    id: "inc_003",
    reference: "INC-2025-0501",
    type: "behaviour",
    status: "draft",
    severity: "medium",
    occurredAt: "2025-05-23T06:45:00+10:00",
    reportedAt: "2025-05-23T06:58:00+10:00",
    location: "Dining Room, Wing C",
    description:
      "Resident displayed verbal aggression at breakfast service, de-escalated using validation technique.",
    observedIssues: [],
    immediateActions: "Moved resident to quieter area. Offered preferred drink.",
    notifiedParties: ["RN on duty"],
    attachments: [],
    timeline: [
      {
        id: "t1",
        at: "2025-05-23T06:58:00+10:00",
        label: "Draft saved",
        state: "draft",
        actor: "Aisha Karimov",
      },
    ],
  },
];
