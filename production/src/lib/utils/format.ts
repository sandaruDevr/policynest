import type { ISODateString } from "@/types";

/** Date formatting helpers. Stable across SSR/CSR (uses fixed locale & UTC where needed). */
export function formatDate(iso: ISODateString, locale = "en-AU"): string {
  return new Date(iso).toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: ISODateString, locale = "en-AU"): string {
  return new Date(iso).toLocaleString(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(iso: ISODateString, locale = "en-AU"): string {
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const RTF = new Intl.RelativeTimeFormat("en-AU", { numeric: "auto" });
const UNITS: { unit: Intl.RelativeTimeFormatUnit; ms: number }[] = [
  { unit: "year", ms: 31536000000 },
  { unit: "month", ms: 2628000000 },
  { unit: "week", ms: 604800000 },
  { unit: "day", ms: 86400000 },
  { unit: "hour", ms: 3600000 },
  { unit: "minute", ms: 60000 },
  { unit: "second", ms: 1000 },
];

export function timeAgo(iso: ISODateString, now: number = Date.now()): string {
  const diff = new Date(iso).getTime() - now;
  for (const { unit, ms } of UNITS) {
    if (Math.abs(diff) >= ms || unit === "second") {
      return RTF.format(Math.round(diff / ms), unit);
    }
  }
  return RTF.format(0, "second");
}

export function pluralize(count: number, singular: string, plural?: string): string {
  return `${count} ${count === 1 ? singular : plural ?? `${singular}s`}`;
}

export function clampPercent(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
