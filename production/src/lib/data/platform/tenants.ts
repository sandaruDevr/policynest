import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PlatformTenantSummary, TenantStatus } from "@/types/platform";

const STATUSES: TenantStatus[] = [
  "provisioning",
  "active",
  "suspended",
  "archived",
];

function normalizeStatus(value: string): TenantStatus {
  return STATUSES.includes(value as TenantStatus)
    ? (value as TenantStatus)
    : "active";
}

/**
 * List all customer organizations from the aggregated, RLS-respecting
 * `platform_tenant_overview` view (single query; scales to thousands of
 * tenants). The internal platform tenant is excluded by the view.
 */
export async function listTenants(): Promise<PlatformTenantSummary[]> {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("platform_tenant_overview")
    .select("*")
    .order("created_at", { ascending: false });

  return (rows || []).map((r) => ({
    id: r.id,
    name: r.name,
    industry: r.industry,
    country: r.country,
    stateOrTerritory: r.state_or_territory,
    status: normalizeStatus(r.status),
    plan: r.plan,
    userCount: r.user_count,
    documentCount: r.document_count,
    siteCount: r.site_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
}
