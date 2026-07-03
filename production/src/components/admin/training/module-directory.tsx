"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { AdminTrainingModule } from "@/types/admin";

interface FormState {
  title: string;
  type: string;
  category: string;
  durationMinutes: string;
  required: boolean;
  rolesRelevant: string;
  linkedPolicyId: string;
}

const EMPTY: FormState = {
  title: "",
  type: "video",
  category: "",
  durationMinutes: "",
  required: false,
  rolesRelevant: "",
  linkedPolicyId: "",
};

export function ModuleDirectory({ modules }: { modules: AdminTrainingModule[] }) {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<FormState>(EMPTY);
  const [confirmDelete, setConfirmDelete] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return modules;
    return modules.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        (m.category ?? "").toLowerCase().includes(q),
    );
  }, [modules, search]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY);
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (m: AdminTrainingModule) => {
    setEditId(m.id);
    setForm({
      title: m.title,
      type: m.type,
      category: m.category ?? "",
      durationMinutes: m.durationMinutes?.toString() ?? "",
      required: m.required,
      rolesRelevant: m.rolesRelevant.join(", "),
      linkedPolicyId: m.linkedPolicyId ?? "",
    });
    setError("");
    setDialogOpen(true);
  };

  const submit = async () => {
    setBusy("form");
    setError("");
    const payload = {
      title: form.title,
      type: form.type,
      category: form.category || null,
      durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null,
      required: form.required,
      rolesRelevant: form.rolesRelevant
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      linkedPolicyId: form.linkedPolicyId || null,
    };
    try {
      const res = await fetch(
        editId
          ? `/api/admin/training/modules/${editId}`
          : "/api/admin/training/modules",
        {
          method: editId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Save failed");
      }
      setDialogOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/training/modules/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setConfirmDelete(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search modules…"
            className="pl-9"
          />
        </div>
        <Button variant="primary" size="md" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New module
        </Button>
      </div>

      {error && !dialogOpen ? (
        <p className="rounded-xl border border-critical-500/30 bg-critical-500/8 px-3 py-2 text-sm text-critical-400">
          {error}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <BookOpen className="mx-auto h-8 w-8 text-ink-dim" />
          <p className="mt-3 text-sm text-ink-muted">
            No training modules yet. Create modules that staff can complete.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <Card key={m.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-ink">{m.title}</p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <Badge tone="neutral" size="sm">
                      {m.type}
                    </Badge>
                    {m.category ? (
                      <Badge tone="info" size="sm">
                        {m.category}
                      </Badge>
                    ) : null}
                    {m.required ? (
                      <Badge tone="critical" size="sm">
                        required
                      </Badge>
                    ) : null}
                    {m.durationMinutes ? (
                      <span className="text-ink-muted">
                        {m.durationMinutes} min
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(m)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setConfirmDelete(m.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-critical-400" />
                  </Button>
                </div>
              </div>
              {m.rolesRelevant.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {m.rolesRelevant.map((r) => (
                    <Badge key={r} tone="muted" size="sm">
                      {r}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {confirmDelete === m.id ? (
                <div className="flex items-center gap-2 rounded-xl border border-critical-500/30 bg-critical-500/8 px-3 py-2">
                  <span className="text-xs text-critical-300">
                    Delete this module?
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(m.id)}
                    disabled={busy === m.id}
                  >
                    {busy === m.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    Confirm
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(null)}
                  >
                    Cancel
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Edit training module" : "New training module"}
            </DialogTitle>
            <DialogDescription>
              Modules can be assigned to staff and tracked for completion.
            </DialogDescription>
          </DialogHeader>
          {error ? (
            <p className="mt-2 rounded-xl border border-critical-500/30 bg-critical-500/8 px-3 py-2 text-sm text-critical-400">
              {error}
            </p>
          ) : null}
          <div className="mt-3 space-y-3">
            <Field label="Title" required>
              <Input
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Falls prevention refresher"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type" required>
                <select
                  value={form.type}
                  onChange={(e) => set("type", e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3 text-sm text-ink focus-ring"
                >
                  <option value="video">Video</option>
                  <option value="reading">Reading</option>
                  <option value="quiz">Quiz</option>
                  <option value="interactive">Interactive</option>
                  <option value="workshop">Workshop</option>
                </select>
              </Field>
              <Field label="Duration (min)">
                <Input
                  type="number"
                  value={form.durationMinutes}
                  onChange={(e) => set("durationMinutes", e.target.value)}
                  placeholder="15"
                  min={1}
                />
              </Field>
            </div>
            <Field label="Category">
              <Input
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
                placeholder="Compliance"
              />
            </Field>
            <Field label="Relevant roles (comma-separated)">
              <Input
                value={form.rolesRelevant}
                onChange={(e) => set("rolesRelevant", e.target.value)}
                placeholder="Registered Nurse, Care Worker"
              />
            </Field>
            <Field label="Linked policy ID">
              <Input
                value={form.linkedPolicyId}
                onChange={(e) => set("linkedPolicyId", e.target.value)}
                placeholder="Document UUID"
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={form.required}
                onChange={(e) => set("required", e.target.checked)}
                className="h-4 w-4 rounded border-hairline-strong accent-brand-500"
              />
              Required for relevant roles
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                onClick={() => setDialogOpen(false)}
                disabled={busy === "form"}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={submit}
                disabled={
                  busy === "form" ||
                  form.title.trim().length < 3 ||
                  !form.type
                }
              >
                {busy === "form" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BookOpen className="h-4 w-4" />
                )}
                {editId ? "Save" : "Create"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
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
      <span className="text-xs font-medium text-ink-muted">
        {label}
        {required ? <span className="text-critical-400"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
