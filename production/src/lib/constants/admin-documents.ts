import type {
  AdminDocumentStatus,
  DocumentOrigin,
  ValidationStatus,
} from "@/types/admin";

type Tone = "neutral" | "brand" | "accent" | "warn" | "critical" | "info" | "muted";

export const DOC_STATUS_LABEL: Record<AdminDocumentStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  published: "Published",
  superseded: "Superseded",
  archived: "Archived",
};

export const DOC_STATUS_TONE: Record<AdminDocumentStatus, Tone> = {
  draft: "muted",
  in_review: "warn",
  approved: "brand",
  published: "accent",
  superseded: "neutral",
  archived: "neutral",
};

export const DOC_ORIGIN_LABEL: Record<DocumentOrigin, string> = {
  organisation: "Organization",
  platform_shadow: "Platform (inherited)",
  master: "Master template",
};

export const VALIDATION_TONE: Record<ValidationStatus, Tone> = {
  pending: "muted",
  pass: "accent",
  warn: "warn",
  fail: "critical",
};

export const VALIDATION_LABEL: Record<ValidationStatus, string> = {
  pending: "Not validated",
  pass: "Passed",
  warn: "Warnings",
  fail: "Failed",
};

/** Lifecycle transitions available from each status (admin actions). */
export const STATUS_TRANSITIONS: Record<AdminDocumentStatus, AdminDocumentStatus[]> = {
  draft: ["in_review"],
  in_review: ["approved", "draft"],
  approved: ["published", "in_review"],
  published: ["archived", "superseded"],
  superseded: ["archived"],
  archived: ["draft"],
};

export const TRANSITION_LABEL: Partial<Record<AdminDocumentStatus, string>> = {
  in_review: "Submit for review",
  approved: "Approve",
  published: "Publish to staff",
  archived: "Archive",
  superseded: "Mark superseded",
  draft: "Return to draft",
};
