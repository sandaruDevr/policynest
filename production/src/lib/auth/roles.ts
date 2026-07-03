import { ADMIN_ROLES, type SystemRole } from "@/types/admin";

/**
 * Returns true when the supplied system role may access the
 * Organization Admin surface.
 */
export function isAdminRole(role: string | null | undefined): role is SystemRole {
  return !!role && ADMIN_ROLES.includes(role as SystemRole);
}

/** Returns true for the platform-admin tier (future Super Admin). */
export function isPlatformAdmin(role: string | null | undefined): boolean {
  return role === "platform_admin";
}

/** Returns true for org-admin and platform-admin (excludes compliance_manager). */
export function isOrgAdmin(role: string | null | undefined): boolean {
  return role === "organisation_admin" || role === "platform_admin";
}
