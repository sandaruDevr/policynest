import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/auth/roles";
import { PLATFORM_TENANT_ID } from "@/types/platform";
import { SYSTEM_ROLE_LABEL, type SystemRole } from "@/types/admin";
import type { PlatformContext } from "@/types/platform";

/**
 * Resolve the authenticated platform-admin context server-side.
 *
 * Returns `null` unless the caller is a `platform_admin` whose profile lives
 * inside the internal platform tenant. Identity is derived only from the
 * Supabase session cookie — never from request input. This mirrors the
 * PostgreSQL `current_user_is_platform_admin()` gate exactly.
 */
export async function getPlatformContext(): Promise<PlatformContext | null> {
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
  if (!isPlatformAdmin(profile.role)) return null;
  if (profile.tenant_id !== PLATFORM_TENANT_ID) return null;

  const role = profile.role as SystemRole;
  return {
    profile: {
      id: profile.id,
      fullName: profile.full_name || "Platform Admin",
      role,
      roleLabel: SYSTEM_ROLE_LABEL[role] ?? profile.role,
      avatarUrl: profile.avatar_url || undefined,
    },
  };
}

/**
 * Lightweight guard for platform route handlers. Returns the actor id + role,
 * or `null` if the caller is not an authorized platform admin.
 */
export async function requirePlatformAdmin(): Promise<{
  userId: string;
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

  if (!profile || !isPlatformAdmin(profile.role)) return null;
  if (profile.tenant_id !== PLATFORM_TENANT_ID) return null;

  return { userId: profile.id, role: profile.role as SystemRole };
}
