import type { ID, ISODateString } from "./common";

export type QuickRefKind =
  | "policy"
  | "procedure"
  | "form"
  | "emergency"
  | "ai-answer"
  | "site-link";

export interface QuickReferenceItem {
  id: ID;
  kind: QuickRefKind;
  title: string;
  subtitle?: string;
  iconKey?: string;
  pinnedAt: ISODateString;
  targetId?: ID;
  externalUrl?: string;
  content?: unknown;
}
