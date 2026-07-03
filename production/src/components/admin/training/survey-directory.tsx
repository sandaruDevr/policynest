"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { AdminSurvey } from "@/types/admin";

export function SurveyDirectory({ surveys }: { surveys: AdminSurvey[] }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");

  const toggleStatus = async (s: AdminSurvey) => {
    const next = s.status === "open" ? "closed" : "open";
    setBusy(s.id);
    setError("");
    try {
      const res = await fetch(`/api/admin/surveys/${s.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("Update failed");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const completionRate =
    surveys.length > 0
      ? surveys.reduce((sum, s) => {
          const rate =
            s.assignedCount > 0 ? s.completedCount / s.assignedCount : 0;
          return sum + rate;
        }, 0) / surveys.length
      : 0;

  return (
    <div className="space-y-4">
      {error ? (
        <p className="rounded-xl border border-critical-500/30 bg-critical-500/8 px-3 py-2 text-sm text-critical-400">
          {error}
        </p>
      ) : null}

      {surveys.length > 0 ? (
        <div className="flex items-center gap-3 rounded-xl border border-hairline bg-surface px-4 py-3">
          <Progress value={Math.round(completionRate * 100)} className="w-32" />
          <span className="text-xs text-ink-muted">
            Avg completion across {surveys.length} survey
            {surveys.length === 1 ? "" : "s"}
          </span>
        </div>
      ) : null}

      {surveys.length === 0 ? (
        <Card className="p-10 text-center">
          <ClipboardList className="mx-auto h-8 w-8 text-ink-dim" />
          <p className="mt-3 text-sm text-ink-muted">
            No surveys yet. Surveys can be created by staff or platform admins.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {surveys.map((s) => {
            const pct =
              s.assignedCount > 0
                ? Math.round((s.completedCount / s.assignedCount) * 100)
                : 0;
            return (
              <Card key={s.id} className="space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-ink">{s.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      <Badge
                        tone={s.status === "open" ? "accent" : "neutral"}
                        size="sm"
                      >
                        {s.status}
                      </Badge>
                      {s.anonymous ? (
                        <Badge tone="muted" size="sm">
                          <Lock className="h-3 w-3" /> anonymous
                        </Badge>
                      ) : null}
                      {s.questionCount != null ? (
                        <span className="text-ink-muted">
                          {s.questionCount} questions
                        </span>
                      ) : null}
                      {s.estimatedMinutes != null ? (
                        <span className="text-ink-muted">
                          {s.estimatedMinutes} min
                        </span>
                      ) : null}
                      {s.closesAt ? (
                        <span className="text-ink-muted">
                          closes{" "}
                          {new Date(s.closesAt).toLocaleDateString("en-AU")}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleStatus(s)}
                    disabled={busy === s.id}
                  >
                    {busy === s.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                    {s.status === "open" ? "Close" : "Open"}
                  </Button>
                </div>
                {s.assignedCount > 0 ? (
                  <div className="flex items-center gap-3">
                    <div className="w-32">
                      <Progress value={pct} />
                    </div>
                    <span className="text-[11px] text-ink-muted">
                      {s.completedCount}/{s.assignedCount} completed ({pct}%)
                    </span>
                  </div>
                ) : null}
                {s.description ? (
                  <p className="text-xs text-ink-muted">{s.description}</p>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
