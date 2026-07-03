import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SeverityIndicator } from "@/components/shared/severity-icon";
import { StatusPill } from "@/components/shared/status-pill";
import type { IncidentReport } from "@/types";
import { formatDate } from "@/lib/utils/format";

export function IncidentRow({ incident }: { incident: IncidentReport }) {
  return (
    <Link
      href={`/app/incidents/${incident.id}`}
      className="group flex items-center gap-4 rounded-xl border border-hairline bg-canvas-raised/40 p-4 transition-colors hover:border-hairline-strong hover:bg-white/[.02]"
    >
      <SeverityIndicator severity={incident.severity} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-ink">{incident.reference}</span>
          {incident.status === "submitted" ? (
            <StatusPill tone="warn" label="Submitted" showDot />
          ) : incident.status === "in-review" ? (
            <StatusPill tone="brand" label="In review" showDot />
          ) : incident.status === "actioned" ? (
            <StatusPill tone="accent" label="Actioned" showDot />
          ) : incident.status === "closed" ? (
            <StatusPill tone="neutral" label="Closed" showDot />
          ) : (
            <StatusPill tone="neutral" label={incident.status} showDot />
          )}
        </div>
        <p className="mt-1 flex items-center gap-2 text-[11px] text-ink-dim">
          <span className="capitalize">{incident.type.replace("-", " ")}</span>
          <span>·</span>
          <span>{formatDate(incident.occurredAt)}</span>
        </p>
      </div>
      <Badge tone="muted" size="sm">
        {incident.id.slice(0, 8).toUpperCase()}
      </Badge>
      <ChevronRight className="h-4 w-4 text-ink-dim transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
