import "server-only";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/data/admin/session";
import { SYSTEM_ROLE_LABEL, type SystemRole } from "@/types/admin";
import type { AdminUser, UserStatus } from "@/types/admin";

function mapRole(role: string | null): SystemRole {
  if (
    role === "organisation_admin" ||
    role === "compliance_manager" ||
    role === "platform_admin"
  ) {
    return role;
  }
  return "staff";
}

/** List all workforce profiles within the admin's tenant. */
export async function listAdminUsers(): Promise<AdminUser[]> {
  const admin = await requireAdmin();
  if (!admin) return [];

  const supabase = createClient();
  const [{ data: profiles }, { data: sites }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("tenant_id", admin.tenantId)
      .order("created_at", { ascending: false }),
    supabase.from("sites").select("id, name").eq("tenant_id", admin.tenantId),
  ]);

  const siteName = new Map<string, string>();
  for (const s of sites || []) siteName.set(s.id, s.name);

  return (profiles || []).map((p) => {
    const role = mapRole(p.role);
    return {
      id: p.id,
      fullName: p.full_name,
      preferredName: p.preferred_name,
      email: p.email,
      role,
      roleLabel: SYSTEM_ROLE_LABEL[role],
      staffRole: p.staff_role,
      jobTitle: p.job_title,
      phone: p.phone,
      status: (p.status as UserStatus) ?? "active",
      siteId: p.site_id,
      siteName: p.site_id ? siteName.get(p.site_id) ?? null : null,
      primarySector: p.primary_sector,
      createdAt: p.created_at,
    };
  });
}

export interface UpdateUserInput {
  fullName?: string | null;
  role?: SystemRole;
  staffRole?: string | null;
  jobTitle?: string | null;
  phone?: string | null;
  status?: UserStatus;
  siteId?: string | null;
  primarySector?: string | null;
}

/** Update a tenant user's profile (role, site, status, etc.). */
export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<boolean> {
  const admin = await requireAdmin();
  if (!admin) return false;

  const supabase = createClient();
  const update: Record<string, unknown> = {};
  if (input.fullName !== undefined) update.full_name = input.fullName;
  if (input.role !== undefined) update.role = input.role;
  if (input.staffRole !== undefined) update.staff_role = input.staffRole;
  if (input.jobTitle !== undefined) update.job_title = input.jobTitle;
  if (input.phone !== undefined) update.phone = input.phone;
  if (input.status !== undefined) update.status = input.status;
  if (input.siteId !== undefined) update.site_id = input.siteId;
  if (input.primarySector !== undefined)
    update.primary_sector = input.primarySector;

  const { error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", id)
    .eq("tenant_id", admin.tenantId);

  return !error;
}
