"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  BookOpenCheck,
  CheckCircle2,
  Clock,
  Loader2,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { TrainingAssignmentSummary } from "@/types/admin";

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "not_started", label: "Not started" },
  { key: "in_progress", label: "In progress" },
  { key: "completed", label: "Completed" },
  { key: "overdue", label: "Overdue" },
];

export function AssignmentTracker({
  assignments,
}: {
  assignments: TrainingAssignmentSummary[];
}) {
  const [filter, setFilter] = React.useState("all");
  const filtered =
    filter === "all" ? assignments : assignments.filter((a) => a.status === filter);

  const counts: Record<string, number> = { all: assignments.length };
  for (const a of assignments) counts[a.status] = (counts[a.status] || 0) + 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all ${
              filter === f.key
                ? "border-brand-500/50 bg-brand-500/12 text-brand-200"
                : "border-hairline bg-surface text-ink-muted hover:text-ink"
            }`}
          >
            {f.label}
            <span className="text-ink-dim">{counts[f.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <BookOpenCheck className="mx-auto h-8 w-8 text-ink-dim" />
          <p className="mt-3 text-sm text-ink-muted">
            No assignments in this view.
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => (
            <Card key={a.id} className="flex items-center gap-3 p-3">
              <div className="shrink-0">
                {a.status === "completed" ? (
                  <CheckCircle2 className="h-5 w-5 text-accent-400" />
                ) : a.status === "overdue" ? (
                  <Clock className="h-5 w-5 text-critical-400" />
                ) : (
                  <Clock className="h-5 w-5 text-warn-400" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-medium text-ink">{a.moduleTitle}</p>
                <p className="text-[11px] text-ink-muted">
                  {a.userName}
                  {a.dueAt ? (
                    <span>
                      {" "}
                      · due{" "}
                      {new Date(a.dueAt).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  ) : null}
                </p>
              </div>
              {a.status !== "not_started" && a.progressPercent != null ? (
                <div className="w-24 shrink-0">
                  <Progress value={a.progressPercent} />
                </div>
              ) : null}
              <Badge
                tone={
                  a.status === "completed"
                    ? "accent"
                    : a.status === "overdue"
                      ? "critical"
                      : a.status === "in_progress"
                        ? "warn"
                        : "neutral"
                }
                size="sm"
              >
                {a.status.replace(/_/g, " ")}
              </Badge>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
