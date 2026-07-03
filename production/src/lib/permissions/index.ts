import type { StaffProfile, StaffRole, Sector } from "@/types";

/** Capability flags. Backend-ready surface for role-based UI gating. */
export type Capability =
  | "incident.report"
  | "incident.draft.resume"
  | "training.upload-credential"
  | "feedback.safe-voice"
  | "library.bookmark"
  | "library.acknowledge"
  | "assistant.escalate"
  | "emergency.declare-drill";

const ROLE_CAPABILITIES: Record<StaffRole, Capability[]> = {
  "care-worker": [
    "incident.report",
    "incident.draft.resume",
    "training.upload-credential",
    "feedback.safe-voice",
    "library.bookmark",
    "library.acknowledge",
    "assistant.escalate",
  ],
  "registered-nurse": [
    "incident.report",
    "incident.draft.resume",
    "training.upload-credential",
    "feedback.safe-voice",
    "library.bookmark",
    "library.acknowledge",
    "assistant.escalate",
    "emergency.declare-drill",
  ],
  "enrolled-nurse": [
    "incident.report",
    "incident.draft.resume",
    "training.upload-credential",
    "feedback.safe-voice",
    "library.bookmark",
    "library.acknowledge",
    "assistant.escalate",
  ],
  "team-leader": [
    "incident.report",
    "incident.draft.resume",
    "training.upload-credential",
    "feedback.safe-voice",
    "library.bookmark",
    "library.acknowledge",
    "assistant.escalate",
    "emergency.declare-drill",
  ],
  "support-worker": [
    "incident.report",
    "training.upload-credential",
    "feedback.safe-voice",
    "library.bookmark",
    "library.acknowledge",
  ],
  "lifestyle-coordinator": [
    "incident.report",
    "feedback.safe-voice",
    "library.bookmark",
    "library.acknowledge",
  ],
  kitchen: ["incident.report", "feedback.safe-voice", "library.bookmark"],
  maintenance: ["incident.report", "feedback.safe-voice", "library.bookmark"],
};

export function can(profile: StaffProfile, capability: Capability): boolean {
  return ROLE_CAPABILITIES[profile.role]?.includes(capability) ?? false;
}

export function inSector(profile: StaffProfile, sector: Sector): boolean {
  return profile.sectors.includes(sector) || sector === "universal";
}
