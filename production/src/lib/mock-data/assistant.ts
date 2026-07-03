import type {
  ConversationTurn,
  GuidanceResponse,
  SuggestedPrompt,
} from "@/types";

export const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    id: "p_fall",
    label: "Resident has had an unwitnessed fall",
    intent: "falls.post-fall",
    iconKey: "alert-triangle",
  },
  {
    id: "p_med_error",
    label: "Suspected medication error",
    intent: "medication.error",
    iconKey: "pill",
  },
  {
    id: "p_behaviour",
    label: "De-escalating responsive behaviour",
    intent: "behaviour.deescalation",
    iconKey: "user",
  },
  {
    id: "p_outbreak",
    label: "Possible infection outbreak — what now?",
    intent: "infection.outbreak",
    iconKey: "shield",
  },
  {
    id: "p_consent",
    label: "Documenting informed consent",
    intent: "consent.documentation",
    iconKey: "file-text",
  },
  {
    id: "p_handover",
    label: "Clinical handover checklist",
    intent: "handover.checklist",
    iconKey: "clipboard-list",
  },
];

const sampleResponse: GuidanceResponse = {
  id: "resp_001",
  queryId: "q_001",
  createdAt: "2025-05-23T08:55:00+10:00",
  confidence: "high",
  escalate: false,
  blocks: [
    {
      kind: "summary",
      text: "Treat any unwitnessed fall as potential serious injury until clinical assessment confirms otherwise. Do not move the resident. Notify the RN on duty and begin observations.",
    },
    {
      kind: "steps",
      steps: [
        {
          index: 1,
          text: "Ensure the area is safe. Stay with the resident.",
          iconKey: "shield",
        },
        {
          index: 2,
          text: "Assess airway, breathing, circulation and conscious state.",
          iconKey: "stethoscope",
        },
        {
          index: 3,
          text: "Notify the registered nurse on duty. Provide location, mechanism, and observations.",
          iconKey: "phone",
        },
        {
          index: 4,
          text: "Commence neurovascular observations every 30 minutes for the first 2 hours.",
          iconKey: "activity",
        },
        {
          index: 5,
          text: "Lodge an incident report before the end of shift.",
          iconKey: "file-text",
        },
      ],
    },
    {
      kind: "warning",
      text: "Suspected head strike or change in conscious state must be escalated immediately and 000 called if unstable.",
      severity: "warn",
    },
    {
      kind: "citations",
      citations: [
        {
          id: "cit_001",
          documentId: "doc_falls_prev",
          documentTitle: "Falls Prevention & Post-Fall Management",
          sectionAnchor: "post-fall",
          sectionTitle: "Post-fall response",
          snippet:
            "Do not move the resident until clinical assessment is complete. Notify the registered nurse on duty…",
          version: "4.2",
          effectiveAt: "2025-04-10T00:00:00+10:00",
        },
        {
          id: "cit_002",
          documentId: "doc_falls_prev",
          documentTitle: "Falls Prevention & Post-Fall Management",
          sectionAnchor: "escalation",
          sectionTitle: "Escalation",
          snippet:
            "Escalate to the team leader and on-call clinical lead for any head strike, suspected fracture…",
          version: "4.2",
          effectiveAt: "2025-04-10T00:00:00+10:00",
        },
      ],
    },
    { kind: "related-docs", documentIds: ["doc_sirs", "doc_handover"] },
  ],
  nextActions: [
    { kind: "open-document", documentId: "doc_falls_prev", sectionAnchor: "post-fall" },
    { kind: "start-incident", presetType: "fall" },
    { kind: "pin-quick-ref" },
    { kind: "ask-followup", prompt: "What if the fall was unwitnessed?" },
  ],
};

export const MOCK_CONVERSATION: ConversationTurn[] = [
  {
    query: {
      id: "q_001",
      text: "A resident has had an unwitnessed fall in their room. What should I do first?",
      locale: "en-AU",
      mode: "standard",
      voice: false,
      createdAt: "2025-05-23T08:54:30+10:00",
    },
    response: sampleResponse,
    state: "complete",
  },
];
