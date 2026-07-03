import type { ID, ISODateString } from "./common";
import type { SystemRole } from "./admin";

/**
 * Super Admin (platform-governance) domain types.
 *
 * The platform layer sits ABOVE organization tenants. A platform admin is a
 * `profiles` row inside the internal "Policy Nest Platform" tenant and gains
 * cross-tenant access through PostgreSQL-enforced platform RLS policies.
 */

/** The fixed, well-known internal platform tenant id (mirrors SQL). */
export const PLATFORM_TENANT_ID = "00000000-0000-0000-0000-000000000001";

export type TenantStatus = "provisioning" | "active" | "suspended" | "archived";

export const TENANT_STATUS_LABEL: Record<TenantStatus, string> = {
  provisioning: "Provisioning",
  active: "Active",
  suspended: "Suspended",
  archived: "Archived",
};

/**
 * Server-resolved context for an authenticated platform admin.
 * Produced by `getPlatformContext()` and consumed by the platform layout.
 */
export interface PlatformContext {
  profile: {
    id: ID;
    fullName: string;
    role: SystemRole;
    roleLabel: string;
    avatarUrl?: string;
  };
}

/** A customer organization as seen from the platform directory. */
export interface PlatformTenantSummary {
  id: ID;
  name: string;
  industry: string | null;
  country: string | null;
  stateOrTerritory: string | null;
  status: TenantStatus;
  plan: string;
  userCount: number;
  documentCount: number;
  siteCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** A platform-defined subscription plan. */
export interface TenantPlan {
  id: string;
  label: string;
  description: string | null;
  maxUsers: number;
  maxDocuments: number;
  maxSites: number;
  aiQueriesPerMonth: number | null;
  storageGb: number;
  hitlEnabled: boolean;
  goldenAnswersEnabled: boolean;
  customGuidanceEnabled: boolean;
  sortOrder: number;
  isActive: boolean;
}

/** Per-tenant feature toggle. */
export interface TenantFeatureFlag {
  tenantId: ID;
  feature: string;
  enabled: boolean;
  updatedAt: ISODateString;
}

/** Monthly usage meter for a tenant. */
export interface TenantUsageMeter {
  id: ID;
  tenantId: ID;
  periodStart: ISODateString;
  periodEnd: ISODateString;
  aiQueries: number;
  aiTokensUsed: number;
  documentsCount: number;
  chunksCount: number;
  storageBytes: number;
  activeUsers: number;
  hitlReviews: number;
  incidentsCount: number;
}

/** Provisioning log entry for a tenant. */
export interface ProvisioningLogEntry {
  id: ID;
  tenantId: ID;
  step: string;
  status: "pending" | "completed" | "failed" | "skipped";
  detail: string | null;
  createdAt: ISODateString;
}

/** Full tenant detail with plan info, feature flags, and provisioning log. */
export interface TenantDetail extends PlatformTenantSummary {
  planDetails: TenantPlan | null;
  featureFlags: TenantFeatureFlag[];
  provisioningLog: ProvisioningLogEntry[];
}

/** Input for creating a new tenant. */
export interface CreateTenantInput {
  name: string;
  industry?: string;
  country?: string;
  stateOrTerritory?: string;
  plan?: string;
  defaultSiteName?: string;
  defaultSiteCode?: string;
}

/** Input for updating a tenant. */
export interface UpdateTenantInput {
  name?: string;
  industry?: string;
  country?: string;
  stateOrTerritory?: string;
  plan?: string;
  status?: TenantStatus;
}

/** Top-line platform health & growth metrics for the dashboard. */
export interface PlatformMetrics {
  totalTenants: number;
  activeTenants: number;
  suspendedTenants: number;
  provisioningTenants: number;
  totalUsers: number;
  totalDocuments: number;
  publishedDocuments: number;
  totalQueries: number;
  escalatedQueries: number;
  escalationRate: number;
  pendingReviews: number;
  openIncidents: number;
}

/** A single point in a platform time-series (e.g. queries per day). */
export interface PlatformTrendPoint {
  date: string;
  value: number;
}

/** A cross-tenant platform audit entry. */
export interface PlatformAuditEntry {
  id: ID;
  actorId: ID | null;
  actorRole: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  targetTenantId: string | null;
  summary: string | null;
  meta: Record<string, unknown>;
  createdAt: ISODateString;
}

/** Master template lifecycle status. */
export type TemplateStatus = "draft" | "in_review" | "approved" | "published" | "retired";

export const TEMPLATE_STATUS_LABEL: Record<TemplateStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  published: "Published",
  retired: "Retired",
};

