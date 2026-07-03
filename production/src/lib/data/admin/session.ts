import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isAdminRole, isOrgAdmin } from "@/lib/auth/roles";
import { SYSTEM_ROLE_LABEL, type AdminContext, type SystemRole } from "@/types/admin";

/**
 * Resolve the authenticated organization-admin context server-side.
 *
 * Returns `null` when the user is unauthenticated, has no profile, or does
 * not hold an admin-grade system role. All identity is derived from the
 * Supabase session cookie — never from request input.
 */
export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url, tenant_id")
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;
  if (!isAdminRole(profile.role)) return null;

  const [{ data: tenant }, { data: sites }] = await Promise.all([
    supabase
      .from("tenants")
      .select("id, name, industry, country, state_or_territory")
      .eq("id", profile.tenant_id)
      .single(),
    supabase
      .from("sites")
      .select("id, name, address, code")
      .eq("tenant_id", profile.tenant_id)
      .order("name", { ascending: true }),
  ]);

  if (!tenant) return null;

  const role = profile.role as SystemRole;

  return {
    profile: {
      id: profile.id,
      fullName: profile.full_name || "Administrator",
      role,
      roleLabel: SYSTEM_ROLE_LABEL[role] ?? profile.role,
      avatarUrl: profile.avatar_url || undefined,
    },
    tenant: {
      id: tenant.id,
      name: tenant.name,
      industry: tenant.industry,
      country: tenant.country,
      stateOrTerritory: tenant.state_or_territory,
    },
    sites: (sites || []).map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      code: s.code,
    })),
  };
}

/**
 * Lightweight guard for route handlers: returns the admin's id, tenant and
 * role, or `null` if the caller is not an authorized admin.
 */
export async function requireAdmin(): Promise<{
  userId: string;
  tenantId: string;
  role: SystemRole;
} | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile || !isAdminRole(profile.role)) return null;

  return {
    userId: profile.id,
    tenantId: profile.tenant_id,
    role: profile.role as SystemRole,
  };
}

/**
 * Guard for org-admin-only endpoints (excludes compliance_manager).
 * Returns null if the caller is not an org-admin or platform-admin.
 */
export async function requireOrgAdmin(): Promise<{
  userId: string;
  tenantId: string;
  role: SystemRole;
} | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, tenant_id")
    .eq("id", user.id)
    .single();

  if (!profile || !isOrgAdmin(profile.role)) return null;

  return {
    userId: profile.id,
    tenantId: profile.tenant_id,
    role: profile.role as SystemRole,
  };
}
