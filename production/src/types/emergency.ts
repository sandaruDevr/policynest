import type { ID, ISODateString } from "./common";

export type EmergencyCategoryKey =
  | "fire"
  | "medical"
  | "aggression"
  | "incident-sirs"
  | "facility";

export interface EmergencyContact {
  id: ID;
  label: string;
  role: string;
  phone: string;
  isPrimary?: boolean;
}

export interface EmergencyStep {
  index: number;
  title: string;
  detail: string;
  caution?: string;
}

export interface EmergencyProtocol {
  category: EmergencyCategoryKey;
  title: string;
  shortLabel: string;
  description: string;
  steps: EmergencyStep[];
  contacts: EmergencyContact[];
  linkedDocumentIds: ID[];
  offlineAvailable: boolean;
  lastSyncedAt: ISODateString;
}

export interface EmergencyDrill {
  id: ID;
  title: string;
  conductedAt: ISODateString;
  outcome: "passed" | "review" | "failed";
}
