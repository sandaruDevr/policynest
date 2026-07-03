"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Copy,
  GitBranch,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDate } from "@/lib/utils/format";
import { TEMPLATE_STATUS_LABEL } from "@/types/platform";
import type { MasterTemplateDetail, TemplateVersion } from "@/types/platform";

const STATUS_TONE: Record<string, "brand" | "warn" | "neutral" | "accent"> = {
  draft: "neutral",
  in_review: "warn",
  approved: "accent",
  published: "brand",
  retired: "neutral",
};

const PROP_ICON: Record<string, React.ReactNode> = {
  pushed: <CheckCircle2 className="h-4 w-4 text-brand-300" />,
  updated: <CheckCircle2 className="h-4 w-4 text-brand-300" />,
  skipped: <Clock className="h-4 w-4 text-ink-dim" />,
  failed: <XCircle className="h-4 w-4 text-critical-400" />,
};

export function TemplateDetailPanel({
  template,
}: {
  template: MasterTemplateDetail;
}) {
  const router = useRouter();
  const [versionOpen, setVersionOpen] = React.useState(false);
  const [propagateOpen, setPropagateOpen] = React.useState(false);
  const [propagating, setPropagating] = React.useState(false);
  const [propagateResults, setPropagateResults] = React.useState<
    Array<{ tenantId: string; status: string; detail: string }> | null
  >(null);

  async function handlePropagate(versionId: string, targetTenants?: string[]) {
    setPropagating(true);
    setPropagateResults(null);
    try {
      const res = await fetch("/api/platform/templates/propagate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          versionId,
          targetTenantIds: targetTenants,
        }),
      });
      const data = await res.json();
      if (!res.ok) return;
      setPropagateResults(data.results);
      router.refresh();
    } finally {
      setPropagating(false);
    }
  }

  async function handlePublish(versionId: string) {
    await fetch(`/api/platform/templates/${template.id}?action=publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionId }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/platform/templates"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Templates
        </Link>
      </div>

      <PageHeader
        eyebrow="Master Template"
        title={template.title}
        description={template.description ?? "No description"}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONE[template.status] ?? "neutral"} size="sm">
              {TEMPLATE_STATUS_LABEL[template.status]}
            </Badge>
            {template.currentVersion ? (
              <Badge tone="accent" size="sm">
                {template.currentVersion}
              </Badge>
            ) : null}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <GitBranch className="h-5 w-5 text-brand-300" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Versions</p>
              <p className="font-display text-2xl font-semibold text-ink">{template.versionCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Copy className="h-5 w-5 text-accent-300" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Shadow Copies</p>
              <p className="font-display text-2xl font-semibold text-ink">{template.shadowCount}</p>
              <p className="text-xs text-ink-muted">Across all tenants</p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Metadata</p>
            <p className="text-sm text-ink">{template.documentType}</p>
            <p className="text-xs text-ink-muted">
              {template.category ?? "—"} · {template.pillar ?? "—"}
            </p>
            <p className="text-xs text-ink-muted">
              Roles: {template.targetRoles.length > 0 ? template.targetRoles.join(", ") : "all"}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <SectionHeader
          title="Versions"
          description="Versioned releases of this template"
          actions={
            <Button size="sm" onClick={() => setVersionOpen(true)}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New Version
            </Button>
          }
        />

        <div className="mt-4 space-y-2">
          {template.versions.length === 0 ? (
            <p className="py-6 text-center text-sm text-ink-muted">
              No versions yet. Create one to start publishing.
            </p>
          ) : (
            template.versions.map((v) => (
              <VersionRow
                key={v.id}
                version={v}
                onPublish={() => handlePublish(v.id)}
                onPropagate={() => {
                  setPropagateOpen(true);
                  setPropagateResults(null);
                  handlePropagate(v.id);
                }}
              />
            ))
          )}
        </div>
      </Card>

      {template.propagationLog.length > 0 ? (
        <Card className="p-6">
          <SectionHeader
            title="Propagation Log"
            description="Recent shadow copy pushes"
          />
          <ul className="mt-4 space-y-2">
            {template.propagationLog.slice(0, 20).map((l) => (
              <li
                key={l.id}
                className="flex items-start gap-3 rounded-xl border border-hairline/50 bg-surface/40 px-4 py-3"
              >
                {PROP_ICON[l.status] ?? <Clock className="h-4 w-4 text-ink-dim" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">
                    {l.status.toUpperCase()} — Tenant {l.targetTenantId.slice(0, 8)}
                  </p>
                  {l.detail ? (
                    <p className="text-xs text-ink-muted">{l.detail}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-[11px] text-ink-dim">
                  {formatDate(l.pushedAt)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <CreateVersionDialog
        open={versionOpen}
        onOpenChange={setVersionOpen}
        templateId={template.id}
        currentVersion={template.currentVersion}
        title={template.title}
        onCreated={() => {
          setVersionOpen(false);
          router.refresh();
        }}
      />

      <PropagateDialog
        open={propagateOpen}
        onOpenChange={setPropagateOpen}
        results={propagateResults}
        loading={propagating}
      />
    </div>
  );
}

function VersionRow({
  version,
  onPublish,
  onPropagate,
}: {
  version: TemplateVersion;
  onPublish: () => void;
  onPropagate: () => void;
}) {
  const versionStatusTone: Record<string, "brand" | "neutral" | "warn"> = {
    draft: "neutral",
    published: "brand",
    superseded: "neutral",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-hairline/50 bg-surface/40 px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-ink">{version.version}</p>
          <Badge tone={versionStatusTone[version.status] ?? "neutral"} size="sm">
            {version.status}
          </Badge>
        </div>
        <p className="mt-0.5 text-xs text-ink-muted">
          {version.title} · {formatDate(version.createdAt)}
          {version.propagatedTo.length > 0
            ? ` · ${version.propagatedTo.length} tenants`
            : ""}
        </p>
        {version.changeReason ? (
          <p className="mt-1 text-xs text-ink-dim italic">{version.changeReason}</p>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        {version.status === "draft" ? (
          <Button size="sm" variant="ghost" onClick={onPublish}>
            Publish
          </Button>
        ) : null}
        {version.status === "published" ? (
          <Button size="sm" variant="accent" onClick={onPropagate}>
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Propagate
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function CreateVersionDialog({
  open,
  onOpenChange,
  templateId,
  currentVersion,
  title,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string;
  currentVersion: string | null;
  title: string;
  onCreated: () => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    version: "",
    title: title,
    content: "",
    summary: "",
    changeReason: "",
  });

  React.useEffect(() => {
    if (open) {
      setForm((f) => ({ ...f, title }));
    }
  }, [open, title]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/platform/templates/${templateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: form.version,
          title: form.title,
          content: form.content || undefined,
          summary: form.summary || undefined,
          changeReason: form.changeReason || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create version");
        return;
      }

      setForm({ version: "", title, content: "", summary: "", changeReason: "" });
      onCreated();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Template Version</DialogTitle>
          <DialogDescription>
            {currentVersion ? `Current version: ${currentVersion}` : "First version"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Version" required>
              <Input
                value={form.version}
                onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                placeholder="e.g. v1.0"
                required
              />
            </Field>
            <Field label="Title" required>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </Field>
          </div>

          <Field label="Change Reason">
            <Input
              value={form.changeReason}
              onChange={(e) => setForm((f) => ({ ...f, changeReason: e.target.value }))}
              placeholder="e.g. Updated infection control procedures"
            />
          </Field>

          <Field label="Summary">
            <Textarea
              value={form.summary}
              onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
              rows={2}
              placeholder="Brief summary of changes..."
            />
          </Field>

          <Field label="Content (Markdown)">
            <Textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              rows={10}
              placeholder="# Policy Title..."
            />
          </Field>

          {error ? <p className="text-sm text-critical-400">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.version || !form.title}>
              {loading ? "Creating..." : "Create Version"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PropagateDialog({
  open,
  onOpenChange,
  results,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  results: Array<{ tenantId: string; status: string; detail: string }> | null;
  loading: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Propagate Shadow Copies</DialogTitle>
          <DialogDescription>
            Pushing this version as shadow copies to all active customer tenants.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <p className="text-sm text-ink-muted">Propagating...</p>
          </div>
        ) : results ? (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <p className="py-4 text-center text-sm text-ink-muted">
                No active tenants to propagate to.
              </p>
            ) : (
              results.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-hairline/50 bg-surface/40 px-3 py-2"
                >
                  {PROP_ICON[r.status] ?? <Clock className="h-4 w-4 text-ink-dim" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">
                      {r.status.toUpperCase()}
                    </p>
                    <p className="text-xs text-ink-muted">{r.detail}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}

        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
        {label}
        {required ? <span className="text-critical-400"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
