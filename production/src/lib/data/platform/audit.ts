import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { PlatformAuditEntry } from "@/types/platform";

type Json = Database["public"]["Tables"]["platform_audit_log"]["Row"]["meta"];

interface PlatformAuditInput {
  action: string;
  targetType?: string;
  targetId?: string;
  targetTenantId?: string | null;
  summary?: string;
  meta?: Record<string, unknown>;
}

/**
 * Append a tamper-evident, cross-tenant platform audit entry. Actor identity
 * is resolved server-side from the session; callers never supply it.
 * Non-throwing by design so audit failures cannot break the primary action.
 */
export async function recordPlatformAction(
  input: PlatformAuditInput,
): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (!profile) return;

    await supabase.from("platform_audit_log").insert({
      actor_id: user.id,
      actor_role: profile.role,
      action: input.action,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      target_tenant_id: input.targetTenantId ?? null,
      summary: input.summary ?? null,
      meta: (input.meta as Json) ?? ({} as Json),
    });
  } catch (err) {
    console.error("recordPlatformAction failed:", err);
  }
}

/** List recent platform audit entries (cross-tenant). */
export async function listPlatformAudit(
  limit = 50,
): Promise<PlatformAuditEntry[]> {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("platform_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (rows || []).map((r) => ({
    id: r.id,
    actorId: r.actor_id,
    actorRole: r.actor_role,
    action: r.action,
    targetType: r.target_type,
    targetId: r.target_id,
    targetTenantId: r.target_tenant_id,
    summary: r.summary,
    meta: (r.meta as Record<string, unknown>) || {},
    createdAt: r.created_at,
  }));
}