/** A platform-owned master template (summary from the view). */
export interface MasterTemplateSummary {
  id: ID;
  documentId: ID;
  title: string;
  description: string | null;
  documentType: string;
  category: string | null;
  pillar: string | null;
  sector: string | null;
  framework: string[];
  tags: string[];
  riskLevel: string | null;
  status: TemplateStatus;
  targetRoles: string[];
  currentVersion: string | null;
  shadowCount: number;
  versionCount: number;
  latestVersion: string | null;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** A versioned release of a master template. */
export interface TemplateVersion {
  id: ID;
  templateId: ID;
  version: string;
  documentId: ID;
  title: string;
  content: string | null;
  summary: string | null;
  changeReason: string | null;
  propagatedTo: string[];
  status: "draft" | "published" | "superseded";
  publishedAt: ISODateString | null;
  publishedBy: ID | null;
  createdAt: ISODateString;
}

/** A shadow propagation log entry. */
export interface PropagationLogEntry {
  id: ID;
  templateId: ID;
  versionId: ID;
  targetTenantId: ID;
  shadowDocumentId: ID | null;
  status: "pushed" | "updated" | "skipped" | "failed";
  detail: string | null;
  pushedBy: ID | null;
  pushedAt: ISODateString;
}

/** Full template detail with versions and propagation log. */
export interface MasterTemplateDetail extends MasterTemplateSummary {
  versions: TemplateVersion[];
  propagationLog: PropagationLogEntry[];
}

/** Input for creating a master template. */
export interface CreateTemplateInput {
  title: string;
  description?: string;
  documentType?: string;
  category?: string;
  pillar?: string;
  sector?: string;
  framework?: string[];
  tags?: string[];
  riskLevel?: string;
  targetRoles?: string[];
  content?: string;
}

/** Input for creating a new version of a template. */
export interface CreateVersionInput {
  templateId: ID;
  version: string;
  title: string;
  content?: string;
  summary?: string;
  changeReason?: string;
}

/** AI model type. */
export type AiModelType = "chat" | "embedding" | "vision" | "reasoning";

export const AI_MODEL_TYPE_LABEL: Record<AiModelType, string> = {
  chat: "Chat",
  embedding: "Embedding",
  vision: "Vision",
  reasoning: "Reasoning",
};

/** A registered AI model. */
export interface AiModel {
  id: ID;
  provider: string;
  modelId: string;
  label: string;
  modelType: AiModelType;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  costPer1kInput: number | null;
  costPer1kOutput: number | null;
  isActive: boolean;
  isDefault: boolean;
  metadata: Record<string, unknown>;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** AI prompt type. */
export type PromptType = "system" | "user_template" | "structured";

/** A registered AI prompt (summary from the view). */
export interface AiPromptSummary {
  id: ID;
  key: string;
  label: string;
  description: string | null;
  promptType: PromptType;
  modelType: string;
  isActive: boolean;
  currentVersion: string | null;
  versionCount: number;
  evaluationCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** A versioned prompt content. */
export interface PromptVersion {
  id: ID;
  promptId: ID;
  version: string;
  content: string;
  changeReason: string | null;
  status: "draft" | "published" | "superseded";
  publishedAt: ISODateString | null;
  publishedBy: ID | null;
  createdBy: ID | null;
  createdAt: ISODateString;
}

/** Evaluation status. */
export type EvaluationStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export const EVALUATION_STATUS_LABEL: Record<EvaluationStatus, string> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

/** An AI evaluation run. */
export interface AiEvaluation {
  id: ID;
  label: string;
  description: string | null;
  promptId: ID | null;
  promptVersionId: ID | null;
  modelId: ID | null;
  status: EvaluationStatus;
  avgScore: number | null;
  avgLatencyMs: number | null;
  totalCases: number;
  passedCases: number;
  summary: string | null;
  metadata: Record<string, unknown>;
  createdBy: ID | null;
  createdAt: ISODateString;
  completedAt: ISODateString | null;
}

/** A single evaluation test case. */
export interface EvaluationCase {
  id: ID;
  evaluationId: ID;
  input: string;
  expectedOutput: string | null;
  actualOutput: string | null;
  score: number | null;
  latencyMs: number | null;
  status: "pending" | "pass" | "fail" | "error";
  notes: string | null;
  metadata: Record<string, unknown>;
  createdAt: ISODateString;
}

/** Input for creating an AI model. */
export interface CreateModelInput {
  provider?: string;
  modelId: string;
  label: string;
  modelType?: AiModelType;
  contextWindow?: number;
  maxOutputTokens?: number;
  costPer1kInput?: number;
  costPer1kOutput?: number;
  isActive?: boolean;
  isDefault?: boolean;
}

/** Input for creating an AI prompt. */
export interface CreatePromptInput {
  key: string;
  label: string;
  description?: string;
  promptType?: PromptType;
  modelType?: string;
  content: string;
  changeReason?: string;
}

/** Input for creating a prompt version. */
export interface CreatePromptVersionInput {
  promptId: ID;
  version: string;
  content: string;
  changeReason?: string;
}

/** Input for creating an evaluation. */
export interface CreateEvaluationInput {
  label: string;
  description?: string;
  promptId?: string;
  promptVersionId?: string;
  modelId?: string;
  cases: Array<{ input: string; expectedOutput?: string }>;
}

/** HITL review status. */
export type HitlReviewStatus = "pending" | "approved" | "rejected" | "corrected";

export const HITL_REVIEW_STATUS_LABEL: Record<HitlReviewStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
  corrected: "Corrected",
};

/** A cross-tenant HITL review item (from platform_hitl_overview view). */
export interface PlatformHitlItem {
  id: ID;
  tenantId: ID;
  tenantName: string;
  userId: ID | null;
  userEmail: string | null;
  userName: string | null;
  query: string;
  draftAnswer: string | null;
  confidence: number | null;
  riskLevel: string | null;
  status: HitlReviewStatus;
  reviewerId: ID | null;
  reviewedAnswer: string | null;
  reviewNotes: string | null;
  createdAt: ISODateString;
  reviewedAt: ISODateString | null;
  ageHours: number;
  slaBreached: boolean;
}

/** SLA configuration for a risk level. */
export interface HitlSlaConfig {
  id: ID;
  riskLevel: string;
  slaHours: number;
  escalationHours: number | null;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

/** Input for reviewing a HITL item from the platform. */
export interface ReviewHitlInput {
  itemId: string;
  status: "approved" | "rejected" | "corrected";
  reviewedAnswer?: string;
  reviewNotes?: string;
}
