import type { ID, ISODateString } from "./common";

export type NotificationCategory =
  | "compliance"
  | "training"
  | "incident"
  | "broadcast"
  | "survey"
  | "system";

export type NotificationLevel = "info" | "warn" | "critical";

export interface NotificationItem {
  id: ID;
  category: NotificationCategory;
  level: NotificationLevel;
  title: string;
  body?: string;
  at: ISODateString;
  read: boolean;
  href?: string;
  actionLabel?: string;
}
