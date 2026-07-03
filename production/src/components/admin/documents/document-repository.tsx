"use client";

import * as React from "react";
import Link from "next/link";
import { Search, FileText, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import {
  DOC_ORIGIN_LABEL,
  DOC_STATUS_LABEL,
  DOC_STATUS_TONE,
} from "@/lib/constants/admin-documents";
import { CreateDocumentDialog } from "@/components/admin/documents/create-document-dialog";
import type { AdminDocumentStatus, AdminDocumentSummary } from "@/types/admin";

const STATUS_FILTERS: Array<{ key: AdminDocumentStatus | "all"; label: string }> = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "in_review", label: "In review" },
  { key: "approved", label: "Approved" },
  { key: "published", label: "Published" },
  { key: "archived", label: "Archived" },
];

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function DocumentRepository({
  documents,
}: {
  documents: AdminDocumentSummary[];
}) {
  const [status, setStatus] = React.useState<AdminDocumentStatus | "all">("all");
  const [search, setSearch] = React.useState("");

  const counts = React.useMemo(() => {
    const map: Record<string, number> = { all: documents.length };
    for (const d of documents) map[d.status] = (map[d.status] || 0) + 1;
    return map;
  }, [documents]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      if (status !== "all" && d.status !== status) return false;
      if (q && !d.title.toLowerCase().includes(q) && !(d.category || "").toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [documents, status, search]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents…"
            className="pl-9"
          />
        </div>
        <CreateDocumentDialog />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
              status === f.key
                ? "border-brand-500/50 bg-brand-500/12 text-brand-200"
                : "border-hairline bg-surface text-ink-muted hover:text-ink",
            )}
          >
            {f.label}
            <span className="text-ink-dim">{counts[f.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-ink-dim" />
          <p className="mt-3 text-sm text-ink-muted">
            {documents.length === 0
              ? "No documents yet. Create your first policy or procedure."
              : "No documents match your filters."}
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-hairline overflow-hidden p-0">
          {filtered.map((d) => (
            <Link
              key={d.id}
              href={`/admin/documents/${d.id}`}
              className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-white/[.03] sm:px-5"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-strong ring-1 ring-hairline-strong">
                <FileText className="h-5 w-5 text-brand-300" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="line-clamp-1 text-sm font-medium text-ink">
                    {d.title}
                  </p>
                  {d.origin !== "organisation" ? (
                    <Badge tone="info" size="sm">
                      {DOC_ORIGIN_LABEL[d.origin]}
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  {d.documentType || "document"}
                  {d.category ? ` · ${d.category}` : ""} · {d.version} · updated{" "}
                  {formatDate(d.updatedAt)}
                </p>
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                {d.acknowledgementRequired ? (
                  <Badge tone="warn" size="sm">
                    Ack
                  </Badge>
                ) : null}
                <Badge tone={DOC_STATUS_TONE[d.status]} size="sm">
                  {DOC_STATUS_LABEL[d.status]}
                </Badge>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-dim" />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
