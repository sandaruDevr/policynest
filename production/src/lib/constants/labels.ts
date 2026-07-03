import type { Locale, Sector, Severity } from "@/types";

export const SECTOR_LABEL: Record<Sector, string> = {
  "aged-care": "Aged Care",
  ndis: "NDIS",
  "home-care": "Home Care",
  "retirement-living": "Retirement Living",
  universal: "Universal",
};

export const LOCALE_LABEL: Record<Locale, string> = {
  "en-AU": "English (AU)",
  "zh-CN": "中文",
  ar: "العربية",
  vi: "Tiếng Việt",
  es: "Español",
  hi: "हिन्दी",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const APP_NAME = "CareSuite";
export const APP_TAGLINE = "Staff Workspace";
