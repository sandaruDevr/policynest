"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Check,
  Loader2,
  MessageSquare,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import { HITL_STATUS_LABEL } from "@/types/admin";
import type { HitlItem, HitlStatus, RiskLevel } from "@/types/admin";

const FILTERS: { key: HitlStatus | "all"; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "corrected", label: "Corrected" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export function HitlReview({ items }: { items: HitlItem[] }) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<HitlStatus | "all">("pending");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [editing, setEditing] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  const [notes, setNotes] = React.useState("");

  const counts = React.useMemo(() => {
    const map: Record<string, number> = { all: items.length };
    for (const i of items) map[i.status] = (map[i.status] || 0) + 1;
    return map;
  }, [items]);

  const filtered = items.filter((i) => filter === "all" || i.status === filter);

  const review = async (
    id: string,
    status: Exclude<HitlStatus, "pending">,
    reviewedAnswer?: string | null,
    reviewNotes?: string | null,
  ) => {
    setBusy(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/governance/hitl/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reviewedAnswer, reviewNotes }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Review failed");
      }
      setEditing(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const promote = async (id: string) => {
    setBusy(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/governance/hitl/${id}`, {
        method: "POST",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Promote failed");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
              filter === f.key
                ? "border-brand-500/50 bg-brand-500/12 text-brand-200"
                : "border-hairline bg-surface text-ink-muted hover:text-ink",
            )}
          >
            {f.label}
            <span className="text-ink-dim">{counts[f.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {error ? (
        <p className="rounded-xl border border-critical-500/30 bg-critical-500/8 px-3 py-2 text-sm text-critical-400">
          {error}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <MessageSquare className="mx-auto h-8 w-8 text-ink-dim" />
          <p className="mt-3 text-sm text-ink-muted">
            No items in this view. Escalated low-confidence and high-risk
            answers appear here for review.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <Card key={item.id} className="space-y-3 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-ink">{item.query}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
                    <ConfidenceBadge value={item.confidence} />
                    {item.riskLevel ? (
                      <RiskBadge level={item.riskLevel} />
                    ) : null}
                    <span>{item.retrievedCount} chunks retrieved</span>
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </div>
                </div>
                <Badge
                  tone={
                    item.status === "pending"
                      ? "warn"
                      : item.status === "rejected"
                        ? "critical"
                        : "accent"
                  }
                  size="sm"
                >
                  {HITL_STATUS_LABEL[item.status]}
                </Badge>
              </div>

              {item.draftAnswer ? (
                <div className="rounded-xl border border-hairline bg-canvas-inset/40 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-ink-dim">
                    AI draft answer
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-ink-muted">
                    {item.draftAnswer}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-ink-dim italic">
                  No draft answer — policy not found.
                </p>
              )}

              {item.reviewedAnswer ? (
                <div className="rounded-xl border border-accent-500/30 bg-accent-500/8 p-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-accent-300">
                    Reviewed answer
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-ink">
                    {item.reviewedAnswer}
                  </p>
                </div>
              ) : null}

              {editing === item.id ? (
                <div className="space-y-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={4}
                    placeholder="Corrected answer…"
                    className="w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3 py-2 text-sm text-ink focus-ring"
                  />
                  <input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Review notes (optional)"
                    className="w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3 py-2 text-sm text-ink focus-ring"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        review(item.id, "corrected", draft, notes || null)
                      }
                      disabled={busy === item.id || draft.trim().length < 3}
                    >
                      {busy === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Check className="h-3.5 w-3.5" />
                      )}
                      Save correction
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(null)}
                      disabled={busy === item.id}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {item.status === "pending" ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => review(item.id, "approved")}
                        disabled={busy === item.id}
                      >
                        <ThumbsUp className="h-3.5 w-3.5 text-accent-400" />
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditing(item.id);
                          setDraft(item.draftAnswer || "");
                          setNotes("");
                        }}
                        disabled={busy === item.id}
                      >
                        <MessageSquare className="h-3.5 w-3.5 text-brand-400" />
                        Correct
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => review(item.id, "rejected")}
                        disabled={busy === item.id}
                      >
                        <ThumbsDown className="h-3.5 w-3.5 text-critical-400" />
                        Reject
                      </Button>
                    </>
                  ) : null}
                  {item.status === "approved" || item.status === "corrected" ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => promote(item.id)}
                      disabled={busy === item.id}
                    >
                      {busy === item.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 text-brand-400" />
                      )}
                      Promote to golden
                    </Button>
                  ) : null}
                </div>
              )}

              {item.reviewNotes ? (
                <p className="text-[11px] text-ink-dim">
                  Note: {item.reviewNotes}
                </p>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ConfidenceBadge({ value }: { value: number | null }) {
  if (value == null) return null;
  const pct = Math.round(value * 100);
  const tone = pct >= 85 ? "accent" : pct >= 70 ? "warn" : "critical";
  return (
    <Badge tone={tone} size="sm">
      {pct}% confidence
    </Badge>
  );
}

function RiskBadge({ level }: { level: RiskLevel }) {
  const tone = level === "high" ? "critical" : level === "medium" ? "warn" : "neutral";
  return (
    <Badge tone={tone} size="sm">
      <AlertTriangle className="h-3 w-3" />
      {level} risk
    </Badge>
  );
}
