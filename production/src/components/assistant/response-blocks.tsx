import * as React from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  Phone,
  Shield,
  ShieldAlert,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";
import type {
  Citation,
  ConfidenceLevel,
  GuidanceBlock,
} from "@/types";
import { Badge } from "@/components/ui/badge";

const ICON_MAP: Record<string, LucideIcon> = {
  shield: Shield,
  stethoscope: Stethoscope,
  phone: Phone,
  activity: Activity,
  "file-text": FileText,
  "clipboard-list": ClipboardList,
  "alert-triangle": AlertTriangle,
};

export function ConfidenceTag({ level }: { level: ConfidenceLevel }) {
  const tone = level === "high" ? "accent" : level === "medium" ? "warn" : "critical";
  const label = level === "high" ? "High confidence" : level === "medium" ? "Medium confidence" : "Low confidence — verify";
  return <Badge tone={tone} size="sm">{label}</Badge>;
}

export function SummaryBlock({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-canvas-inset/40 p-3.5 sm:p-4">
      <p className="font-sans text-[15px] leading-7 text-ink text-balance tracking-wide">{text}</p>
    </div>
  );
}

export function StepsBlock({
  steps,
}: {
  steps: { index: number; text: string; iconKey?: string; caution?: string }[];
}) {
  return (
    <ol className="space-y-1.5">
      {steps.map((s) => {
        const Icon = s.iconKey ? ICON_MAP[s.iconKey] ?? CheckCircle2 : CheckCircle2;
        return (
          <li
            key={s.index}
            className="group flex items-start gap-3 rounded-xl border border-hairline bg-canvas-inset/40 p-3 transition-colors hover:bg-white/[.03]"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-500/12 ring-1 ring-brand-500/30 text-brand-200">
              <span className="font-display text-xs font-semibold">{s.index}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-sans flex items-start gap-2 text-[14px] leading-6 text-ink">
                {Icon ? <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-muted" /> : null}
                <span className="text-balance">{s.text}</span>
              </p>
              {s.caution ? (
                <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-warn-400">
                  <AlertTriangle className="h-3 w-3" />
                  {s.caution}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function CitationsBlock({ citations }: { citations: Citation[] }) {
  const [open, setOpen] = React.useState(false);

  // Group citations by documentId
  const grouped = citations.reduce((acc, c) => {
    if (!acc[c.documentId]) acc[c.documentId] = [];
    acc[c.documentId].push(c);
    return acc;
  }, {} as Record<string, Citation[]>);

  const docCount = Object.keys(grouped).length;

  return (
    <div className="rounded-2xl border border-hairline bg-canvas-inset/30 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-brand-500/[.05]"
      >
        <BookOpen className="h-4 w-4 text-brand-300 shrink-0" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim">
          Sources
        </span>
        <span className="ml-2 inline-flex items-center justify-center rounded-full bg-surface-strong px-1.5 py-0.5 text-[10px] font-medium text-ink-dim ring-1 ring-hairline">
          {docCount}
        </span>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] text-ink-dim">
          <span>{open ? "Hide" : "Show"}</span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-ink-dim transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && (
        <div className="border-t border-hairline px-4 pb-2.5">
          <ul className="space-y-1.5 pt-2">
            {Object.entries(grouped).map(([docId, docs]) => {
              const first = docs[0];
              return (
                <li key={docId}>
                  <Link
                    href={`/app/library/${docId}`}
                    className="group flex items-start gap-3 rounded-xl border border-hairline bg-canvas-inset/40 p-2.5 transition-colors hover:border-brand-500/30 hover:bg-brand-500/[.05]"
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-surface-strong ring-1 ring-hairline-strong">
                      <BookOpen className="h-3.5 w-3.5 text-brand-300" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-ink">{first.documentTitle}</span>
                        <Badge tone="muted" size="sm">v{first.version}</Badge>
                      </span>
                      <span className="block truncate text-[11px] text-ink-dim">
                        {docs.length} section{docs.length > 1 ? "s" : ""}
                      </span>
                      {docs.length > 1 && (
                        <span className="mt-1.5 flex flex-wrap gap-1">
                          {docs.map((c) =>
                            c.sectionTitle ? (
                              <span
                                key={c.id}
                                className="inline-flex items-center rounded-md bg-surface-subtle px-1.5 py-0.5 text-[10px] text-ink-muted ring-1 ring-hairline-subtle"
                              >
                                § {c.sectionTitle}
                              </span>
                            ) : null
                          )}
                        </span>
                      )}
                      {docs.length === 1 && docs[0].sectionTitle ? (
                        <span className="mt-1 block truncate text-[11px] text-ink-dim">
                          § {docs[0].sectionTitle}
                        </span>
                      ) : null}
                      {docs.length === 1 && docs[0].snippet ? (
                        <span className="mt-1 block line-clamp-2 text-[11px] leading-4 text-ink-muted">
                          “{docs[0].snippet}”
                        </span>
                      ) : null}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0 self-center text-ink-dim transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

export function WarningBlock({
  text,
  severity,
}: {
  text: string;
  severity: "info" | "warn" | "critical";
}) {
  const tone =
    severity === "critical"
      ? "border-critical-500/30 bg-critical-500/8 text-critical-300"
      : severity === "warn"
        ? "border-warn-500/30 bg-warn-500/8 text-warn-300"
        : "border-info-500/30 bg-info-500/8 text-info-300";
  const Icon = severity === "critical" ? ShieldAlert : AlertTriangle;
  return (
    <div className={`flex items-start gap-3 rounded-2xl border p-3.5 ${tone}`}>
      <Icon className="h-4 w-4 shrink-0" />
      <p className="text-sm leading-relaxed">{text}</p>
    </div>
  );
}

export function RelatedDocsBlock({ documents }: { documents: { id: string; title: string }[] }) {
  if (documents.length === 0) return null;
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim">
        Related
      </p>
      <ul className="flex flex-wrap gap-2">
        {documents.map((d) => (
          <li key={d.id}>
            <Link
              href={`/app/library/${d.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas-inset/40 px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-brand-500/30 hover:text-ink"
            >
              <FileText className="h-3 w-3" />
              {d.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FormSuggestionBlock({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-accent-500/30 bg-accent-500/8 p-3.5">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-500/15 ring-1 ring-accent-500/30">
        <ClipboardList className="h-4 w-4 text-accent-300" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
      </div>
    </div>
  );
}

export function renderBlock(block: GuidanceBlock, allDocsTitleById?: Record<string, string>) {
  switch (block.kind) {
    case "summary":
      return <SummaryBlock text={block.text} />;
    case "steps":
      return <StepsBlock steps={block.steps} />;
    case "citations":
      return <CitationsBlock citations={block.citations} />;
    case "warning":
      return <WarningBlock text={block.text} severity={block.severity} />;
    case "related-docs":
      return (
        <RelatedDocsBlock
          documents={block.documentIds.map((id) => ({
            id,
            title: allDocsTitleById?.[id] ?? id,
          }))}
        />
      );
    case "form-suggestion":
      return <FormSuggestionBlock title={block.title} description={block.description} />;
    case "escalation":
      return (
        <WarningBlock
          severity="critical"
          text={`Escalate now: ${block.reason}. Contact ${block.suggestedContacts.join(", ")}.`}
        />
      );
  }
}
