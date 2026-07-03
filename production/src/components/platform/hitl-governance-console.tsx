"use client";

import * as React from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Settings2,
} from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils/format";
import { HITL_REVIEW_STATUS_LABEL } from "@/types/platform";
import type {
  PlatformHitlItem,
  HitlSlaConfig,
} from "@/types/platform";

type Tab = "queue" | "sla";

const STATUS_TONE: Record<string, "warn" | "brand" | "critical" | "neutral" | "accent"> = {
  pending: "warn",
  approved: "brand",
  rejected: "critical",
  corrected: "accent",
};

const RISK_TONE: Record<string, "neutral" | "warn" | "critical"> = {
  low: "neutral",
  medium: "warn",
  high: "critical",
  critical: "critical",
};

export function HitlGovernanceConsole({
  items,
  slaConfigs,
}: {
  items: PlatformHitlItem[];
  slaConfigs: HitlSlaConfig[];
}) {
  const [tab, setTab] = React.useState<Tab>("queue");
  const [refreshKey, setRefreshKey] = React.useState(0);
  const refresh = () => setRefreshKey((k) => k + 1);

  const pendingItems = items.filter((i) => i.status === "pending");
  const breachedCount = pendingItems.filter((i) => i.slaBreached).length;
  const avgAge = pendingItems.length > 0
    ? pendingItems.reduce((sum, i) => sum + i.ageHours, 0) / pendingItems.length
    : 0;

  const TABS: Array<{ key: Tab; label: string; icon: typeof ShieldCheck }> = [
    { key: "queue", label: "Review Queue", icon: ShieldCheck },
    { key: "sla", label: "SLA Settings", icon: Settings2 },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform Governance"
        title="HITL Governance Center"
        description="Cross-tenant human-in-the-loop review queues with SLA monitoring and batch actions."
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-warn-400" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Pending Reviews</p>
              <p className="font-display text-2xl font-semibold text-ink">{pendingItems.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-critical-400" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">SLA Breached</p>
              <p className="font-display text-2xl font-semibold text-ink">{breachedCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-brand-300" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Avg Age (hours)</p>
              <p className="font-display text-2xl font-semibold text-ink">{avgAge.toFixed(1)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex gap-1 border-b border-hairline">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-brand-400 text-ink"
                  : "border-transparent text-ink-muted hover:text-ink"
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "queue" ? (
        <QueueTab items={items} refresh={refresh} />
      ) : (
        <SlaTab slaConfigs={slaConfigs} refresh={refresh} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Queue Tab
// ---------------------------------------------------------------------

function QueueTab({
  items,
  refresh,
}: {
  items: PlatformHitlItem[];
  refresh: () => void;
}) {
  const [filter, setFilter] = React.useState<"all" | "pending" | "breached">("pending");
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [reviewItem, setReviewItem] = React.useState<PlatformHitlItem | null>(null);

  const filtered = React.useMemo(() => {
    if (filter === "all") return items;
    if (filter === "breached") return items.filter((i) => i.status === "pending" && i.slaBreached);
    return items.filter((i) => i.status === "pending");
  }, [items, filter]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (prev.size === filtered.length) return new Set();
      return new Set(filtered.map((i) => i.id));
    });
  }

  async function handleBulkAction(status: "approved" | "rejected") {
    if (selected.size === 0) return;
    await fetch("/api/platform/hitl?bulk=true", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemIds: Array.from(selected), status }),
    });
    setSelected(new Set());
    refresh();
    window.location.reload();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          {(["pending", "breached", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f
                  ? "bg-brand-500/15 text-brand-300"
                  : "text-ink-muted hover:text-ink"
              }`}
            >
              {f === "pending" ? "Pending" : f === "breached" ? "SLA Breached" : "All"}
            </button>
          ))}
        </div>
        {selected.size > 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-muted">{selected.size} selected</span>
            <Button size="sm" variant="ghost" onClick={() => handleBulkAction("approved")}>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
              Approve
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleBulkAction("rejected")}>
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Reject
            </Button>
          </div>
        ) : null}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="rounded border-hairline-strong"
                  />
                </th>
                <th className="px-4 py-3 font-medium text-ink-dim">Tenant</th>
                <th className="px-4 py-3 font-medium text-ink-dim">Query</th>
                <th className="px-4 py-3 font-medium text-ink-dim">Risk</th>
                <th className="px-4 py-3 font-medium text-ink-dim">Age</th>
                <th className="px-4 py-3 font-medium text-ink-dim">Status</th>
                <th className="px-4 py-3 font-medium text-ink-dim">SLA</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-ink-muted">
                    No items in this view.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-hairline/50 last:border-0 hover:bg-white/[.02]"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(item.id)}
                        onChange={() => toggleSelect(item.id)}
                        className="rounded border-hairline-strong"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{item.tenantName}</p>
                      {item.userName ? (
                        <p className="text-xs text-ink-dim">{item.userName}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <button
                        onClick={() => setReviewItem(item)}
                        className="text-left text-ink hover:text-brand-300 line-clamp-2"
                      >
                        {item.query}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      {item.riskLevel ? (
                        <Badge tone={RISK_TONE[item.riskLevel] ?? "neutral"} size="sm">
                          {item.riskLevel}
                        </Badge>
                      ) : (
                        <span className="text-ink-dim">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {item.ageHours.toFixed(1)}h
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[item.status] ?? "neutral"} size="sm">
                        {HITL_REVIEW_STATUS_LABEL[item.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {item.status === "pending" && item.slaBreached ? (
                        <Badge tone="critical" size="sm">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Breached
                        </Badge>
                      ) : item.status === "pending" ? (
                        <span className="text-xs text-brand-300">On track</span>
                      ) : (
                        <span className="text-ink-dim">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {reviewItem ? (
        <ReviewDialog
          item={reviewItem}
          open={!!reviewItem}
          onOpenChange={(o) => !o && setReviewItem(null)}
          onReviewed={() => {
            setReviewItem(null);
            window.location.reload();
          }}
        />
      ) : null}
    </div>
  );
}

function ReviewDialog({
  item,
  open,
  onOpenChange,
  onReviewed,
}: {
  item: PlatformHitlItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onReviewed: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<"approved" | "rejected" | "corrected">("approved");
  const [reviewedAnswer, setReviewedAnswer] = React.useState(item.draftAnswer ?? "");
  const [reviewNotes, setReviewNotes] = React.useState("");

  async function handleSubmit() {
    setLoading(true);
    await fetch("/api/platform/hitl", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: item.id,
        status,
        reviewedAnswer: reviewedAnswer || undefined,
        reviewNotes: reviewNotes || undefined,
      }),
    });
    setLoading(false);
    onReviewed();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review HITL Item</DialogTitle>
          <DialogDescription>
            {item.tenantName} · {formatDate(item.createdAt)} · {item.ageHours.toFixed(1)}h old
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Query</p>
            <p className="mt-1 text-sm text-ink">{item.query}</p>
          </div>

          {item.draftAnswer ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Draft Answer</p>
              <pre className="mt-1 max-h-40 overflow-y-auto rounded-lg bg-canvas-inset p-3 text-xs text-ink-muted whitespace-pre-wrap">
                {item.draftAnswer}
              </pre>
            </div>
          ) : null}

          {item.confidence != null ? (
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Confidence</p>
                <p className="text-sm text-ink">{(item.confidence * 100).toFixed(1)}%</p>
              </div>
              {item.riskLevel ? (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Risk</p>
                  <Badge tone={RISK_TONE[item.riskLevel] ?? "neutral"} size="sm">{item.riskLevel}</Badge>
                </div>
              ) : null}
            </div>
          ) : null}

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Decision</p>
            <div className="mt-1.5 flex gap-2">
              {(["approved", "rejected", "corrected"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    status === s
                      ? "bg-brand-500/15 text-brand-300"
                      : "text-ink-muted hover:text-ink"
                  }`}
                >
                  {HITL_REVIEW_STATUS_LABEL[s]}
                </button>
              ))}
            </div>
          </div>

          {status !== "rejected" ? (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Reviewed Answer</p>
              <Textarea
                value={reviewedAnswer}
                onChange={(e) => setReviewedAnswer(e.target.value)}
                rows={6}
                className="mt-1"
              />
            </div>
          ) : null}

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Review Notes</p>
            <Input
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Optional notes..."
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : `Mark as ${HITL_REVIEW_STATUS_LABEL[status]}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------
// SLA Tab
// ---------------------------------------------------------------------

function SlaTab({
  slaConfigs,
  refresh,
}: {
  slaConfigs: HitlSlaConfig[];
  refresh: () => void;
}) {
  const [configs, setConfigs] = React.useState(slaConfigs);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  function updateConfig(id: string, field: keyof HitlSlaConfig, value: string | boolean | number | null) {
    setConfigs((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/platform/hitl/sla", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        configs: configs.map((c) => ({
          id: c.id,
          slaHours: c.slaHours,
          escalationHours: c.escalationHours,
          isActive: c.isActive,
        })),
      }),
    });
    setSaving(false);
    setSaved(true);
    refresh();
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="SLA Configuration"
        description="Set target review times per risk level. Items exceeding SLA are flagged as breached."
      />

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="px-4 py-3 font-medium text-ink-dim">Risk Level</th>
                <th className="px-4 py-3 font-medium text-ink-dim">SLA (hours)</th>
                <th className="px-4 py-3 font-medium text-ink-dim">Escalation (hours)</th>
                <th className="px-4 py-3 font-medium text-ink-dim">Active</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => (
                <tr key={c.id} className="border-b border-hairline/50 last:border-0">
                  <td className="px-4 py-3">
                    <Badge tone={RISK_TONE[c.riskLevel] ?? "neutral"} size="sm">
                      {c.riskLevel}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      value={c.slaHours}
                      onChange={(e) => updateConfig(c.id, "slaHours", Number(e.target.value))}
                      className="w-24"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      type="number"
                      value={c.escalationHours ?? ""}
                      onChange={(e) =>
                        updateConfig(c.id, "escalationHours", e.target.value ? Number(e.target.value) : null)
                      }
                      className="w-24"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={c.isActive}
                      onChange={(e) => updateConfig(c.id, "isActive", e.target.checked)}
                      className="rounded border-hairline-strong"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {saved ? <span className="text-sm text-brand-300">Saved!</span> : null}
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save SLA Configs"}
        </Button>
      </div>
    </div>
  );
}
