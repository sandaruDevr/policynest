"use client";

import * as React from "react";
import { LayoutGrid, List, Search, Sparkles, X } from "lucide-react";
import { DocumentCard, DocumentRow } from "@/components/library/document-card";
import { EmptyState } from "@/components/shared/empty-state";
import type { DocumentSummary, DocumentType } from "@/types";
import { cn } from "@/lib/utils/cn";

type FilterKey = "all" | DocumentType;

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "policy", label: "Policies" },
  { key: "procedure", label: "Procedures" },
  { key: "guideline", label: "Guidelines" },
  { key: "form", label: "Forms" },
  { key: "emergency-protocol", label: "Emergency" },
];

export function LibraryBrowser({ documents }: { documents: DocumentSummary[] }) {
  const [query, setQuery] = React.useState("");
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [view, setView] = React.useState<"grid" | "list">("grid");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents.filter((d) => {
      if (filter !== "all" && d.type !== filter) return false;
      if (!q) return true;
      return [d.title, d.category, ...d.tags].some((s) => s.toLowerCase().includes(q));
    });
  }, [documents, query, filter]);

  const featured = documents
    .filter((d) => d.recentlyUsedByAI || d.bookmarked)
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-xl flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search the library by title, tag, or category…"
            className="h-11 w-full rounded-xl border border-hairline-strong bg-canvas-inset/70 pl-10 pr-10 text-sm text-ink placeholder:text-ink-dim focus:border-brand-400/60 focus:outline-none transition-colors"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-ink-muted hover:bg-white/5 hover:text-ink"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="inline-flex items-center rounded-xl border border-hairline bg-canvas-inset/60 p-1 self-start">
          {(["grid", "list"] as const).map((v) => {
            const Icon = v === "grid" ? LayoutGrid : List;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                aria-pressed={view === v}
                className={cn(
                  "grid h-7 w-9 place-items-center rounded-lg transition-colors",
                  view === v
                    ? "bg-surface-strong text-ink shadow-elev1"
                    : "text-ink-muted hover:text-ink",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.key
                ? "border-brand-500/40 bg-brand-500/12 text-brand-200"
                : "border-hairline bg-canvas-inset/40 text-ink-muted hover:text-ink hover:border-hairline-strong",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {!query && filter === "all" && featured.length > 0 ? (
        <section aria-labelledby="featured-heading" className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-brand-300" />
            <h2 id="featured-heading" className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-dim">
              Bookmarked & frequently cited
            </h2>
          </div>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((d) => (
              <li key={d.id} className="h-full">
                <DocumentCard doc={d} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section aria-label="Results">
        {filtered.length === 0 ? (
          <EmptyState
            title="No documents match"
            description="Try a broader search term or clear filters."
          />
        ) : view === "grid" ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((d) => (
              <li key={d.id} className="h-full">
                <DocumentCard doc={d} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="space-y-2">
            {filtered.map((d) => (
              <li key={d.id}>
                <DocumentRow doc={d} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
