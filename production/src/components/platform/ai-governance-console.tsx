"use client";

import * as React from "react";
import { Plus, Cpu, FileText, FlaskConical, Star, GitBranch } from "lucide-react";
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
import {
  AI_MODEL_TYPE_LABEL,
  EVALUATION_STATUS_LABEL,
} from "@/types/platform";
import type {
  AiModel,
  AiPromptSummary,
  AiEvaluation,
  PromptVersion,
  EvaluationCase,
} from "@/types/platform";

type Tab = "models" | "prompts" | "evaluations";

export function AiGovernanceConsole({
  models,
  prompts,
  evaluations,
}: {
  models: AiModel[];
  prompts: AiPromptSummary[];
  evaluations: AiEvaluation[];
}) {
  const [tab, setTab] = React.useState<Tab>("models");

  const TABS: Array<{ key: Tab; label: string; icon: typeof Cpu; count: number }> = [
    { key: "models", label: "Models", icon: Cpu, count: models.length },
    { key: "prompts", label: "Prompts", icon: FileText, count: prompts.length },
    { key: "evaluations", label: "Evaluations", icon: FlaskConical, count: evaluations.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform Governance"
        title="AI Governance"
        description="Model registry, prompt versioning, and evaluation across the CareSuite AI ecosystem."
      />

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
              <span className="ml-1 rounded-full bg-surface px-1.5 py-0.5 text-[10px] text-ink-dim">
                {t.count}
              </span>
            </button>
          );
        })}
      </div>

      {tab === "models" ? <ModelsTab models={models} /> : null}
      {tab === "prompts" ? <PromptsTab prompts={prompts} /> : null}
      {tab === "evaluations" ? <EvaluationsTab evaluations={evaluations} /> : null}
    </div>
  );
}

// ---------------------------------------------------------------------
// Models Tab
// ---------------------------------------------------------------------

