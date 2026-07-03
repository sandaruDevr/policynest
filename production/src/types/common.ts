/** Generic ID alias to keep IDs typed and grep-able. */
export type ID = string;

/** ISO timestamp string. */
export type ISODateString = string;

export type Sector =
  | "aged-care"
  | "ndis"
  | "home-care"
  | "retirement-living"
  | "universal";

export type StaffRole =
  | "care-worker"
  | "registered-nurse"
  | "enrolled-nurse"
  | "team-leader"
  | "support-worker"
  | "lifestyle-coordinator"
  | "kitchen"
  | "maintenance";

export type Severity = "low" | "medium" | "high" | "critical";

export type Status =
  | "draft"
  | "submitted"
  | "in-review"
  | "approved"
  | "closed"
  | "completed"
  | "overdue"
  | "due-soon";

export type Locale = "en-AU" | "zh-CN" | "ar" | "vi" | "es" | "hi";

export interface Localized<T = string> {
  readonly value: T;
  readonly locale?: Locale;
}

export interface Paged<T> {
  items: T[];
  total: number;
  cursor?: string | null;
}

export interface ApiResult<T> {
  data: T;
  meta?: { fetchedAt: ISODateString; stale?: boolean };
}
