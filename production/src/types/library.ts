import type { ID, Sector, StaffRole, ISODateString } from "./common";

export type DocumentType =
  | "policy"
  | "procedure"
  | "form"
  | "guideline"
  | "fact-sheet"
  | "emergency-protocol";

export type DocumentStatus = "published" | "updated" | "archived-for-staff";

export interface DocumentSummary {
  id: ID;
  title: string;
  shortTitle?: string;
  type: DocumentType;
  version: string;
  status: DocumentStatus;
  sectors: Sector[];
  rolesRelevant: StaffRole[];
  tags: string[];
  category: string;
  pillar?: string;
  effectiveAt: ISODateString;
  updatedAt: ISODateString;
  bookmarked?: boolean;
  pinnedAsQuickRef?: boolean;
  offlineAvailable?: boolean;
  recentlyUsedByAI?: boolean;
  estimatedReadMinutes?: number;
  emergencyRelated?: boolean;
}

export interface DocumentSection {
  id: ID;
  anchor: string;
  title: string;
  body: string;
}

export interface GuidedStep {
  index: number;
  title: string;
  detail: string;
  caution?: string;
  iconKey?: string;
}

export interface RelatedItem {
  id: ID;
  title: string;
  type: DocumentType | "faq" | "form-template";
}

export interface DocumentDetail extends DocumentSummary {
  summary: string;
  sections: DocumentSection[];
  guidedSteps: GuidedStep[];
  relatedForms: RelatedItem[];
  relatedFaqs: RelatedItem[];
  hasEmergencyVariant?: boolean;
  acknowledgementRequired?: boolean;
}
