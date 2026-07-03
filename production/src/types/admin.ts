import type { ID, ISODateString } from "./common";

/**
 * System role stored on `profiles.role`.
 *
 * Distinct from `StaffRole` (job title). This governs platform access tiers.
 */
export type SystemRole =
  | "staff"
  | "organisation_admin"
  | "compliance_manager"
  | "platform_admin";

/** Roles that may access the Organization Admin surface. */
export const ADMIN_ROLES: SystemRole[] = [
  "organisation_admin",
  "compliance_manager",
  "platform_admin",
];

/** Human-readable labels for system roles. */
export const SYSTEM_ROLE_LABEL: Record<SystemRole, string> = {
  staff: "Staff",
  organisation_admin: "Organization Admin",
  compliance_manager: "Compliance Manager",
  platform_admin: "Platform Admin",
};

/** A site within the admin's tenant. */
export interface AdminSite {
  id: ID;
  name: string;
  address: string | null;
  code: string | null;
}

/** Tenant summary surfaced in the admin shell. */
export interface AdminTenant {
  id: ID;
  name: string;
  industry: string | null;
  country: string | null;
  stateOrTerritory: string | null;
}

/**
 * Server-resolved context for an authenticated organization admin.
 * Produced by `getAdminContext()` and consumed by the admin layout.
 */
export interface AdminContext {
  profile: {
    id: ID;
    fullName: string;
    role: SystemRole;
    roleLabel: string;
    avatarUrl?: string;
  };
  tenant: AdminTenant;
  sites: AdminSite[];
}

// ---------------------------------------------------------------------
// Document governance
// ---------------------------------------------------------------------

export type AdminDocumentStatus =
  | "draft"
  | "in_review"
  | "approved"
  | "published"
  | "superseded"
  | "archived";

export type DocumentOrigin = "organisation" | "platform_shadow" | "master";

export type ValidationStatus = "pending" | "pass" | "warn" | "fail";

export interface AdminDocumentSummary {
  id: ID;
  title: string;
  shortTitle: string | null;
  documentType: string | null;
  status: AdminDocumentStatus;
  version: string;
  category: string | null;
  pillar: string | null;
  riskLevel: string | null;
  sector: string | null;
  framework: string[];
  tags: string[];
  origin: DocumentOrigin;
  acknowledgementRequired: boolean;
  effectiveDate: string | null;
  expiryDate: string | null;
  reviewDueAt: string | null;
  updatedAt: string;
  publishedAt: string | null;
  rolesRelevant: string[];
  siteIds: string[];
}

export interface AdminDocumentSection {
  id: ID;
  anchor: string;
  title: string;
  body: string;
  ord: number;
}

export interface DocumentVersionEntry {
  id: ID;
  version: string;
  title: string;
  summary: string | null;
  statusAtSnapshot: string | null;
  authorType: "human" | "ai" | "platform";
  changeReason: string | null;
  createdBy: string | null;
  createdAt: ISODateString;
}

export interface ValidationFrameworkCoverage {
  framework: string;
  coverage: number;
  status: "pass" | "warn" | "fail";
}

export interface ValidationGap {
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  detail: string;
}

export interface ValidationFlag {
  type: string;
  detail: string;
}

export interface DocumentValidation {
  id: ID;
  version: string | null;
  status: ValidationStatus;
  score: number | null;
  summary: string | null;
  frameworks: ValidationFrameworkCoverage[];
  gaps: ValidationGap[];
  flags: ValidationFlag[];
  blockers: string[];
  model: string | null;
  createdAt: ISODateString;
}

export interface AdminDocumentDetail extends AdminDocumentSummary {
  summary: string | null;
  content: string | null;
  ownerId: string | null;
  createdBy: string | null;
  approvedBy: string | null;
  publishedBy: string | null;
  changeReason: string | null;
  sourceTemplateId: string | null;
  parentDocumentId: string | null;
  sections: AdminDocumentSection[];
  versions: DocumentVersionEntry[];
  latestValidation: DocumentValidation | null;
}

// ---------------------------------------------------------------------
// Users & Sites administration
// ---------------------------------------------------------------------

