"use client";

import { Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AiActivityEntry } from "@/types/admin";

export function AiActivity({ entries }: { entries: AiActivityEntry[] }) {
  if (entries.length === 0) {
    return (
      <Card className="p-10 text-center">
        <Activity className="mx-auto h-8 w-8 text-ink-dim" />
        <p className="mt-3 text-sm text-ink-muted">
          No assistant activity yet. Queries from staff will appear here.
        </p>
      </Card>
    );
  }

  return (
    <Card className="divide-y divide-hairline p-0">
      {entries.map((e) => (
        <div key={e.id} className="space-y-1 px-4 py-3">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-ink">{e.query}</p>
            <div className="flex shrink-0 items-center gap-2">
              {e.confidence != null ? (
                <Badge
                  tone={
                    e.confidence >= 0.85
                      ? "accent"
                      : e.confidence >= 0.7
                        ? "warn"
                        : "critical"
                  }
                  size="sm"
                >
                  {Math.round(e.confidence * 100)}%
                </Badge>
              ) : null}
              {e.escalated ? (
                <Badge tone="critical" size="sm">
                  escalated
                </Badge>
              ) : null}
            </div>
          </div>
          {e.answer ? (
            <p className="line-clamp-2 text-xs text-ink-muted">{e.answer}</p>
          ) : null}
          <p className="text-[10px] text-ink-dim">
            {new Date(e.createdAt).toLocaleString()}
          </p>
        </div>
      ))}
    </Card>
  );
}
