import type { ID, Sector, StaffRole, Locale } from "./common";
import type { SystemRole } from "./admin";

export interface StaffProfile {
  id: ID;
  fullName: string;
  preferredName: string;
  role: StaffRole;
  roleLabel: string;
  systemRole?: SystemRole;
  site: { id: ID; name: string; address: string };
  sectors: Sector[];
  primarySector: Sector;
  shift?: { startsAt: string; endsAt: string; label: string };
  locale: Locale;
  voicePreferences: VoicePreferences;
  accessibility: AccessibilityPreferences;
  notifications: NotificationPreferences;
  offline: OfflinePreferences;
  presence: "available" | "in-care" | "break" | "offline";
  lastSyncAt: string;
  avatarUrl?: string;
}

export interface VoicePreferences {
  enableMicShortcut: boolean;
  ttsEnabled: boolean;
  slowerSpeech: boolean;
  preferredVoice: "system" | "warm" | "neutral";
}

export interface AccessibilityPreferences {
  highContrast: boolean;
  largerText: boolean;
  reduceMotion: boolean;
  screenReaderHints: boolean;
}

export interface NotificationPreferences {
  channels: { inApp: boolean; push: boolean; email: boolean };
  categories: {
    compliance: boolean;
    incidents: boolean;
    training: boolean;
    surveys: boolean;
    broadcasts: boolean;
  };
  quietHours?: { from: string; to: string };
}

export interface OfflinePreferences {
  autoCacheEmergency: boolean;
  autoCacheBookmarked: boolean;
  storageBudgetMb: number;
}