export type UserStatus = "active" | "invited" | "inactive";

export interface AdminUser {
  id: ID;
  fullName: string | null;
  preferredName: string | null;
  email: string | null;
  role: SystemRole;
  roleLabel: string;
  staffRole: string | null;
  jobTitle: string | null;
  phone: string | null;
  status: UserStatus;
  siteId: string | null;
  siteName: string | null;
  primarySector: string | null;
  createdAt: ISODateString;
}

export interface AdminSiteDetail extends AdminSite {
  userCount: number;
  createdAt: ISODateString;
}

/** An entry in the tamper-evident admin audit trail. */
export interface AdminAuditEntry {
  id: ID;
  actorId: ID | null;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  summary: string | null;
  meta: Record<string, unknown>;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------
// AI Governance
// ---------------------------------------------------------------------

/** A citation surfaced by the assistant or stored on a golden answer. */
export interface AiCitation {
  title: string;
  version?: string | null;
  section_title?: string | null;
  document_id?: string | null;
}

export type HitlStatus = "pending" | "approved" | "rejected" | "corrected";
export type RiskLevel = "low" | "medium" | "high";

/** An item awaiting human review in the HITL queue. */
export interface HitlItem {
  id: ID;
  query: string;
  draftAnswer: string | null;
  confidence: number | null;
  riskLevel: RiskLevel | null;
  status: HitlStatus;
  reviewerId: string | null;
  reviewedAnswer: string | null;
  reviewNotes: string | null;
  askedBy: string | null;
  retrievedCount: number;
  createdAt: ISODateString;
  reviewedAt: ISODateString | null;
}

export const HITL_STATUS_LABEL: Record<HitlStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  corrected: "Corrected",
};

export type GoldenStatus = "active" | "inactive" | "archived";

/** A curated, pre-approved answer served ahead of RAG. */
export interface GoldenAnswer {
  id: ID;
  questionPattern: string;
  approvedAnswer: string;
  citations: AiCitation[];
  framework: string[];
  riskLevel: RiskLevel | null;
  status: GoldenStatus;
  approvedBy: string | null;
  sourceHitlId: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export const GOLDEN_STATUS_LABEL: Record<GoldenStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
};

/** Per-tenant AI behaviour configuration. */
export interface TenantAiSettings {
  assistantEnabled: boolean;
  hitlConfidenceThreshold: number;
  escalateHighRisk: boolean;
  goldenAnswersEnabled: boolean;
  minRetrievalSimilarity: number;
  retrievalTopK: number;
  customGuidance: string | null;
  updatedAt: ISODateString | null;
}

/** Aggregate AI activity metrics for the governance dashboard. */
export interface AiActivityMetrics {
  totalQueries: number;
  escalatedQueries: number;
  avgConfidence: number | null;
  pendingReviews: number;
  activeGoldenAnswers: number;
  escalationRate: number;
}

/** A recent assistant interaction for the activity feed. */
export interface AiActivityEntry {
  id: ID;
  query: string;
  answer: string | null;
  confidence: number | null;
  escalated: boolean;
  createdAt: ISODateString;
}

// ---------------------------------------------------------------------
// Training & Surveys
// ---------------------------------------------------------------------

export interface AdminTrainingModule {
  id: ID;
  title: string;
  type: string;
  category: string | null;
  durationMinutes: number | null;
  required: boolean;
  rolesRelevant: string[];
  linkedPolicyId: string | null;
  createdAt: ISODateString;
}

export interface TrainingAssignmentSummary {
  id: ID;
  moduleTitle: string;
  userName: string | null;
  status: "not_started" | "in_progress" | "completed" | "overdue";
  progressPercent: number | null;
  dueAt: ISODateString | null;
  completedAt: ISODateString | null;
}

export interface AdminSurvey {
  id: ID;
  title: string;
  description: string | null;
  status: string;
  questionCount: number | null;
  estimatedMinutes: number | null;
  closesAt: ISODateString | null;
  anonymous: boolean;
  assignedCount: number;
  completedCount: number;
  createdAt: ISODateString;
}