function ModelsTab({ models }: { models: AiModel[] }) {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Register Model
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="px-4 py-3 font-medium text-ink-dim">Model</th>
                <th className="px-4 py-3 font-medium text-ink-dim">Type</th>
                <th className="px-4 py-3 font-medium text-ink-dim">Provider</th>
                <th className="px-4 py-3 font-medium text-ink-dim">Context</th>
                <th className="px-4 py-3 font-medium text-ink-dim">Cost/1K</th>
                <th className="px-4 py-3 font-medium text-ink-dim">Status</th>
              </tr>
            </thead>
            <tbody>
              {models.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink-muted">
                    No models registered yet.
                  </td>
                </tr>
              ) : (
                models.map((m) => (
                  <tr key={m.id} className="border-b border-hairline/50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{m.label}</p>
                      <p className="text-xs text-ink-dim">{m.modelId}</p>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {AI_MODEL_TYPE_LABEL[m.modelType]}
                    </td>
                    <td className="px-4 py-3 text-ink-muted capitalize">{m.provider}</td>
                    <td className="px-4 py-3 text-ink-muted">
                      {m.contextWindow ? `${(m.contextWindow / 1000).toFixed(0)}K` : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {m.costPer1kInput != null
                        ? `$${m.costPer1kInput.toFixed(4)}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {m.isDefault ? (
                          <Badge tone="brand" size="sm">
                            <Star className="mr-1 h-3 w-3" />
                            Default
                          </Badge>
                        ) : null}
                        <Badge tone={m.isActive ? "brand" : "neutral"} size="sm">
                          {m.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CreateModelDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function CreateModelDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    provider: "openai",
    modelId: "",
    label: "",
    modelType: "chat",
    contextWindow: "",
    maxOutputTokens: "",
    costPer1kInput: "",
    costPer1kOutput: "",
    isDefault: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/platform/ai-governance/models", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: form.provider,
          modelId: form.modelId,
          label: form.label,
          modelType: form.modelType,
          contextWindow: form.contextWindow ? Number(form.contextWindow) : undefined,
          maxOutputTokens: form.maxOutputTokens ? Number(form.maxOutputTokens) : undefined,
          costPer1kInput: form.costPer1kInput ? Number(form.costPer1kInput) : undefined,
          costPer1kOutput: form.costPer1kOutput ? Number(form.costPer1kOutput) : undefined,
          isDefault: form.isDefault,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      onOpenChange(false);
      setForm({ provider: "openai", modelId: "", label: "", modelType: "chat", contextWindow: "", maxOutputTokens: "", costPer1kInput: "", costPer1kOutput: "", isDefault: false });
      window.location.reload();
    } catch { setError("Network error"); } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Register AI Model</DialogTitle>
          <DialogDescription>Add a new model to the platform registry.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Label" required>
              <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} required />
            </Field>
            <Field label="Model ID" required>
              <Input value={form.modelId} onChange={(e) => setForm((f) => ({ ...f, modelId: e.target.value }))} placeholder="gpt-5.4-mini" required />
            </Field>
            <Field label="Provider">
              <select className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3.5 py-2 text-sm text-ink focus-ring" value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="azure">Azure</option>
              </select>
            </Field>
            <Field label="Model Type">
              <select className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3.5 py-2 text-sm text-ink focus-ring" value={form.modelType} onChange={(e) => setForm((f) => ({ ...f, modelType: e.target.value }))}>
                <option value="chat">Chat</option>
                <option value="embedding">Embedding</option>
                <option value="vision">Vision</option>
                <option value="reasoning">Reasoning</option>
              </select>
            </Field>
            <Field label="Context Window">
              <Input type="number" value={form.contextWindow} onChange={(e) => setForm((f) => ({ ...f, contextWindow: e.target.value }))} placeholder="128000" />
            </Field>
            <Field label="Max Output Tokens">
              <Input type="number" value={form.maxOutputTokens} onChange={(e) => setForm((f) => ({ ...f, maxOutputTokens: e.target.value }))} placeholder="16384" />
            </Field>
            <Field label="Cost / 1K Input ($)">
              <Input type="number" step="0.0001" value={form.costPer1kInput} onChange={(e) => setForm((f) => ({ ...f, costPer1kInput: e.target.value }))} placeholder="0.0015" />
            </Field>
            <Field label="Cost / 1K Output ($)">
              <Input type="number" step="0.0001" value={form.costPer1kOutput} onChange={(e) => setForm((f) => ({ ...f, costPer1kOutput: e.target.value }))} placeholder="0.006" />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
            Set as default for this model type
          </label>
          {error ? <p className="text-sm text-critical-400">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.label || !form.modelId}>{loading ? "Registering..." : "Register"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------
// Prompts Tab
// ---------------------------------------------------------------------

function PromptsTab({ prompts }: { prompts: AiPromptSummary[] }) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selectedPrompt, setSelectedPrompt] = React.useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Prompt
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {prompts.length === 0 ? (
          <Card className="col-span-full p-12 text-center">
            <FileText className="mx-auto mb-3 h-8 w-8 text-ink-dim" />
            <p className="text-ink-muted">No prompts registered yet.</p>
          </Card>
        ) : (
          prompts.map((p) => (
            <Card key={p.id} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-semibold text-ink">{p.label}</p>
                  <p className="mt-0.5 text-xs text-ink-dim font-mono">{p.key}</p>
                </div>
                <Badge tone={p.isActive ? "brand" : "neutral"} size="sm">
                  {p.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              {p.description ? (
                <p className="mt-2 text-xs text-ink-muted line-clamp-2">{p.description}</p>
              ) : null}
              <div className="mt-3 flex items-center gap-3 text-xs text-ink-dim">
                <span className="flex items-center gap-1">
                  <GitBranch className="h-3.5 w-3.5" />
                  {p.versionCount} versions
                </span>
                {p.currentVersion ? (
                  <span className="text-brand-300">{p.currentVersion}</span>
                ) : null}
                <span>{p.evaluationCount} evals</span>
              </div>
              <button
                onClick={() => setSelectedPrompt(p.id)}
                className="mt-3 text-xs font-medium text-brand-300 hover:text-brand-200"
              >
                View versions →
              </button>
            </Card>
          ))
        )}
      </div>

      {selectedPrompt ? (
        <PromptVersionsDialog
          promptId={selectedPrompt}
          open={!!selectedPrompt}
          onOpenChange={(o) => !o && setSelectedPrompt(null)}
        />
      ) : null}

      <CreatePromptDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function PromptVersionsDialog({
  promptId,
  open,
  onOpenChange,
}: {
  promptId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [versions, setVersions] = React.useState<PromptVersion[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/platform/ai-governance/prompts/${promptId}`)
      .then((r) => r.json())
      .then((data) => setVersions(data.versions || []))
      .finally(() => setLoading(false));
  }, [open, promptId]);

  async function handlePublish(versionId: string) {
    await fetch(`/api/platform/ai-governance/prompts/${promptId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "publish", versionId }),
    });
    // Refresh
    fetch(`/api/platform/ai-governance/prompts/${promptId}`)
      .then((r) => r.json())
      .then((data) => setVersions(data.versions || []));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Prompt Versions</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="py-8 text-center text-sm text-ink-muted">Loading...</p>
        ) : (
          <div className="space-y-3">
            {versions.map((v) => (
              <div key={v.id} className="rounded-xl border border-hairline/50 bg-surface/40 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink">{v.version}</p>
                    <Badge tone={v.status === "published" ? "brand" : v.status === "superseded" ? "neutral" : "warn"} size="sm">
                      {v.status}
                    </Badge>
                  </div>
                  {v.status === "draft" ? (
                    <Button size="sm" variant="ghost" onClick={() => handlePublish(v.id)}>
                      Publish
                    </Button>
                  ) : null}
                </div>
                {v.changeReason ? (
                  <p className="mt-1 text-xs text-ink-muted italic">{v.changeReason}</p>
                ) : null}
                <pre className="mt-2 max-h-40 overflow-y-auto rounded-lg bg-canvas-inset p-3 text-xs text-ink-muted whitespace-pre-wrap font-mono">
                  {v.content}
                </pre>
                <p className="mt-2 text-[11px] text-ink-dim">{formatDate(v.createdAt)}</p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreatePromptDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    key: "",
    label: "",
    description: "",
    promptType: "system",
    modelType: "chat",
    content: "",
    changeReason: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/platform/ai-governance/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: form.key,
          label: form.label,
          description: form.description || undefined,
          promptType: form.promptType,
          modelType: form.modelType,
          content: form.content,
          changeReason: form.changeReason || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      onOpenChange(false);
      setForm({ key: "", label: "", description: "", promptType: "system", modelType: "chat", content: "", changeReason: "" });
      window.location.reload();
    } catch { setError("Network error"); } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register AI Prompt</DialogTitle>
          <DialogDescription>Create a new system prompt with an initial published version.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Label" required>
              <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} required />
            </Field>
            <Field label="Key" required>
              <Input value={form.key} onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))} placeholder="rag_system" required />
            </Field>
            <Field label="Prompt Type">
              <select className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3.5 py-2 text-sm text-ink focus-ring" value={form.promptType} onChange={(e) => setForm((f) => ({ ...f, promptType: e.target.value }))}>
                <option value="system">System</option>
                <option value="user_template">User Template</option>
                <option value="structured">Structured</option>
              </select>
            </Field>
            <Field label="Model Type">
              <select className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3.5 py-2 text-sm text-ink focus-ring" value={form.modelType} onChange={(e) => setForm((f) => ({ ...f, modelType: e.target.value }))}>
                <option value="chat">Chat</option>
                <option value="embedding">Embedding</option>
                <option value="vision">Vision</option>
                <option value="reasoning">Reasoning</option>
              </select>
            </Field>
          </div>
          <Field label="Description">
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <Field label="Change Reason">
            <Input value={form.changeReason} onChange={(e) => setForm((f) => ({ ...f, changeReason: e.target.value }))} placeholder="Initial version" />
          </Field>
          <Field label="Prompt Content" required>
            <Textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} rows={10} required placeholder="You are CareSuite AI..." />
          </Field>
          {error ? <p className="text-sm text-critical-400">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.key || !form.label || !form.content}>{loading ? "Creating..." : "Create Prompt"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------
// Evaluations Tab
// ---------------------------------------------------------------------

function EvaluationsTab({ evaluations }: { evaluations: AiEvaluation[] }) {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [selectedEval, setSelectedEval] = React.useState<string | null>(null);

  const STATUS_TONE: Record<string, "brand" | "warn" | "neutral" | "critical"> = {
    completed: "brand",
    running: "warn",
    pending: "neutral",
    failed: "critical",
    cancelled: "neutral",
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Evaluation
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="px-4 py-3 font-medium text-ink-dim">Label</th>
                <th className="px-4 py-3 font-medium text-ink-dim">Status</th>
                <th className="px-4 py-3 text-right font-medium text-ink-dim">Cases</th>
                <th className="px-4 py-3 text-right font-medium text-ink-dim">Passed</th>
                <th className="px-4 py-3 text-right font-medium text-ink-dim">Avg Score</th>
                <th className="px-4 py-3 font-medium text-ink-dim">Created</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-ink-muted">
                    No evaluations yet.
                  </td>
                </tr>
              ) : (
                evaluations.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-hairline/50 last:border-0 cursor-pointer hover:bg-white/[.02]"
                    onClick={() => setSelectedEval(e.id)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{e.label}</p>
                      {e.description ? <p className="text-xs text-ink-dim">{e.description}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[e.status] ?? "neutral"} size="sm">
                        {EVALUATION_STATUS_LABEL[e.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-ink">{e.totalCases}</td>
                    <td className="px-4 py-3 text-right text-ink">{e.passedCases}</td>
                    <td className="px-4 py-3 text-right text-ink">
                      {e.avgScore != null ? `${(e.avgScore * 100).toFixed(1)}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{formatDate(e.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedEval ? (
        <EvaluationCasesDialog
          evalId={selectedEval}
          open={!!selectedEval}
          onOpenChange={(o) => !o && setSelectedEval(null)}
        />
      ) : null}

      <CreateEvaluationDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function EvaluationCasesDialog({
  evalId,
  open,
  onOpenChange,
}: {
  evalId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [cases, setCases] = React.useState<EvaluationCase[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch(`/api/platform/ai-governance/evaluations/${evalId}`)
      .then((r) => r.json())
      .then((data) => setCases(data.cases || []))
      .finally(() => setLoading(false));
  }, [open, evalId]);

  const CASE_TONE: Record<string, "brand" | "critical" | "neutral" | "warn"> = {
    pass: "brand",
    fail: "critical",
    error: "critical",
    pending: "neutral",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Evaluation Cases</DialogTitle>
        </DialogHeader>
        {loading ? (
          <p className="py-8 text-center text-sm text-ink-muted">Loading...</p>
        ) : (
          <div className="space-y-2">
            {cases.map((c) => (
              <div key={c.id} className="rounded-xl border border-hairline/50 bg-surface/40 p-3">
                <div className="flex items-center justify-between">
                  <Badge tone={CASE_TONE[c.status] ?? "neutral"} size="sm">{c.status}</Badge>
                  {c.score != null ? (
                    <span className="text-xs text-ink-muted">Score: {(c.score * 100).toFixed(1)}%</span>
                  ) : null}
                  {c.latencyMs != null ? (
                    <span className="text-xs text-ink-dim">{c.latencyMs}ms</span>
                  ) : null}
                </div>
                <p className="mt-2 text-xs font-medium text-ink">Input:</p>
                <p className="text-xs text-ink-muted">{c.input}</p>
                {c.expectedOutput ? (
                  <>
                    <p className="mt-2 text-xs font-medium text-ink">Expected:</p>
                    <p className="text-xs text-ink-muted">{c.expectedOutput}</p>
                  </>
                ) : null}
                {c.actualOutput ? (
                  <>
                    <p className="mt-2 text-xs font-medium text-ink">Actual:</p>
                    <p className="text-xs text-ink-muted">{c.actualOutput}</p>
                  </>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreateEvaluationDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [form, setForm] = React.useState({
    label: "",
    description: "",
    casesText: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const cases = form.casesText
        .split("\n")
        .filter((l) => l.trim())
        .map((l) => ({ input: l.trim() }));

      if (cases.length === 0) {
        setError("At least one test case is required");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/platform/ai-governance/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: form.label,
          description: form.description || undefined,
          cases,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed"); return; }
      onOpenChange(false);
      setForm({ label: "", description: "", casesText: "" });
      window.location.reload();
    } catch { setError("Network error"); } finally { setLoading(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Evaluation</DialogTitle>
          <DialogDescription>Define test cases to evaluate prompt/model combinations.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Label" required>
            <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} required />
          </Field>
          <Field label="Description">
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </Field>
          <Field label="Test Cases (one per line)" required>
            <Textarea
              value={form.casesText}
              onChange={(e) => setForm((f) => ({ ...f, casesText: e.target.value }))}
              rows={6}
              placeholder="What is the infection control procedure for...&#10;How should I handle a medication error...&#10;What are the steps for..."
              required
            />
          </Field>
          {error ? <p className="text-sm text-critical-400">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !form.label || !form.casesText}>{loading ? "Creating..." : "Create"}</Button>
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
