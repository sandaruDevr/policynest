import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin/session";
import type { AdminSiteDetail } from "@/types/admin";

/** List tenant sites with workforce counts. */
export async function listAdminSites(): Promise<AdminSiteDetail[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const supabase = createClient();
  const [{ data: sites }, { data: profiles }] = await Promise.all([
    supabase
      .from("sites")
      .select("*")
      .eq("tenant_id", admin.tenantId)
      .order("name", { ascending: true }),
    supabase
      .from("profiles")
      .select("site_id")
      .eq("tenant_id", admin.tenantId),
  ]);

  const counts = new Map<string, number>();
  for (const p of profiles || []) {
    if (p.site_id) counts.set(p.site_id, (counts.get(p.site_id) || 0) + 1);
  }

  return (sites || []).map((s) => ({
    id: s.id,
    name: s.name,
    address: s.address,
    code: s.code,
    userCount: counts.get(s.id) || 0,
    createdAt: s.created_at,
  }));
}

export interface SiteInput {
  name: string;
  code?: string | null;
  address?: string | null;
}

export async function createSite(
  input: SiteInput,
): Promise<{ id: string } | null> {
  const admin = await requireAdmin();
  if (!admin) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("sites")
    .insert({
      tenant_id: admin.tenantId,
      name: input.name,
      code: input.code ?? null,
      address: input.address ?? null,
    })
    .select("id")
    .single();

  if (error || !data) return null;
  return { id: data.id };
}

export async function updateSite(
  id: string,
  input: SiteInput,
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const supabase = createClient();
  const { error } = await supabase
    .from("sites")
    .update({
      name: input.name,
      code: input.code ?? null,
      address: input.address ?? null,
    })
    .eq("id", id)
    .eq("tenant_id", admin.tenantId);

  return !error;
}

/** Delete a site. Detaches any assigned users first to avoid orphan refs. */
export async function deleteSite(id: string): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const supabase = createClient();
  await supabase
    .from("profiles")
    .update({ site_id: null })
    .eq("site_id", id)
    .eq("tenant_id", admin.tenantId);

  const { error } = await supabase
    .from("sites")
    .delete()
    .eq("id", id)
    .eq("tenant_id", admin.tenantId);

  return !error;
}
