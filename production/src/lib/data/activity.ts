import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type { ActivityItem } from "@/types";

type Json = Database["public"]["Tables"]["activity_log"]["Row"]["meta"];

export async function listActivity(limit = 20): Promise<ActivityItem[]> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data: rows } = await supabase
    .from("activity_log")
    .select("*")
    .eq("profile_id", userId)
    .order("at", { ascending: false })
    .limit(limit);

  return (rows || []).map((r) => ({
    id: r.id,
    kind: r.kind as ActivityItem["kind"],
    at: r.at,
    title: r.title,
  }));
}

export async function appendActivity(
  kind: ActivityItem["kind"],
  title: string,
  options?: {
    targetId?: string;
    meta?: Record<string, unknown>;
  }
): Promise<void> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .single();
  if (!profile) return;

  await supabase.from("activity_log").insert({
    tenant_id: profile.tenant_id,
    profile_id: userId,
    kind,
    title,
    target_id: options?.targetId || null,
    meta: (options?.meta as Json) || ({} as Json),
  });
}
