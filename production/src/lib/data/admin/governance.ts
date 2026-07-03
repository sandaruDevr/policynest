import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin/session";
import type {
  AiActivityEntry,
  AiActivityMetrics,
  AiCitation,
  GoldenAnswer,
  GoldenStatus,
  HitlItem,
  HitlStatus,
  RiskLevel,
  TenantAiSettings,
} from "@/types/admin";

function countChunks(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function asCitations(value: unknown): AiCitation[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
    .map((c) => ({
      title: String(c.title ?? "Untitled"),
      version: (c.version as string) ?? null,
      section_title: (c.section_title as string) ?? null,
      document_id: (c.document_id as string) ?? null,
    }));
}

// ---------------------------------------------------------------------
// HITL review queue
// ---------------------------------------------------------------------

export async function listHitlItems(
  status: HitlStatus | "all" = "all",
): Promise<HitlItem[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const supabase = createClient();
  let query = supabase
    .from("hitl_queue")
    .select("*")
    .eq("tenant_id", admin.tenantId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (status !== "all") query = query.eq("status", status);

  const { data } = await query;

  return (data || []).map((r) => ({
    id: r.id,
    query: r.query,
    draftAnswer: r.draft_answer,
    confidence: r.confidence,
    riskLevel: (r.risk_level as RiskLevel) ?? null,
    status: r.status as HitlStatus,
    reviewerId: r.reviewer_id,
    reviewedAnswer: r.reviewed_answer,
    reviewNotes: r.review_notes,
    askedBy: r.user_id,
    retrievedCount: countChunks(r.retrieved_chunks),
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
  }));
}

export interface HitlReviewInput {
  status: Exclude<HitlStatus, "pending">;
  reviewedAnswer?: string | null;
  reviewNotes?: string | null;
}

export async function reviewHitlItem(
  id: string,
  input: HitlReviewInput,
): Promise<HitlItem | null> {
  const admin = await requireAdmin();
  if (!admin) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("hitl_queue")
    .update({
      status: input.status,
      reviewer_id: admin.userId,
      reviewed_answer: input.reviewedAnswer ?? null,
      review_notes: input.reviewNotes ?? null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("tenant_id", admin.tenantId)
    .select("*")
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    query: data.query,
    draftAnswer: data.draft_answer,
    confidence: data.confidence,
    riskLevel: (data.risk_level as RiskLevel) ?? null,
    status: data.status as HitlStatus,
    reviewerId: data.reviewer_id,
    reviewedAnswer: data.reviewed_answer,
    reviewNotes: data.review_notes,
    askedBy: data.user_id,
    retrievedCount: countChunks(data.retrieved_chunks),
    createdAt: data.created_at,
    reviewedAt: data.reviewed_at,
  };
}

/** Promote a reviewed HITL item into a curated golden answer. */
export async function promoteHitlToGolden(
  id: string,
): Promise<{ id: string } | null> {
  const admin = await requireAdmin();
  if (!admin) return null;

  const supabase = createClient();
  const { data: item } = await supabase
    .from("hitl_queue")
    .select("*")
    .eq("id", id)
    .eq("tenant_id", admin.tenantId)
    .single();

  if (!item) return null;

  const answer = item.reviewed_answer || item.draft_answer;
  if (!answer) return null;

  const { data, error } = await supabase
    .from("golden_answers")
    .insert({
      tenant_id: admin.tenantId,
      question_pattern: item.query,
      approved_answer: answer,
      risk_level: item.risk_level,
      status: "active",
      approved_by: admin.userId,
      source_hitl_id: item.id,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return { id: data.id };
}

// ---------------------------------------------------------------------
// Golden answers
// ---------------------------------------------------------------------

function mapGolden(r: {
  id: string;
  question_pattern: string;
  approved_answer: string;
  citations: unknown;
  framework: string[] | null;
  risk_level: string | null;
  status: string;
  approved_by: string | null;
  source_hitl_id: string | null;
  created_at: string;
  updated_at: string;
}): GoldenAnswer {
  return {
    id: r.id,
    questionPattern: r.question_pattern,
    approvedAnswer: r.approved_answer,
    citations: asCitations(r.citations),
    framework: r.framework || [],
    riskLevel: (r.risk_level as RiskLevel) ?? null,
    status: r.status as GoldenStatus,
    approvedBy: r.approved_by,
    sourceHitlId: r.source_hitl_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listGoldenAnswers(): Promise<GoldenAnswer[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("golden_answers")
    .select("*")
    .eq("tenant_id", admin.tenantId)
    .order("updated_at", { ascending: false });

  return (data || []).map(mapGolden);
}

export interface GoldenAnswerInput {
  questionPattern: string;
  approvedAnswer: string;
  riskLevel?: RiskLevel | null;
  framework?: string[];
  status?: GoldenStatus;
  citations?: AiCitation[];
}

export async function createGoldenAnswer(
  input: GoldenAnswerInput,
): Promise<{ id: string } | null> {
  const admin = await requireAdmin();
  if (!admin) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("golden_answers")
    .insert({
      tenant_id: admin.tenantId,
      question_pattern: input.questionPattern,
      approved_answer: input.approvedAnswer,
      risk_level: input.riskLevel ?? null,
      framework: input.framework ?? [],
      status: input.status ?? "active",
      citations: (input.citations ?? []) as never,
      approved_by: admin.userId,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return { id: data.id };
}

export interface GoldenAnswerPatch {
  questionPattern?: string;
  approvedAnswer?: string;
  riskLevel?: RiskLevel | null;
  framework?: string[];
  status?: GoldenStatus;
  citations?: AiCitation[];
}

export async function updateGoldenAnswer(
  id: string,
  patch: GoldenAnswerPatch,
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const update: Record<string, unknown> = {};
  if (patch.questionPattern !== undefined)
    update.question_pattern = patch.questionPattern;
  if (patch.approvedAnswer !== undefined)
    update.approved_answer = patch.approvedAnswer;
  if (patch.riskLevel !== undefined) update.risk_level = patch.riskLevel;
  if (patch.framework !== undefined) update.framework = patch.framework;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.citations !== undefined) update.citations = patch.citations;

  if (Object.keys(update).length === 0) return true;

  const supabase = createClient();
  const { error } = await supabase
    .from("golden_answers")
    .update(update)
    .eq("id", id)
    .eq("tenant_id", admin.tenantId);

  return !error;
}

export async function deleteGoldenAnswer(id: string): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const supabase = createClient();
  const { error } = await supabase
    .from("golden_answers")
    .delete()
    .eq("id", id)
    .eq("tenant_id", admin.tenantId);

  return !error;
}

// ---------------------------------------------------------------------
// Tenant AI settings
// ---------------------------------------------------------------------

const DEFAULT_SETTINGS: TenantAiSettings = {
  assistantEnabled: true,
  hitlConfidenceThreshold: 0.85,
  escalateHighRisk: true,
  goldenAnswersEnabled: true,
  minRetrievalSimilarity: 0.2,
  retrievalTopK: 8,
  customGuidance: null,
  updatedAt: null,
};

export async function getAiSettings(): Promise<TenantAiSettings> {
  const admin = await requireAdmin();
  if (!admin) return DEFAULT_SETTINGS;

  const supabase = createClient();
  const { data } = await supabase
    .from("tenant_ai_settings")
    .select("*")
    .eq("tenant_id", admin.tenantId)
    .maybeSingle();

  if (!data) return DEFAULT_SETTINGS;

  return {
    assistantEnabled: data.assistant_enabled,
    hitlConfidenceThreshold: Number(data.hitl_confidence_threshold),
    escalateHighRisk: data.escalate_high_risk,
    goldenAnswersEnabled: data.golden_answers_enabled,
    minRetrievalSimilarity: Number(data.min_retrieval_similarity),
    retrievalTopK: data.retrieval_top_k,
    customGuidance: data.custom_guidance,
    updatedAt: data.updated_at,
  };
}

export interface AiSettingsPatch {
  assistantEnabled?: boolean;
  hitlConfidenceThreshold?: number;
  escalateHighRisk?: boolean;
  goldenAnswersEnabled?: boolean;
  minRetrievalSimilarity?: number;
  retrievalTopK?: number;
  customGuidance?: string | null;
}

export async function updateAiSettings(
  patch: AiSettingsPatch,
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const row: Record<string, unknown> = { tenant_id: admin.tenantId, updated_by: admin.userId };
  if (patch.assistantEnabled !== undefined)
    row.assistant_enabled = patch.assistantEnabled;
  if (patch.hitlConfidenceThreshold !== undefined)
    row.hitl_confidence_threshold = patch.hitlConfidenceThreshold;
  if (patch.escalateHighRisk !== undefined)
    row.escalate_high_risk = patch.escalateHighRisk;
  if (patch.goldenAnswersEnabled !== undefined)
    row.golden_answers_enabled = patch.goldenAnswersEnabled;
  if (patch.minRetrievalSimilarity !== undefined)
    row.min_retrieval_similarity = patch.minRetrievalSimilarity;
  if (patch.retrievalTopK !== undefined)
    row.retrieval_top_k = patch.retrievalTopK;
  if (patch.customGuidance !== undefined)
    row.custom_guidance = patch.customGuidance;

  const supabase = createClient();
  const { error } = await supabase
    .from("tenant_ai_settings")
    .upsert(row as never, { onConflict: "tenant_id" });

  return !error;
}

// ---------------------------------------------------------------------
// AI activity metrics & feed
// ---------------------------------------------------------------------

export async function getAiActivityMetrics(): Promise<AiActivityMetrics> {
  const admin = await requireAdmin();
  const empty: AiActivityMetrics = {
    totalQueries: 0,
    escalatedQueries: 0,
    avgConfidence: null,
    pendingReviews: 0,
    activeGoldenAnswers: 0,
    escalationRate: 0,
  };
  if (!admin) return empty;

  const supabase = createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ data: logs }, { count: pending }, { count: golden }] =
    await Promise.all([
      supabase
        .from("rag_audit_logs")
        .select("confidence, escalated")
        .eq("tenant_id", admin.tenantId)
        .gte("created_at", since),
      supabase
        .from("hitl_queue")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", admin.tenantId)
        .eq("status", "pending"),
      supabase
        .from("golden_answers")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", admin.tenantId)
        .eq("status", "active"),
    ]);

  const rows = logs || [];
  const total = rows.length;
  const escalated = rows.filter((r) => r.escalated).length;
  const confidences = rows
    .map((r) => r.confidence)
    .filter((c): c is number => typeof c === "number");
  const avg =
    confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : null;

  return {
    totalQueries: total,
    escalatedQueries: escalated,
    avgConfidence: avg,
    pendingReviews: pending || 0,
    activeGoldenAnswers: golden || 0,
    escalationRate: total > 0 ? escalated / total : 0,
  };
}

export async function listAiActivity(limit = 30): Promise<AiActivityEntry[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const supabase = createClient();
  const { data } = await supabase
    .from("rag_audit_logs")
    .select("id, query, answer, confidence, escalated, created_at")
    .eq("tenant_id", admin.tenantId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data || []).map((r) => ({
    id: r.id,
    query: r.query,
    answer: r.answer,
    confidence: r.confidence,
    escalated: r.escalated,
    createdAt: r.created_at,
  }));
}
