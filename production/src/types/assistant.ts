import type { ID, ISODateString, Locale } from "./common";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface Citation {
  id: ID;
  documentId: ID;
  documentTitle: string;
  sectionAnchor?: string;
  sectionTitle?: string;
  snippet: string;
  version: string;
  effectiveAt: ISODateString;
}

export interface GuidanceStep {
  index: number;
  text: string;
  iconKey?: string;
  caution?: string;
}

export type GuidanceBlock =
  | { kind: "summary"; text: string }
  | { kind: "steps"; steps: GuidanceStep[] }
  | { kind: "citations"; citations: Citation[] }
  | { kind: "warning"; text: string; severity: "info" | "warn" | "critical" }
  | { kind: "form-suggestion"; formId: ID; title: string; description: string }
  | { kind: "related-docs"; documentIds: ID[] }
  | { kind: "escalation"; reason: string; suggestedContacts: string[] };

export type AssistantNextAction =
  | { kind: "ask-followup"; prompt: string }
  | { kind: "open-document"; documentId: ID; sectionAnchor?: string }
  | { kind: "start-incident"; presetType?: string }
  | { kind: "pin-quick-ref" }
  | { kind: "share-internal" }
  | { kind: "rephrase" };

export interface GuidanceQuery {
  id: ID;
  text: string;
  locale: Locale;
  mode: "standard" | "explain-like-im-new";
  voice: boolean;
  contextHints?: { documentId?: ID; topicTag?: string };
  createdAt: ISODateString;
}

export interface GuidanceResponse {
  id: ID;
  queryId: ID;
  createdAt: ISODateString;
  confidence: ConfidenceLevel;
  escalate: boolean;
  blocks: GuidanceBlock[];
  nextActions: AssistantNextAction[];
  policyNotFound?: boolean;
  offline?: boolean;
}

export interface ConversationTurn {
  query: GuidanceQuery;
  response?: GuidanceResponse;
  state:
    | "idle"
    | "listening"
    | "voice-processing"
    | "loading"
    | "streaming"
    | "complete"
    | "error";
}

export interface SuggestedPrompt {
  id: ID;
  label: string;
  intent: string;
  iconKey?: string;
}
