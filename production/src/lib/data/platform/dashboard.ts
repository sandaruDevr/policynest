import "server-only";
import { createClient } from "@/lib/supabase/server";
import { PLATFORM_TENANT_ID } from "@/types/platform";
import type { PlatformMetrics } from "@/types/platform";

/**
 * Aggregate platform-wide health & growth metrics from real data across all
 * tenants. Reads are governed by the platform RLS policies (platform admins
 * only). The internal platform tenant is excluded from customer counts.
 */
export async function getPlatformMetrics(): Promise<PlatformMetrics> {
  const supabase = createClient();

  const countTenant = (status?: string) => {
    let q = supabase
      .from("tenants")
      .select("*", { count: "exact", head: true })
      .eq("is_platform", false);
    if (status) q = q.eq("status", status);
    return q;
  };

  const [
    totalTenants,
    activeTenants,
    suspendedTenants,
    provisioningTenants,
    totalUsers,
    totalDocuments,
    publishedDocuments,
    totalQueries,
    escalatedQueries,
    pendingReviews,
    openIncidents,
  ] = await Promise.all([
    countTenant(),
    countTenant("active"),
    countTenant("suspended"),
    countTenant("provisioning"),
    supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .neq("tenant_id", PLATFORM_TENANT_ID),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .neq("tenant_id", PLATFORM_TENANT_ID),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .neq("tenant_id", PLATFORM_TENANT_ID)
      .eq("status", "published"),
    supabase.from("rag_audit_logs").select("*", { count: "exact", head: true }),
    supabase
      .from("rag_audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("escalated", true),
    supabase
      .from("hitl_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("incidents")
      .select("*", { count: "exact", head: true })
      .in("status", ["submitted", "reviewing"]),
  ]);

  const queries = totalQueries.count ?? 0;
  const escalated = escalatedQueries.count ?? 0;

  return {
    totalTenants: totalTenants.count ?? 0,
    activeTenants: activeTenants.count ?? 0,
    suspendedTenants: suspendedTenants.count ?? 0,
    provisioningTenants: provisioningTenants.count ?? 0,
    totalUsers: totalUsers.count ?? 0,
    totalDocuments: totalDocuments.count ?? 0,
    publishedDocuments: publishedDocuments.count ?? 0,
    totalQueries: queries,
    escalatedQueries: escalated,
    escalationRate: queries > 0 ? escalated / queries : 0,
    pendingReviews: pendingReviews.count ?? 0,
    openIncidents: openIncidents.count ?? 0,
  };
}
