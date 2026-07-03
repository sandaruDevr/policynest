import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { StaffProfile } from "@/types/profile";
import type { Sector, StaffRole, Locale } from "@/types/common";
import type { SystemRole } from "@/types/admin";

/**
 * Fetch the current user's profile from Supabase.
 *
 * Returns the StaffProfile shape expected by the UI, mapping database fields
 * to the richer type structure. Preferences are defaulted for Phase 1.
 */
export async function getMe(): Promise<StaffProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      `
      *,
      sites(id, name, address),
      staff_shifts(starts_at, ends_at, label)
    `,
    )
    .eq("id", user.id)
    .single();

  if (error || !profile) return null;

  // sites may come back as object (single FK) or array depending on Supabase version
  const rawSites = profile.sites as unknown;
  const site = Array.isArray(rawSites)
    ? (rawSites.length > 0 ? rawSites[0] as { id: string; name: string; address: string | null } : null)
    : (rawSites && typeof rawSites === "object" ? rawSites as { id: string; name: string; address: string | null } : null);
  const shift = Array.isArray(profile.staff_shifts) && profile.staff_shifts.length > 0 ? profile.staff_shifts[0] : null;

  // Map database fields to UI type
  return {
    id: profile.id,
    fullName: profile.full_name || "",
    preferredName: profile.preferred_name || profile.full_name || "",
    role: (profile.staff_role as StaffRole) || "care-worker",
    roleLabel: profile.role === "staff" ? "Staff" : profile.role,
    systemRole: (profile.role as SystemRole) || undefined,
    site: site
      ? { id: site.id, name: site.name, address: site.address || "" }
      : { id: "", name: "Unassigned", address: "" },
    sectors: (profile.sectors as Sector[]) || [],
    primarySector: (profile.primary_sector as Sector) || "aged-care",
    shift: shift
      ? {
          startsAt: shift.starts_at,
          endsAt: shift.ends_at,
          label: shift.label || "",
        }
      : undefined,
    locale: (profile.locale as Locale) || "en-AU",
    voicePreferences: {
      enableMicShortcut: false,
      ttsEnabled: false,
      slowerSpeech: false,
      preferredVoice: "system",
    },
    accessibility: {
      highContrast: false,
      largerText: false,
      reduceMotion: false,
      screenReaderHints: false,
    },
    notifications: {
      channels: { inApp: true, push: false, email: false },
      categories: {
        compliance: true,
        incidents: true,
        training: true,
        surveys: true,
        broadcasts: true,
      },
    },
    offline: {
      autoCacheEmergency: true,
      autoCacheBookmarked: true,
      storageBudgetMb: 100,
    },
    presence: (profile.presence as StaffProfile["presence"]) || "available",
    lastSyncAt: profile.last_sync_at || new Date().toISOString(),
    avatarUrl: profile.avatar_url || undefined,
  };
}

/**
 * Update user preferences (locale for Phase 1).
 */
export async function updatePreferences(
  patch: Partial<Pick<StaffProfile, "locale">>,
): Promise<StaffProfile | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  if (patch.locale) {
    const { error } = await supabase
      .from("profiles")
      .update({ locale: patch.locale })
      .eq("id", user.id);

    if (error) return null;
  }

  return getMe();
}
