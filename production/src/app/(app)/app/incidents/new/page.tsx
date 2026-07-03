"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import type { Severity } from "@/types/common";

const SEVERITY: { value: Severity; label: string; tone: "warn" | "critical" }[] = [
  { value: "low", label: "Low", tone: "warn" },
  { value: "medium", label: "Medium", tone: "warn" },
  { value: "high", label: "High", tone: "critical" },
  { value: "critical", label: "Critical", tone: "critical" },
];

const CATEGORIES = [
  "Medication error",
  "Fall",
  "Pressure injury",
  "Infection",
  "Behavioral",
  "Documentation",
  "Equipment",
  "Other",
];

export default function NewIncidentPage() {
  const router = useRouter();
  const [severity, setSeverity] = React.useState<Severity>("medium");
  const [category, setCategory] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [witnesses, setWitnesses] = React.useState("");
  const [immediateActions, setImmediateActions] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch("/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          severity,
          location,
          description,
          immediateActions,
          witnesses,
          notifiedParties: witnesses ? witnesses.split(", ") : [],
        }),
      });

      if (res.ok) {
        router.push("/app/incidents");
      } else {
        console.error("Failed to create incident");
      }
    } catch (error) {
      console.error("Failed to submit incident:", error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Safety & compliance"
        title="Report an incident"
        description="Document the incident with severity, category, and immediate actions taken."
        actions={
          <Button variant="ghost" size="sm" asChild>
            <a href="/app/incidents">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to incidents
            </a>
          </Button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-critical-500/12 ring-1 ring-critical-500/30">
              <AlertTriangle className="h-4 w-4 text-critical-300" />
            </span>
            <h2 className="font-display text-base font-semibold tracking-tight text-ink">
              Incident details
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of the incident"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Location</label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Where did this occur?"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      category === c
                        ? "border-brand-500/40 bg-brand-500/12 text-brand-200"
                        : "border-hairline bg-canvas-inset/40 text-ink-muted hover:text-ink"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-ink">Severity</label>
              <div className="flex flex-wrap gap-2">
                {SEVERITY.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setSeverity(s.value)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      severity === s.value
                        ? s.tone === "critical"
                          ? "border-critical-500/40 bg-critical-500/12 text-critical-300"
                          : "border-warn-500/40 bg-warn-500/12 text-warn-300"
                        : "border-hairline bg-canvas-inset/40 text-ink-muted hover:text-ink"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium text-ink">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what happened, who was involved, and any relevant context."
              rows={4}
              required
            />
          </div>

          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium text-ink">Immediate actions taken</label>
            <Textarea
              value={immediateActions}
              onChange={(e) => setImmediateActions(e.target.value)}
              placeholder="What did you do immediately after the incident?"
              rows={3}
            />
          </div>

          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium text-ink">Witnesses (optional)</label>
            <Input
              value={witnesses}
              onChange={(e) => setWitnesses(e.target.value)}
              placeholder="Names of anyone who witnessed the incident"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="primary">
            Submit report
          </Button>
        </div>
      </form>
    </div>
  );
}
