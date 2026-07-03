import "server-only";
import { createClient } from "@/lib/supabase/server";
import { recordPlatformAction } from "./audit";
import type {
  CreateTenantInput,
  UpdateTenantInput,
  TenantPlan,
  TenantFeatureFlag,
  TenantDetail,
  ProvisioningLogEntry,
  TenantStatus,
} from "@/types/platform";

const VALID_STATUSES: TenantStatus[] = [
  "provisioning",
  "active",
  "suspended",
  "archived",
];

function normalizeStatus(value: string): TenantStatus {
  return VALID_STATUSES.includes(value as TenantStatus)
    ? (value as TenantStatus)
    : "active";
}

/**
 * List all available subscription plans.
 */
export async function listPlans(): Promise<TenantPlan[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("tenant_plans")
    .select("*")
    .order("sort_order", { ascending: true });

  return (data || []).map((r) => ({
    id: r.id,
    label: r.label,
    description: r.description,
    maxUsers: r.max_users,
    maxDocuments: r.max_documents,
    maxSites: r.max_sites,
    aiQueriesPerMonth: r.ai_queries_per_month,
    storageGb: r.storage_gb,
    hitlEnabled: r.hitl_enabled,
    goldenAnswersEnabled: r.golden_answers_enabled,
    customGuidanceEnabled: r.custom_guidance_enabled,
    sortOrder: r.sort_order,
    isActive: r.is_active,
  }));
}

/**
 * Provision a new tenant via the `provision_tenant()` SQL function.
 * This creates the tenant, seeds AI settings, creates a default site,
 * and logs each step — all in a single atomic transaction.
 */
export async function createTenant(
  input: CreateTenantInput,
): Promise<{ id: string; error?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("provision_tenant", {
    p_name: input.name,
    p_industry: input.industry ?? null,
    p_country: input.country ?? "Australia",
    p_state_or_territory: input.stateOrTerritory ?? null,
    p_plan: input.plan ?? "standard",
    p_default_site_name: input.defaultSiteName ?? "Main Site",
    p_default_site_code: input.defaultSiteCode ?? "HQ",
  });

  if (error) {
    return { id: "", error: error.message };
  }

  const tenantId = data as string;

  await recordPlatformAction({
    action: "tenant.create",
    targetType: "tenant",
    targetId: tenantId,
    targetTenantId: tenantId,
    summary: `Provisioned tenant "${input.name}" on plan "${input.plan ?? "standard"}"`,
    meta: { name: input.name, plan: input.plan ?? "standard" },
  });

  return { id: tenantId };
}

/**
 * Get full tenant detail: summary + plan details + feature flags + provisioning log.
 */
export async function getTenantDetail(
  tenantId: string,
): Promise<TenantDetail | null> {
  const supabase = createClient();

  const [overviewRes, planRes, flagsRes, logRes] = await Promise.all([
    supabase
      .from("platform_tenant_overview")
      .select("*")
      .eq("id", tenantId)
      .single(),
    supabase
      .from("tenants")
      .select("plan")
      .eq("id", tenantId)
      .single(),
    supabase
      .from("tenant_feature_flags")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("feature", { ascending: true }),
    supabase
      .from("tenant_provisioning_log")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: true }),
  ]);

  if (overviewRes.error || !overviewRes.data) return null;

  const o = overviewRes.data;
  const planId = planRes.data?.plan ?? o.plan;

  let planDetails: TenantPlan | null = null;
  if (planId) {
    const { data: planRow } = await supabase
      .from("tenant_plans")
      .select("*")
      .eq("id", planId)
      .single();
    if (planRow) {
      planDetails = {
        id: planRow.id,
        label: planRow.label,
        description: planRow.description,
        maxUsers: planRow.max_users,
        maxDocuments: planRow.max_documents,
        maxSites: planRow.max_sites,
        aiQueriesPerMonth: planRow.ai_queries_per_month,
        storageGb: planRow.storage_gb,
        hitlEnabled: planRow.hitl_enabled,
        goldenAnswersEnabled: planRow.golden_answers_enabled,
        customGuidanceEnabled: planRow.custom_guidance_enabled,
        sortOrder: planRow.sort_order,
        isActive: planRow.is_active,
      };
    }
  }

  const featureFlags: TenantFeatureFlag[] = (flagsRes.data || []).map((f) => ({
    tenantId: f.tenant_id,
    feature: f.feature,
    enabled: f.enabled,
    updatedAt: f.updated_at,
  }));

  const provisioningLog: ProvisioningLogEntry[] = (logRes.data || []).map((l) => ({
    id: l.id,
    tenantId: l.tenant_id,
    step: l.step,
    status: l.status as ProvisioningLogEntry["status"],
    detail: l.detail,
    createdAt: l.created_at,
  }));

  return {
    id: o.id,
    name: o.name,
    industry: o.industry,
    country: o.country,
    stateOrTerritory: o.state_or_territory,
    status: normalizeStatus(o.status),
    plan: o.plan,
    userCount: o.user_count,
    documentCount: o.document_count,
    siteCount: o.site_count,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
    planDetails,
    featureFlags,
    provisioningLog,
  };
}

/**
 * Update a tenant's metadata or lifecycle status.
 */
export async function updateTenant(
  tenantId: string,
  input: UpdateTenantInput,
): Promise<{ error?: string }> {
  const supabase = createClient();

  const update: Record<string, unknown> = {};
  if (input.name !== undefined) update.name = input.name;
  if (input.industry !== undefined) update.industry = input.industry;
  if (input.country !== undefined) update.country = input.country;
  if (input.stateOrTerritory !== undefined)
    update.state_or_territory = input.stateOrTerritory;
  if (input.plan !== undefined) update.plan = input.plan;
  if (input.status !== undefined) update.status = input.status;

  if (Object.keys(update).length === 0) return {};

  const { error } = await supabase
    .from("tenants")
    .update(update)
    .eq("id", tenantId);

  if (error) return { error: error.message };

  const changes: string[] = [];
  if (input.name) changes.push(`name → "${input.name}"`);
  if (input.plan) changes.push(`plan → "${input.plan}"`);
  if (input.status) changes.push(`status → "${input.status}"`);

  await recordPlatformAction({
    action: "tenant.update",
    targetType: "tenant",
    targetId: tenantId,
    targetTenantId: tenantId,
    summary: changes.join(", ") || "Updated tenant",
    meta: update,
  });

  return {};
}

/**
 * Suspend a tenant (blocks all user access via RLS).
 */
export async function suspendTenant(
  tenantId: string,
): Promise<{ error?: string }> {
  return updateTenant(tenantId, { status: "suspended" });
}

/**
 * Reactivate a suspended tenant.
 */
export async function activateTenant(
  tenantId: string,
): Promise<{ error?: string }> {
  return updateTenant(tenantId, { status: "active" });
}

/**
 * Set a feature flag for a tenant.
 */
export async function setFeatureFlag(
  tenantId: string,
  feature: string,
  enabled: boolean,
): Promise<{ error?: string }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("tenant_feature_flags")
    .upsert(
      { tenant_id: tenantId, feature, enabled, updated_by: null },
      { onConflict: "tenant_id,feature" },
    );

  if (error) return { error: error.message };

  await recordPlatformAction({
    action: "tenant.feature_flag",
    targetType: "tenant",
    targetId: tenantId,
    targetTenantId: tenantId,
    summary: `Feature "${feature}" ${enabled ? "enabled" : "disabled"}`,
    meta: { feature, enabled },
  });

  return {};
}
