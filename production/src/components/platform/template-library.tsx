"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, FileStack, Copy, GitBranch } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
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
import type { MasterTemplateSummary } from "@/types/platform";

const STATUS_TONE: Record<string, "brand" | "warn" | "neutral" | "accent"> = {
  draft: "neutral",
  in_review: "warn",
  approved: "accent",
  published: "brand",
  retired: "neutral",
};

export function TemplateLibrary({
  templates,
}: {
  templates: MasterTemplateSummary[];
}) {
  const [query, setQuery] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    if (!query) return templates;
    const q = query.toLowerCase();
    return templates.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        (t.category ?? "").toLowerCase().includes(q),
    );
  }, [templates, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform Governance"
        title="Master Templates"
        description="Platform-owned document templates with version control and shadow propagation to tenant libraries."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Template
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates..."
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <FileStack className="mx-auto mb-3 h-8 w-8 text-ink-dim" />
            <p className="text-ink-muted">
              {query
                ? "No templates match your search."
                : "No master templates yet. Create one to get started."}
            </p>
          </Card>
        ) : (
          filtered.map((t) => (
            <Link key={t.id} href={`/platform/templates/${t.id}`}>
              <Card className="group h-full p-5 transition-all hover:border-hairline-strong hover:bg-white/[.02]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-base font-semibold text-ink group-hover:text-brand-300">
                      {t.title}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted line-clamp-2">
                      {t.description ?? "No description"}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[t.status] ?? "neutral"} size="sm">
                    {TEMPLATE_STATUS_LABEL[t.status]}
                  </Badge>
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs text-ink-dim">
                  <span className="flex items-center gap-1">
                    <GitBranch className="h-3.5 w-3.5" />
                    {t.versionCount} versions
                  </span>
                  <span className="flex items-center gap-1">
                    <Copy className="h-3.5 w-3.5" />
                    {t.shadowCount} shadows
                  </span>
                  {t.latestVersion ? (
                    <span className="text-brand-300">{t.latestVersion}</span>
                  ) : null}
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>

      <CreateTemplateDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function CreateTemplateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    title: "",
    description: "",
    documentType: "policy",
    category: "",
    pillar: "",
    sector: "",
    riskLevel: "",
    targetRoles: "",
    content: "",
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/platform/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description || undefined,
          documentType: form.documentType,
          category: form.category || undefined,
          pillar: form.pillar || undefined,
          sector: form.sector || undefined,
          riskLevel: form.riskLevel || undefined,
          targetRoles: form.targetRoles
            ? form.targetRoles.split(",").map((s) => s.trim())
            : undefined,
          content: form.content || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create template");
        return;
      }

      onOpenChange(false);
      setForm({
        title: "",
        description: "",
        documentType: "policy",
        category: "",
        pillar: "",
        sector: "",
        riskLevel: "",
        targetRoles: "",
        content: "",
      });
      router.refresh();
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
          <DialogTitle>Create Master Template</DialogTitle>
          <DialogDescription>
            A platform-owned template that can be versioned and pushed as shadow copies to tenant libraries.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Title" required>
              <Input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                required
                minLength={2}
                placeholder="e.g. Infection Control Policy"
              />
            </Field>
            <Field label="Document Type">
              <select
                value={form.documentType}
                onChange={(e) => update("documentType", e.target.value)}
                className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3.5 py-2 text-sm text-ink focus-ring"
              >
                <option value="policy">Policy</option>
                <option value="procedure">Procedure</option>
                <option value="guideline">Guideline</option>
                <option value="form">Form</option>
                <option value="checklist">Checklist</option>
              </select>
            </Field>
            <Field label="Category">
              <Input
                value={form.category}
                onChange={(e) => update("category", e.target.value)}
                placeholder="e.g. Clinical Safety"
              />
            </Field>
            <Field label="Pillar">
              <Input
                value={form.pillar}
                onChange={(e) => update("pillar", e.target.value)}
                placeholder="e.g. Quality"
              />
            </Field>
            <Field label="Sector">
              <Input
                value={form.sector}
                onChange={(e) => update("sector", e.target.value)}
                placeholder="e.g. Aged Care"
              />
            </Field>
            <Field label="Risk Level">
              <Input
                value={form.riskLevel}
                onChange={(e) => update("riskLevel", e.target.value)}
                placeholder="e.g. high"
              />
            </Field>
          </div>

          <Field label="Target Roles (comma-separated)">
            <Input
              value={form.targetRoles}
              onChange={(e) => update("targetRoles", e.target.value)}
              placeholder="e.g. staff, organisation_admin"
            />
          </Field>

          <Field label="Description">
            <Textarea
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
              placeholder="Brief description of this template..."
              rows={2}
            />
          </Field>

          <Field label="Content (Markdown)">
            <Textarea
              value={form.content}
              onChange={(e) => update("content", e.target.value)}
              placeholder="# Policy Title&#10;&#10;Write the template content here..."
              rows={8}
            />
          </Field>

          {error ? (
            <p className="text-sm text-critical-400">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.title}>
              {loading ? "Creating..." : "Create Template"}
            </Button>
          </div>
        </form>
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
