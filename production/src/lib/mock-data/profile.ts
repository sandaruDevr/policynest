import type { StaffProfile } from "@/types";

export const MOCK_PROFILE: StaffProfile = {
  id: "stf_8821",
  fullName: "Aisha Karimov",
  preferredName: "Aisha",
  role: "registered-nurse",
  roleLabel: "Registered Nurse",
  site: {
    id: "site_brunswick",
    name: "Brunswick Care Community",
    address: "212 Sydney Rd, Brunswick VIC 3056",
  },
  sectors: ["aged-care", "home-care"],
  primarySector: "aged-care",
  shift: {
    startsAt: "2025-05-23T07:00:00+10:00",
    endsAt: "2025-05-23T15:00:00+10:00",
    label: "Morning shift · Wing C",
  },
  locale: "en-AU",
  voicePreferences: {
    enableMicShortcut: true,
    ttsEnabled: false,
    slowerSpeech: false,
    preferredVoice: "warm",
  },
  accessibility: {
    highContrast: false,
    largerText: false,
    reduceMotion: false,
    screenReaderHints: true,
  },
  notifications: {
    channels: { inApp: true, push: true, email: false },
    categories: {
      compliance: true,
      incidents: true,
      training: true,
      surveys: true,
      broadcasts: true,
    },
    quietHours: { from: "22:00", to: "06:00" },
  },
  offline: {
    autoCacheEmergency: true,
    autoCacheBookmarked: true,
    storageBudgetMb: 200,
  },
  presence: "available",
  lastSyncAt: "2025-05-23T08:42:00+10:00",
};
