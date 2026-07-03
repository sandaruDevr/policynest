import type {
  EmergencyDrill,
  EmergencyProtocol,
  EmergencyContact,
} from "@/types";

const SHARED_CONTACTS: EmergencyContact[] = [
  {
    id: "ec_000",
    label: "Emergency Services (000)",
    role: "External",
    phone: "000",
    isPrimary: true,
  },
  {
    id: "ec_oncall",
    label: "On-Call Clinical Lead",
    role: "Internal",
    phone: "+61 3 9000 1234",
    isPrimary: true,
  },
  {
    id: "ec_facility",
    label: "Facility Manager",
    role: "Internal",
    phone: "+61 3 9000 1100",
  },
];

export const MOCK_PROTOCOLS: EmergencyProtocol[] = [
  {
    category: "fire",
    title: "Fire Emergency Response",
    shortLabel: "Fire",
    description:
      "Detect, alert, contain, evacuate. Follow R.A.C.E. protocol and the site evacuation map.",
    steps: [
      {
        index: 1,
        title: "R — Remove",
        detail: "Remove anyone in immediate danger from the fire zone.",
      },
      {
        index: 2,
        title: "A — Alert",
        detail: "Activate the nearest fire alarm and call 000.",
      },
      {
        index: 3,
        title: "C — Contain",
        detail: "Close doors and windows behind you to contain the fire.",
      },
      {
        index: 4,
        title: "E — Evacuate",
        detail: "Use the nearest safe evacuation route. Meet at assembly point Alpha.",
        caution: "Do not use lifts during evacuation.",
      },
    ],
    contacts: SHARED_CONTACTS,
    linkedDocumentIds: ["doc_emerg_fire"],
    offlineAvailable: true,
    lastSyncedAt: "2025-05-22T03:00:00+10:00",
  },
  {
    category: "medical",
    title: "Medical Emergency",
    shortLabel: "Medical",
    description:
      "Initial assessment, escalation, and clinical intervention for sudden deterioration or arrest.",
    steps: [
      {
        index: 1,
        title: "Assess scene safety",
        detail: "Ensure your safety before approaching the resident.",
      },
      {
        index: 2,
        title: "DRSABCD",
        detail:
          "Danger, Response, Send for help, Airway, Breathing, CPR, Defibrillation.",
      },
      {
        index: 3,
        title: "Call 000 + RN",
        detail: "Call 000 for ambulance and notify the RN on duty simultaneously.",
      },
      {
        index: 4,
        title: "Document",
        detail: "Record times, observations, interventions, and notifications.",
      },
    ],
    contacts: SHARED_CONTACTS,
    linkedDocumentIds: [],
    offlineAvailable: true,
    lastSyncedAt: "2025-05-22T03:00:00+10:00",
  },
  {
    category: "aggression",
    title: "Aggression & De-escalation",
    shortLabel: "Aggression",
    description:
      "Personal safety first. Use validated de-escalation techniques and call for support early.",
    steps: [
      {
        index: 1,
        title: "Maintain safe distance",
        detail: "Position yourself near an exit. Do not corner the person.",
      },
      {
        index: 2,
        title: "Calm verbal approach",
        detail: "Use low tone, short sentences, validate emotion, offer choice.",
      },
      {
        index: 3,
        title: "Call for support",
        detail: "Activate duress alarm or call team leader. Do not attempt restraint alone.",
        caution: "Restraint is a last resort and must be authorised.",
      },
    ],
    contacts: SHARED_CONTACTS,
    linkedDocumentIds: ["doc_behaviour"],
    offlineAvailable: true,
    lastSyncedAt: "2025-05-22T03:00:00+10:00",
  },
  {
    category: "incident-sirs",
    title: "Reportable Incident (SIRS)",
    shortLabel: "Incident / SIRS",
    description:
      "Identify, secure, escalate, and notify within mandated timeframes (24 / 30 days).",
    steps: [
      {
        index: 1,
        title: "Ensure safety",
        detail: "Stabilise the situation and the resident.",
      },
      {
        index: 2,
        title: "Notify",
        detail: "Inform RN on duty and team leader immediately.",
      },
      {
        index: 3,
        title: "Document",
        detail: "Lodge incident report before end of shift.",
      },
      {
        index: 4,
        title: "Escalate to SIRS",
        detail: "If reportable, ensure SIRS notification is lodged within 24 hours.",
      },
    ],
    contacts: SHARED_CONTACTS,
    linkedDocumentIds: ["doc_sirs"],
    offlineAvailable: true,
    lastSyncedAt: "2025-05-22T03:00:00+10:00",
  },
  {
    category: "facility",
    title: "Facility Failure",
    shortLabel: "Flood / Power / Facility",
    description:
      "Power loss, flood, gas, or building failure. Protect residents, secure clinical equipment.",
    steps: [
      {
        index: 1,
        title: "Account for residents",
        detail: "Move residents to safe area if required. Do a head count.",
      },
      {
        index: 2,
        title: "Notify maintenance",
        detail: "Call facility manager immediately and emergency services if dangerous.",
      },
      {
        index: 3,
        title: "Protect clinical equipment",
        detail: "Switch to backup power for critical devices. Document downtime.",
      },
    ],
    contacts: SHARED_CONTACTS,
    linkedDocumentIds: [],
    offlineAvailable: true,
    lastSyncedAt: "2025-05-22T03:00:00+10:00",
  },
];

export const MOCK_DRILLS: EmergencyDrill[] = [
  {
    id: "dr_1",
    title: "Quarterly Fire Drill — Wing C",
    conductedAt: "2025-04-18T11:00:00+10:00",
    outcome: "passed",
  },
  {
    id: "dr_2",
    title: "Code Black Simulation",
    conductedAt: "2025-03-09T09:30:00+10:00",
    outcome: "review",
  },
];

export const MOCK_CONTACTS: EmergencyContact[] = SHARED_CONTACTS;
