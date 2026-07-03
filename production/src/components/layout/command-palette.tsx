"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Command, Search, ArrowRight, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { STAFF_ROUTES } from "@/lib/route-config/routes";
import { cn } from "@/lib/utils/cn";
import type { DocumentSummary } from "@/types";

export function CommandPaletteTrigger() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group flex w-full max-w-sm items-center gap-2.5 rounded-xl border border-hairline-strong bg-canvas-inset/60",
          "px-3.5 h-10 text-sm text-ink-muted hover:text-ink hover:border-hairline-strong/80 transition-colors focus-ring",
        )}
        aria-label="Open command palette"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search policies, actions, or ask…</span>
        <span className="ml-auto hidden sm:inline-flex items-center gap-1 rounded-md border border-hairline bg-canvas-raised/80 px-1.5 py-0.5 text-[10px] text-ink-dim">
          <Command className="h-3 w-3" /> K
        </span>
      </button>
      <CommandPalette open={open} onOpenChange={setOpen} />
    </>
  );
}

function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [docMatches, setDocMatches] = React.useState<DocumentSummary[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchDocuments = async () => {
      if (!query.trim()) {
        const res = await fetch("/api/library/search?q=");
        const { data } = await res.json();
        setDocMatches((data || []).slice(0, 4));
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`/api/library/search?q=${encodeURIComponent(query)}`);
        const { data } = await res.json();
        setDocMatches((data || []).slice(0, 6));
      } catch (error) {
        console.error("Failed to search documents:", error);
        setDocMatches([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchDocuments, 200);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const navMatches = React.useMemo(() => {
    if (!query.trim()) return STAFF_ROUTES.slice(0, 4);
    const q = query.toLowerCase();
    return STAFF_ROUTES.filter((r) => r.label.toLowerCase().includes(q));
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-xl !p-0" hideClose>
        <DialogHeader className="px-5 pt-5">
          <DialogTitle className="sr-only">Command palette</DialogTitle>
          <DialogDescription className="sr-only">
            Search policies, navigate, or ask Nestor AI.
          </DialogDescription>
          <div className="flex items-center gap-3 rounded-xl border border-hairline-strong bg-canvas-inset/70 px-3.5 h-11">
            <Search className="h-4 w-4 text-ink-muted" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search policies, ask Nestor AI…"
              className="flex-1 bg-transparent text-sm text-ink placeholder:text-ink-dim focus:outline-none"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded-md border border-hairline bg-canvas-raised/80 px-1.5 py-0.5 text-[10px] text-ink-dim">
              esc
            </kbd>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto px-2 pb-3 pt-2">
          {query.trim() ? (
            <div className="px-3 pb-2">
              <Link
                href={`/app/assistant?q=${encodeURIComponent(query)}`}
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 rounded-xl border border-brand-500/30 bg-brand-500/8 p-3 transition hover:bg-brand-500/12"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/30">
                  <Sparkles className="h-4 w-4 text-brand-300" />
                </span>
                <span className="flex-1 text-sm">
                  <span className="block font-medium text-ink">Ask Nestor AI</span>
                  <span className="block text-xs text-ink-muted line-clamp-1">{query}</span>
                </span>
                <ArrowRight className="h-4 w-4 text-ink-muted" />
              </Link>
            </div>
          ) : null}

          <CommandSection title="Navigate">
            {navMatches.map((r) => {
              const Icon = r.icon;
              return (
                <CommandItem
                  key={r.key}
                  onSelect={() => {
                    router.push(r.href);
                    onOpenChange(false);
                  }}
                >
                  <Icon className="h-4 w-4 text-ink-muted" />
                  <span className="flex-1 text-sm text-ink">{r.label}</span>
                  <Badge tone="muted" size="sm">{r.group}</Badge>
                </CommandItem>
              );
            })}
          </CommandSection>

          <CommandSection title="Policies & Procedures">
            {docMatches.map((d) => (
              <CommandItem
                key={d.id}
                onSelect={() => {
                  router.push(`/app/library/${d.id}`);
                  onOpenChange(false);
                }}
              >
                <span className="grid h-7 w-7 place-items-center rounded-md bg-surface-strong ring-1 ring-hairline-strong text-[10px] font-semibold uppercase text-ink-muted">
                  {d.type[0]}
                </span>
                <span className="flex-1 truncate text-sm text-ink">{d.title}</span>
                <Badge tone="muted" size="sm">v{d.version}</Badge>
              </CommandItem>
            ))}
          </CommandSection>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CommandSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="px-2 pb-1 pt-3">
      <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-dim">
        {title}
      </p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function CommandItem({
  children,
  onSelect,
}: {
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/5 focus-ring"
      >
        {children}
      </button>
    </li>
  );
}
