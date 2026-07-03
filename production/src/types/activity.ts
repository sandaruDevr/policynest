import type { ID, ISODateString } from "./common";

export type ActivityKind =
  | "ai-question"
  | "incident-submitted"
  | "training-completed"
  | "policy-acknowledged"
  | "quick-ref-pinned"
  | "credential-updated"
  | "survey-submitted"
  | "feedback-submitted"
  | "bookmark-toggle";

export interface ActivityItem {
  id: ID;
  kind: ActivityKind;
  at: ISODateString;
  title: string;
  meta?: string;
  targetId?: ID;
}
