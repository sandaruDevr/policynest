import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { AdminAuditEntry } from "@/types/admin";

type Json = Database["public"]["Tables"]["admin_audit_log"]["Row"]["meta"];

interface AuditInput {
  action: string;
  targetType?: string;
  targetId?: string;
  summary?: string;
  meta?: Record<string, unknown>;
}

/**
 * Append a tamper-evident admin audit entry. Identity (actor + tenant) is
 * resolved server-side from the session; callers never supply it. Non-throwing
 * by design so audit failures cannot break the primary action — log and move on.
 */
export async function recordAdminAction(input: AuditInput): Promise<void> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id, role")
      .eq("id", user.id)
      .single();
    if (!profile) return;

    await supabase.from("admin_audit_log").insert({
      tenant_id: profile.tenant_id,
      actor_id: user.id,
      actor_role: profile.role,
      action: input.action,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      summary: input.summary ?? null,
      meta: (input.meta as Json) ?? ({} as Json),
    });
  } catch (err) {
    console.error("recordAdminAction failed:", err);
  }
}

/** List recent audit entries for the current admin's tenant. */
export async function listAdminAudit(limit = 50): Promise<AdminAuditEntry[]> {
  const supabase = createClient();
  const { data: rows } = await supabase
    .from("admin_audit_log")
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
    summary: r.summary,
    meta: (r.meta as Record<string, unknown>) || {},
    createdAt: r.created_at,
  }));
}
