import { createClient } from "@/lib/supabase/server";
import type { QuickReferenceItem } from "@/types";
import type { Json } from "@/lib/supabase/database.types";

export async function listQuickRefs(): Promise<QuickReferenceItem[]> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return [];

  const { data: rows } = await supabase
    .from("quick_reference_pins")
    .select("*")
    .eq("profile_id", userId)
    .order("pinned_at", { ascending: false });

  return (rows || []).map((r) => ({
    id: r.id,
    kind: r.kind as QuickReferenceItem["kind"],
    title: r.title,
    subtitle: r.subtitle || undefined,
    pinnedAt: r.pinned_at,
    targetId: r.target_id || undefined,
    externalUrl: r.target_url || undefined,
    content: r.content || undefined,
  }));
}

export async function pinQuickRef(input: {
  kind: string;
  title: string;
  subtitle?: string;
  targetType?: string;
  targetId?: string;
  targetUrl?: string;
  content?: unknown;
}): Promise<QuickReferenceItem | null> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .single();
  if (!profile) return null;

  const { data: row, error } = await supabase
    .from("quick_reference_pins")
    .upsert({
      tenant_id: profile.tenant_id,
      profile_id: userId,
      kind: input.kind,
      title: input.title,
      subtitle: input.subtitle || null,
      target_type: input.targetType || null,
      target_id: input.targetId || null,
      target_url: input.targetUrl || null,
      content: (input.content as Json | null) ?? null,
      pinned_at: new Date().toISOString(),
    }, {
      onConflict: "profile_id,target_type,target_id",
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (error || !row) return null;

  return {
    id: row.id,
    kind: row.kind as QuickReferenceItem["kind"],
    title: row.title,
    subtitle: row.subtitle || undefined,
    pinnedAt: row.pinned_at,
    targetId: row.target_id || undefined,
    externalUrl: row.target_url || undefined,
    content: row.content || undefined,
  };
}

export async function getQuickRefByTarget(
  targetType: string,
  targetId: string,
): Promise<QuickReferenceItem | null> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return null;

  const { data: row } = await supabase
    .from("quick_reference_pins")
    .select("*")
    .eq("profile_id", userId)
    .eq("target_type", targetType)
    .eq("target_id", targetId)
    .single();

  if (!row) return null;

  return {
    id: row.id,
    kind: row.kind as QuickReferenceItem["kind"],
    title: row.title,
    subtitle: row.subtitle || undefined,
    pinnedAt: row.pinned_at,
    targetId: row.target_id || undefined,
    externalUrl: row.target_url || undefined,
    content: row.content || undefined,
  };
}

export async function unpinQuickRef(id: string): Promise<boolean> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return false;

  const { error } = await supabase
    .from("quick_reference_pins")
    .delete()
    .eq("id", id)
    .eq("profile_id", userId);

  return !error;
}
