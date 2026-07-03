import Link from "next/link";
import {
  Bookmark,
  BookOpen,
  ClipboardList,
  Cloud,
  FileText,
  Shield,
  Siren,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/shared/status-pill";
import type { DocumentSummary, DocumentType } from "@/types";
import { formatDate } from "@/lib/utils/format";

const TYPE_ICON: Record<DocumentType, LucideIcon> = {
  policy: BookOpen,
  procedure: ClipboardList,
  form: FileText,
  guideline: Shield,
  "fact-sheet": FileText,
  "emergency-protocol": Siren,
};

const TYPE_TONE: Record<DocumentType, string> = {
  policy: "bg-brand-500/12 ring-brand-500/30 text-brand-200",
  procedure: "bg-info-500/10 ring-info-500/30 text-info-400",
  form: "bg-accent-500/10 ring-accent-500/30 text-accent-300",
  guideline: "bg-brand-500/10 ring-brand-500/30 text-brand-200",
  "fact-sheet": "bg-warn-500/10 ring-warn-500/30 text-warn-400",
  "emergency-protocol": "bg-critical-500/12 ring-critical-500/30 text-critical-300",
};

const TYPE_LABEL: Record<DocumentType, string> = {
  policy: "Policy",
  procedure: "Procedure",
  form: "Form",
  guideline: "Guideline",
  "fact-sheet": "Fact sheet",
  "emergency-protocol": "Emergency protocol",
};

export function DocumentCard({ doc }: { doc: DocumentSummary }) {
  const Icon = TYPE_ICON[doc.type] || FileText;
  const tone = TYPE_TONE[doc.type] || TYPE_TONE["fact-sheet"];
  return (
    <Link
      href={`/app/library/${doc.id}`}
      className="group flex h-full flex-col gap-3 rounded-2xl border border-hairline bg-canvas-raised/60 p-4 transition-all hover:border-hairline-strong hover:bg-white/[.02]"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`grid h-10 w-10 place-items-center rounded-xl ring-1 ${tone}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="flex items-center gap-1">
          {doc.bookmarked ? (
            <Bookmark className="h-3.5 w-3.5 text-brand-300" aria-label="Bookmarked" />
          ) : null}
          {doc.offlineAvailable ? (
            <Cloud className="h-3.5 w-3.5 text-accent-300" aria-label="Offline ready" />
          ) : null}
          {doc.recentlyUsedByAI ? (
            <Sparkles className="h-3.5 w-3.5 text-brand-300" aria-label="Recently used by AI" />
          ) : null}
        </div>
      </div>

      <div className="flex-1">
        <p className="font-display text-sm font-semibold leading-snug text-ink line-clamp-2">
          {doc.title}
        </p>
        <p className="mt-1 text-[11px] text-ink-dim">{doc.category}</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Badge tone="muted" size="sm">
          {TYPE_LABEL[doc.type] || "Document"} · v{doc.version}
        </Badge>
        {doc.status === "updated" ? (
          <StatusPill tone="brand" label="Updated" showDot />
        ) : (
          <span className="text-[11px] text-ink-dim">{formatDate(doc.updatedAt)}</span>
        )}
      </div>
    </Link>
  );
}

export function DocumentRow({ doc }: { doc: DocumentSummary }) {
  const Icon = TYPE_ICON[doc.type] || FileText;
  const tone = TYPE_TONE[doc.type] || TYPE_TONE["fact-sheet"];
  return (
    <Link
      href={`/app/library/${doc.id}`}
      className="group flex items-center gap-4 rounded-xl border border-hairline bg-canvas-raised/40 p-3 transition-colors hover:border-hairline-strong hover:bg-white/[.02]"
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 ${tone}`}
      >
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-ink">{doc.title}</span>
        <span className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-dim">
          {TYPE_LABEL[doc.type] || "Document"} · v{doc.version} · Updated {formatDate(doc.updatedAt)}
        </span>
      </span>
      <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
        {doc.bookmarked ? (
          <Bookmark className="h-3.5 w-3.5 text-brand-300" />
        ) : null}
        {doc.offlineAvailable ? (
          <Cloud className="h-3.5 w-3.5 text-accent-300" />
        ) : null}
        {doc.recentlyUsedByAI ? (
          <Sparkles className="h-3.5 w-3.5 text-brand-300" />
        ) : null}
      </div>
    </Link>
  );
}
