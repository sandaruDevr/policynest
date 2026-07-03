"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Sparkles,
  Trash2,
  Save,
  ShieldCheck,
  History,
  FileText,
  Settings2,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SectionHeader } from "@/components/shared/page-header";
import {
  DOC_ORIGIN_LABEL,
  DOC_STATUS_LABEL,
  DOC_STATUS_TONE,
  STATUS_TRANSITIONS,
  TRANSITION_LABEL,
  VALIDATION_LABEL,
  VALIDATION_TONE,
} from "@/lib/constants/admin-documents";
import { cn } from "@/lib/utils/cn";
import type { AdminDocumentDetail, AdminDocumentStatus } from "@/types/admin";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DocumentWorkspace({ doc }: { doc: AdminDocumentDetail }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  const run = async (
    key: string,
    fn: () => Promise<Response>,
    successMsg?: string,
  ) => {
    setBusy(key);
    setError("");
    try {
      const res = await fn();
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const blockers = data.blockers?.length
          ? ` (${data.blockers.join("; ")})`
          : "";
        throw new Error((data.error || "Action failed") + blockers);
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const validate = () =>
    run("validate", () =>
      fetch(`/api/admin/documents/${doc.id}/validate`, { method: "POST" }),
    );

  const transition = (status: AdminDocumentStatus) =>
    run(`status-${status}`, () =>
      fetch(`/api/admin/documents/${doc.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }),
    );

  const remove = () => {
    if (!confirm("Delete this document? This cannot be undone.")) return;
    run("delete", () =>
      fetch(`/api/admin/documents/${doc.id}`, { method: "DELETE" }),
    ).then(() => router.push("/admin/documents"));
  };

  const transitions = STATUS_TRANSITIONS[doc.status] || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={DOC_STATUS_TONE[doc.status]} size="md">
              {DOC_STATUS_LABEL[doc.status]}
            </Badge>
            {doc.origin !== "organisation" ? (
              <Badge tone="info" size="md">
                {DOC_ORIGIN_LABEL[doc.origin]}
              </Badge>
            ) : null}
            <span className="text-xs text-ink-muted">{doc.version}</span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">
            {doc.title}
          </h1>
          <p className="text-sm text-ink-muted">
            {doc.documentType || "document"}
            {doc.category ? ` · ${doc.category}` : ""} · updated{" "}
            {formatDate(doc.updatedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={validate}
            disabled={busy !== null}
          >
            {busy === "validate" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Validate
          </Button>
          {transitions.map((t) => (
            <Button
              key={t}
              variant={t === "published" ? "primary" : "outline"}
              size="sm"
              onClick={() => transition(t)}
              disabled={busy !== null}
            >
              {busy === `status-${t}` ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              {TRANSITION_LABEL[t] ?? t}
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={remove}
            disabled={busy !== null}
            aria-label="Delete document"
          >
            <Trash2 className="h-4 w-4 text-critical-400" />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-critical-500/30 bg-critical-500/8 px-4 py-3 text-sm text-critical-400">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">
            <FileText className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="content">
            <Settings2 className="h-4 w-4" /> Content & metadata
          </TabsTrigger>
          <TabsTrigger value="validation">
            <ShieldCheck className="h-4 w-4" /> Validation
          </TabsTrigger>
          <TabsTrigger value="versions">
            <History className="h-4 w-4" /> Versions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab doc={doc} />
        </TabsContent>
        <TabsContent value="content">
          <ContentTab doc={doc} />
        </TabsContent>
        <TabsContent value="validation">
          <ValidationTab doc={doc} onValidate={validate} busy={busy === "validate"} />
        </TabsContent>
        <TabsContent value="versions">
          <VersionsTab doc={doc} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({ doc }: { doc: AdminDocumentDetail }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card className="p-5 sm:p-6">
          <SectionHeader title="Summary" />
          <p className="mt-3 text-sm text-ink-muted">
            {doc.summary || "No summary provided."}
          </p>
        </Card>
        <Card className="p-5 sm:p-6">
          <SectionHeader
            title="Sections"
            description={`${doc.sections.length} section${doc.sections.length === 1 ? "" : "s"} extracted on ingest`}
          />
          <div className="mt-3 space-y-3">
            {doc.sections.length === 0 ? (
              <p className="rounded-xl border border-dashed border-hairline bg-surface/50 px-3 py-6 text-center text-sm text-ink-muted">
                Not ingested yet. Add content and click Ingest to extract
                sections and generate retrieval chunks.
              </p>
            ) : (
              doc.sections.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-hairline bg-surface px-4 py-3"
                >
                  <p className="text-sm font-medium text-ink">{s.title}</p>
                  <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-ink-muted">
                    {s.body}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card className="p-5">
          <SectionHeader title="Properties" />
          <dl className="mt-3 space-y-2.5 text-sm">
            <Prop label="Status" value={DOC_STATUS_LABEL[doc.status]} />
            <Prop label="Version" value={doc.version} />
            <Prop label="Risk level" value={doc.riskLevel || "—"} />
            <Prop label="Sector" value={doc.sector || "—"} />
            <Prop
              label="Acknowledgement"
              value={doc.acknowledgementRequired ? "Required" : "Not required"}
            />
            <Prop label="Effective" value={doc.effectiveDate || "—"} />
            <Prop label="Expiry" value={doc.expiryDate || "—"} />
            <Prop label="Review due" value={doc.reviewDueAt || "—"} />
            <Prop label="Published" value={formatDate(doc.publishedAt)} />
          </dl>
        </Card>

        <Card className="p-5">
          <SectionHeader title="Frameworks & tags" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {doc.framework.length === 0 && doc.tags.length === 0 ? (
              <p className="text-sm text-ink-muted">None set.</p>
            ) : null}
            {doc.framework.map((f) => (
              <Badge key={f} tone="brand" size="sm">
                {f}
              </Badge>
            ))}
            {doc.tags.map((t) => (
              <Badge key={t} tone="neutral" size="sm">
                {t}
              </Badge>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Prop({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-dim">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}

function ContentTab({ doc }: { doc: AdminDocumentDetail }) {
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [form, setForm] = React.useState({
    title: doc.title,
    content: doc.content || "",
    framework: doc.framework.join(", "),
    tags: doc.tags.join(", "),
    riskLevel: doc.riskLevel || "",
    acknowledgementRequired: doc.acknowledgementRequired,
    effectiveDate: doc.effectiveDate || "",
    expiryDate: doc.expiryDate || "",
    reviewDueAt: doc.reviewDueAt || "",
  });

  const set = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          content: form.content,
          riskLevel: form.riskLevel || null,
          acknowledgementRequired: form.acknowledgementRequired,
          framework: form.framework
            ? form.framework.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          tags: form.tags
            ? form.tags.split(",").map((s) => s.trim()).filter(Boolean)
            : [],
          effectiveDate: form.effectiveDate || null,
          expiryDate: form.expiryDate || null,
          reviewDueAt: form.reviewDueAt || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Save failed");
      }
      setSaved(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="Edit content & metadata"
          description="Saving automatically re-structures, re-ingests, and regenerates the summary."
        />
        <Button variant="primary" size="sm" onClick={save} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save &amp; re-ingest
        </Button>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg border border-critical-500/30 bg-critical-500/8 px-3 py-2 text-sm text-critical-400">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="mt-3 rounded-lg border border-accent-500/30 bg-accent-500/8 px-3 py-2 text-sm text-accent-300">
          Saved.
        </p>
      ) : null}

      <div className="mt-4 space-y-4">
        <Labeled label="Title">
          <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
        </Labeled>
        <Labeled label="Content (markdown — AI will restructure and re-ingest on save)">
          <Textarea
            value={form.content}
            onChange={(e) => set("content", e.target.value)}
            rows={14}
            className="font-mono text-xs"
          />
        </Labeled>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Labeled label="Frameworks (comma-separated)">
            <Input
              value={form.framework}
              onChange={(e) => set("framework", e.target.value)}
            />
          </Labeled>
          <Labeled label="Tags (comma-separated)">
            <Input value={form.tags} onChange={(e) => set("tags", e.target.value)} />
          </Labeled>
          <Labeled label="Risk level">
            <Input
              value={form.riskLevel}
              onChange={(e) => set("riskLevel", e.target.value)}
              placeholder="low / medium / high"
            />
          </Labeled>
          <Labeled label="Effective date">
            <Input
              type="date"
              value={form.effectiveDate}
              onChange={(e) => set("effectiveDate", e.target.value)}
            />
          </Labeled>
          <Labeled label="Expiry date">
            <Input
              type="date"
              value={form.expiryDate}
              onChange={(e) => set("expiryDate", e.target.value)}
            />
          </Labeled>
          <Labeled label="Review due">
            <Input
              type="date"
              value={form.reviewDueAt}
              onChange={(e) => set("reviewDueAt", e.target.value)}
            />
          </Labeled>
        </div>
        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={form.acknowledgementRequired}
            onChange={(e) => set("acknowledgementRequired", e.target.checked)}
            className="h-4 w-4 rounded border-hairline-strong bg-canvas-inset accent-brand-500"
          />
          <span className="text-sm text-ink">
            Require staff acknowledgement on publish
          </span>
        </label>
      </div>
    </Card>
  );
}

function ValidationTab({
  doc,
  onValidate,
  busy,
}: {
  doc: AdminDocumentDetail;
  onValidate: () => void;
  busy: boolean;
}) {
  const v = doc.latestValidation;

  if (!v) {
    return (
      <Card className="p-8 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-ink-dim" />
        <p className="mt-3 text-sm text-ink-muted">
          No validation run yet. Run AI compliance validation against the
          document content.
        </p>
        <div className="mt-4 flex justify-center">
          <Button variant="primary" size="sm" onClick={onValidate} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            Run validation
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge tone={VALIDATION_TONE[v.status]} size="md">
              {VALIDATION_LABEL[v.status]}
            </Badge>
            {v.score != null ? (
              <span className="font-display text-2xl font-semibold text-ink">
                {v.score}
                <span className="text-sm text-ink-dim">/100</span>
              </span>
            ) : null}
          </div>
          <span className="text-xs text-ink-dim">{formatDate(v.createdAt)}</span>
        </div>
        {v.summary ? (
          <p className="mt-3 text-sm text-ink-muted">{v.summary}</p>
        ) : null}
        {v.blockers.length > 0 ? (
          <div className="mt-4 rounded-xl border border-critical-500/30 bg-critical-500/8 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-critical-400">
              Publish blockers
            </p>
            <ul className="mt-1.5 space-y-1">
              {v.blockers.map((b, i) => (
                <li key={i} className="text-sm text-critical-300">
                  • {b}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </Card>

      {v.frameworks.length > 0 ? (
        <Card className="p-5 sm:p-6">
          <SectionHeader title="Framework coverage" />
          <div className="mt-3 space-y-3">
            {v.frameworks.map((f, i) => (
              <div key={i}>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink">{f.framework}</span>
                  <span className="text-ink-muted">{f.coverage}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-canvas-inset">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      f.status === "pass"
                        ? "bg-accent-500"
                        : f.status === "warn"
                          ? "bg-warn-500"
                          : "bg-critical-500",
                    )}
                    style={{ width: `${Math.max(2, f.coverage)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {v.gaps.length > 0 ? (
        <Card className="p-5 sm:p-6">
          <SectionHeader title="Detected gaps" />
          <div className="mt-3 space-y-2">
            {v.gaps.map((g, i) => (
              <div
                key={i}
                className="rounded-xl border border-hairline bg-surface px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Badge
                    tone={
                      g.severity === "critical" || g.severity === "high"
                        ? "critical"
                        : g.severity === "medium"
                          ? "warn"
                          : "neutral"
                    }
                    size="sm"
                  >
                    {g.severity}
                  </Badge>
                  <p className="text-sm font-medium text-ink">{g.title}</p>
                </div>
                <p className="mt-1 text-xs text-ink-muted">{g.detail}</p>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {v.flags.length > 0 ? (
        <Card className="p-5 sm:p-6">
          <SectionHeader title="Flags" />
          <div className="mt-3 space-y-2">
            {v.flags.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Badge tone="info" size="sm">
                  {f.type}
                </Badge>
                <span className="text-ink-muted">{f.detail}</span>
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

function VersionsTab({ doc }: { doc: AdminDocumentDetail }) {
  if (doc.versions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <History className="mx-auto h-8 w-8 text-ink-dim" />
        <p className="mt-3 text-sm text-ink-muted">
          No version snapshots yet. Snapshots are captured on ingest and
          publish.
        </p>
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-hairline p-0">
      {doc.versions.map((v) => (
        <div key={v.id} className="flex items-center gap-4 px-5 py-3.5">
          <Badge
            tone={v.authorType === "ai" ? "info" : v.authorType === "platform" ? "brand" : "neutral"}
            size="sm"
          >
            {v.authorType}
          </Badge>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-ink">
              {v.version} · {v.title}
            </p>
            <p className="text-[11px] text-ink-muted">
              {v.changeReason || "Snapshot"} ·{" "}
              {v.statusAtSnapshot || "—"}
            </p>
          </div>
          <span className="text-[11px] text-ink-dim">{formatDate(v.createdAt)}</span>
        </div>
      ))}
    </Card>
  );
}

function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-ink-muted">{label}</span>
      {children}
    </label>
  );
}
