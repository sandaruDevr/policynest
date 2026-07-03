"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookCheck,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
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
import { GOLDEN_STATUS_LABEL } from "@/types/admin";
import type { GoldenAnswer, GoldenStatus, RiskLevel } from "@/types/admin";

interface FormState {
  questionPattern: string;
  approvedAnswer: string;
  riskLevel: "" | RiskLevel;
  status: GoldenStatus;
  framework: string;
}

const EMPTY: FormState = {
  questionPattern: "",
  approvedAnswer: "",
  riskLevel: "",
  status: "active",
  framework: "",
};

export function GoldenAnswers({ answers }: { answers: GoldenAnswer[] }) {
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
    if (!q) return answers;
    return answers.filter(
      (a) =>
        a.questionPattern.toLowerCase().includes(q) ||
        a.approvedAnswer.toLowerCase().includes(q),
    );
  }, [answers, search]);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY);
    setError("");
    setDialogOpen(true);
  };

  const openEdit = (a: GoldenAnswer) => {
    setEditId(a.id);
    setForm({
      questionPattern: a.questionPattern,
      approvedAnswer: a.approvedAnswer,
      riskLevel: a.riskLevel ?? "",
      status: a.status,
      framework: a.framework.join(", "),
    });
    setError("");
    setDialogOpen(true);
  };

  const submit = async () => {
    setBusy("form");
    setError("");
    const payload = {
      questionPattern: form.questionPattern,
      approvedAnswer: form.approvedAnswer,
      riskLevel: form.riskLevel || null,
      status: form.status,
      framework: form.framework
        .split(",")
        .map((f) => f.trim())
        .filter(Boolean),
    };
    try {
      const res = await fetch(
        editId
          ? `/api/admin/governance/golden/${editId}`
          : "/api/admin/governance/golden",
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
      const res = await fetch(`/api/admin/governance/golden/${id}`, {
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
            placeholder="Search golden answers…"
            className="pl-9"
          />
        </div>
        <Button variant="primary" size="md" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New golden answer
        </Button>
      </div>

      {error && !dialogOpen ? (
        <p className="rounded-xl border border-critical-500/30 bg-critical-500/8 px-3 py-2 text-sm text-critical-400">
          {error}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <BookCheck className="mx-auto h-8 w-8 text-ink-dim" />
          <p className="mt-3 text-sm text-ink-muted">
            No golden answers yet. Curate trusted answers that Nestor AI
            serves directly for common questions.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <Card key={a.id} className="space-y-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 space-y-1">
                  <p className="text-sm font-medium text-ink">
                    {a.questionPattern}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <Badge
                      tone={
                        a.status === "active"
                          ? "accent"
                          : a.status === "archived"
                            ? "neutral"
                            : "muted"
                      }
                      size="sm"
                    >
                      {GOLDEN_STATUS_LABEL[a.status]}
                    </Badge>
                    {a.riskLevel ? (
                      <Badge
                        tone={
                          a.riskLevel === "high"
                            ? "critical"
                            : a.riskLevel === "medium"
                              ? "warn"
                              : "neutral"
                        }
                        size="sm"
                      >
                        {a.riskLevel} risk
                      </Badge>
                    ) : null}
                    {a.sourceHitlId ? (
                      <span className="inline-flex items-center gap-1 text-ink-dim">
                        <Sparkles className="h-3 w-3" /> from review
                      </span>
                    ) : null}
                    {a.framework.map((f) => (
                      <Badge key={f} tone="info" size="sm">
                        {f}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openEdit(a)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setConfirmDelete(a.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-critical-400" />
                  </Button>
                </div>
              </div>
              <p className="whitespace-pre-wrap text-sm text-ink-muted">
                {a.approvedAnswer}
              </p>
              {confirmDelete === a.id ? (
                <div className="flex items-center gap-2 rounded-xl border border-critical-500/30 bg-critical-500/8 px-3 py-2">
                  <span className="text-xs text-critical-300">
                    Delete this golden answer?
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(a.id)}
                    disabled={busy === a.id}
                  >
                    {busy === a.id ? (
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
              {editId ? "Edit golden answer" : "New golden answer"}
            </DialogTitle>
            <DialogDescription>
              Nestor AI serves active golden answers directly when a
              question closely matches the pattern.
            </DialogDescription>
          </DialogHeader>

          {error ? (
            <p className="mt-2 rounded-xl border border-critical-500/30 bg-critical-500/8 px-3 py-2 text-sm text-critical-400">
              {error}
            </p>
          ) : null}

          <div className="mt-3 space-y-3">
            <Field label="Question pattern" required>
              <Input
                value={form.questionPattern}
                onChange={(e) => set("questionPattern", e.target.value)}
                placeholder="What should I do if a resident falls?"
              />
            </Field>
            <Field label="Approved answer" required>
              <textarea
                value={form.approvedAnswer}
                onChange={(e) => set("approvedAnswer", e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3 py-2 text-sm text-ink focus-ring"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Risk level">
                <select
                  value={form.riskLevel}
                  onChange={(e) =>
                    set("riskLevel", e.target.value as FormState["riskLevel"])
                  }
                  className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3 text-sm text-ink focus-ring"
                >
                  <option value="">None</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </Field>
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) =>
                    set("status", e.target.value as GoldenStatus)
                  }
                  className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3 text-sm text-ink focus-ring"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
            </div>
            <Field label="Frameworks (comma-separated)">
              <Input
                value={form.framework}
                onChange={(e) => set("framework", e.target.value)}
                placeholder="Aged Care Quality Standards, NDIS"
              />
            </Field>
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
                  form.questionPattern.trim().length < 3 ||
                  form.approvedAnswer.trim().length < 3
                }
              >
                {busy === "form" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BookCheck className="h-4 w-4" />
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
