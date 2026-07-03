import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/shared/status-pill";
import type { EmergencyDrill } from "@/types";
import { formatDate } from "@/lib/utils/format";

export function DrillSchedule({ drills }: { drills: EmergencyDrill[] }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-base font-semibold tracking-tight text-ink">
        Drill history
      </h2>
      <ul className="space-y-2">
        {drills.map((d) => (
          <li key={d.id}>
            <DrillRow drill={d} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function DrillRow({ drill }: { drill: EmergencyDrill }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-hairline bg-canvas-inset/40 p-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-strong ring-1 ring-hairline-strong">
        <Calendar className="h-4 w-4 text-ink-muted" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{drill.title}</p>
        <p className="mt-0.5 flex items-center gap-2 text-[11px] text-ink-dim">
          <Clock className="h-3 w-3" />
          {formatDate(drill.conductedAt)}
        </p>
      </div>
      <StatusPill
        tone={drill.outcome === "passed" ? "accent" : drill.outcome === "failed" ? "critical" : "warn"}
        label={drill.outcome}
        showDot
      />
    </div>
  );
}
