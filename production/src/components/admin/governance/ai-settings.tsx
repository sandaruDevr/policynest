"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import type { TenantAiSettings } from "@/types/admin";

export function AiSettings({ settings }: { settings: TenantAiSettings }) {
  const router = useRouter();
  const [form, setForm] = React.useState(settings);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [saved, setSaved] = React.useState(false);

  const dirty = React.useMemo(
    () => JSON.stringify(form) !== JSON.stringify(settings),
    [form, settings],
  );

  const set = <K extends keyof TenantAiSettings>(
    k: K,
    v: TenantAiSettings[K],
  ) => {
    setSaved(false);
    setForm((f) => ({ ...f, [k]: v }));
  };

  const save = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/governance/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assistantEnabled: form.assistantEnabled,
          hitlConfidenceThreshold: form.hitlConfidenceThreshold,
          escalateHighRisk: form.escalateHighRisk,
          goldenAnswersEnabled: form.goldenAnswersEnabled,
          minRetrievalSimilarity: form.minRetrievalSimilarity,
          retrievalTopK: form.retrievalTopK,
          customGuidance: form.customGuidance,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Save failed");
      }
      setSaved(true);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-4">
      {error ? (
        <p className="rounded-xl border border-critical-500/30 bg-critical-500/8 px-3 py-2 text-sm text-critical-400">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl border border-accent-500/30 bg-accent-500/8 px-3 py-2 text-sm text-accent-300">
          Settings saved.
        </p>
      ) : null}

      <Card className="divide-y divide-hairline p-0">
        <ToggleRow
          title="Nestor AI enabled"
          description="Allow staff to query Nestor AI for policy guidance."
          checked={form.assistantEnabled}
          onChange={(v) => set("assistantEnabled", v)}
        />
        <ToggleRow
          title="Serve golden answers"
          description="Serve curated answers directly when a question matches."
          checked={form.goldenAnswersEnabled}
          onChange={(v) => set("goldenAnswersEnabled", v)}
        />
        <ToggleRow
          title="Always escalate high-risk"
          description="Route falls, medication, abuse and emergencies to human review regardless of confidence."
          checked={form.escalateHighRisk}
          onChange={(v) => set("escalateHighRisk", v)}
        />
      </Card>

      <Card className="space-y-4 p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-ink">
          <Settings2 className="h-4 w-4 text-brand-400" />
          Retrieval & escalation thresholds
        </div>

        <NumberRow
          label="HITL confidence threshold"
          hint="Answers below this confidence are escalated for review (0–1)."
          value={form.hitlConfidenceThreshold}
          step={0.05}
          min={0}
          max={1}
          onChange={(v) => set("hitlConfidenceThreshold", v)}
        />
        <NumberRow
          label="Min retrieval similarity"
          hint="Minimum cosine similarity for a chunk to be considered relevant (0–1)."
          value={form.minRetrievalSimilarity}
          step={0.05}
          min={0}
          max={1}
          onChange={(v) => set("minRetrievalSimilarity", v)}
        />
        <NumberRow
          label="Retrieval top-K"
          hint="Number of chunks pulled per query (1–50)."
          value={form.retrievalTopK}
          step={1}
          min={1}
          max={50}
          onChange={(v) => set("retrievalTopK", Math.round(v))}
        />
      </Card>

      <Card className="space-y-2 p-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-ink">
            Custom Nestor AI guidance
          </span>
          <span className="block text-xs text-ink-muted">
            Optional tenant-specific instructions appended to the system prompt.
          </span>
          <textarea
            value={form.customGuidance ?? ""}
            onChange={(e) => set("customGuidance", e.target.value || null)}
            rows={4}
            placeholder="e.g. Always reference our internal escalation hotline for after-hours incidents."
            className="mt-1 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3 py-2 text-sm text-ink focus-ring"
          />
        </label>
      </Card>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-ink-dim">
          {settings.updatedAt
            ? `Last updated ${new Date(settings.updatedAt).toLocaleString()}`
            : "Using default configuration"}
        </p>
        <Button variant="primary" onClick={save} disabled={busy || !dirty}>
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save settings
        </Button>
      </div>
    </div>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="text-xs text-ink-muted">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function NumberRow({
  label,
  hint,
  value,
  step,
  min,
  max,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  step: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{label}</p>
        <p className="text-xs text-ink-muted">{hint}</p>
      </div>
      <Input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
        className="w-24 text-right"
      />
    </div>
  );
}
