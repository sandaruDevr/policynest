import "server-only";
import { createClient } from "@/lib/supabase/server";
import { recordPlatformAction } from "./audit";
import type {
  PlatformHitlItem,
  HitlSlaConfig,
  ReviewHitlInput,
  HitlReviewStatus,
} from "@/types/platform";

const REVIEW_STATUSES: HitlReviewStatus[] = ["pending", "approved", "rejected", "corrected"];

function normalizeStatus(value: string): HitlReviewStatus {
  return REVIEW_STATUSES.includes(value as HitlReviewStatus)
    ? (value as HitlReviewStatus)
    : "pending";
}

/**
 * List cross-tenant HITL items with optional filters.
 */
export async function listPlatformHitlItems(filters?: {
  status?: string;
  riskLevel?: string;
  slaBreachedOnly?: boolean;
  tenantId?: string;
  limit?: number;
}): Promise<PlatformHitlItem[]> {
  const supabase = createClient();
  let query = supabase
    .from("platform_hitl_overview")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(filters?.limit ?? 100);

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.riskLevel) query = query.eq("risk_level", filters.riskLevel);
  if (filters?.slaBreachedOnly) query = query.eq("sla_breached", true);
  if (filters?.tenantId) query = query.eq("tenant_id", filters.tenantId);

  const { data } = await query;

  return (data || []).map((r) => ({
    id: r.id,
    tenantId: r.tenant_id,
    tenantName: r.tenant_name,
    userId: r.user_id,
    userEmail: r.user_email,
    userName: r.user_name,
    query: r.query,
    draftAnswer: r.draft_answer,
    confidence: r.confidence,
    riskLevel: r.risk_level,
    status: normalizeStatus(r.status),
    reviewerId: r.reviewer_id,
    reviewedAnswer: r.reviewed_answer,
    reviewNotes: r.review_notes,
    createdAt: r.created_at,
    reviewedAt: r.reviewed_at,
    ageHours: Number(r.age_hours),
    slaBreached: r.sla_breached,
  }));
}

/**
 * Get HITL SLA metrics for dashboard cards.
 */
export async function getHitlMetrics(): Promise<{
  totalPending: number;
  totalBreached: number;
  avgAgeHours: number;
  byRisk: Array<{ riskLevel: string; count: number; breached: number }>;
}> {
  const items = await listPlatformHitlItems({ status: "pending", limit: 500 });

  const byRiskMap = new Map<string, { count: number; breached: number }>();
  let totalAge = 0;
  let totalBreached = 0;

  for (const item of items) {
    const risk = item.riskLevel ?? "unspecified";
    const entry = byRiskMap.get(risk) ?? { count: 0, breached: 0 };
    entry.count++;
    if (item.slaBreached) {
      entry.breached++;
      totalBreached++;
    }
    totalAge += item.ageHours;
  }

  const byRisk = Array.from(byRiskMap.entries()).map(([riskLevel, v]) => ({
    riskLevel,
    count: v.count,
    breached: v.breached,
  }));

  return {
    totalPending: items.length,
    totalBreached,
    avgAgeHours: items.length > 0 ? totalAge / items.length : 0,
    byRisk,
  };
}

/**
 * Review a HITL item from the platform (cross-tenant).
 */
export async function reviewHitlItem(
  input: ReviewHitlInput,
): Promise<{ error?: string }> {
  const supabase = createClient();

  const update: Record<string, unknown> = {
    status: input.status,
    reviewed_at: new Date().toISOString(),
  };

  if (input.reviewedAnswer !== undefined) update.reviewed_answer = input.reviewedAnswer;
  if (input.reviewNotes !== undefined) update.review_notes = input.reviewNotes;

  const { error } = await supabase
    .from("hitl_queue")
    .update(update)
    .eq("id", input.itemId);

  if (error) return { error: error.message };

  await recordPlatformAction({
    action: "hitl.review",
    targetType: "hitl_item",
    targetId: input.itemId,
    summary: `Reviewed HITL item: ${input.status}`,
    meta: { status: input.status, hasAnswer: !!input.reviewedAnswer },
  });

  return {};
}

/**
 * Bulk review multiple HITL items.
 */
export async function bulkReviewHitl(
  itemIds: string[],
  status: "approved" | "rejected",
  reviewNotes?: string,
): Promise<{ updated: number; error?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("hitl_queue")
    .update({
      status,
      reviewed_at: new Date().toISOString(),
      review_notes: reviewNotes ?? null,
    })
    .in("id", itemIds)
    .eq("status", "pending")
    .select("id");

  if (error) return { updated: 0, error: error.message };

  const updated = data?.length ?? 0;

  await recordPlatformAction({
    action: "hitl.bulk_review",
    targetType: "hitl_queue",
    targetId: undefined,
    summary: `Bulk reviewed ${updated} HITL items: ${status}`,
    meta: { count: updated, status, itemIds },
  });

  return { updated };
}

/**
 * List all SLA configurations.
 */
export async function listSlaConfigs(): Promise<HitlSlaConfig[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("hitl_sla_config")
    .select("*")
    .order("sla_hours", { ascending: true });

  return (data || []).map((r) => ({
    id: r.id,
    riskLevel: r.risk_level,
    slaHours: r.sla_hours,
    escalationHours: r.escalation_hours,
    isActive: r.is_active,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}

/**
 * Update an SLA configuration.
 */
export async function updateSlaConfig(
  id: string,
  input: { slaHours?: number; escalationHours?: number | null; isActive?: boolean },
): Promise<{ error?: string }> {
  const supabase = createClient();

  const update: Record<string, unknown> = {};
  if (input.slaHours !== undefined) update.sla_hours = input.slaHours;
  if (input.escalationHours !== undefined) update.escalation_hours = input.escalationHours;
  if (input.isActive !== undefined) update.is_active = input.isActive;
  update.updated_at = new Date().toISOString();

  if (Object.keys(update).length <= 1) return {};

  const { error } = await supabase
    .from("hitl_sla_config")
    .update(update)
    .eq("id", id);

  if (error) return { error: error.message };

  await recordPlatformAction({
    action: "hitl.sla.update",
    targetType: "hitl_sla_config",
    targetId: id,
    summary: "Updated SLA configuration",
    meta: update,
  });

  return {};
}
