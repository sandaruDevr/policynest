import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusPill } from "@/components/shared/status-pill";
import type { TrainingModule } from "@/types";

export function ModuleCard({ module }: { module: TrainingModule }) {
  const percent = module.progressPercent / 100;
  const tone = module.status === "completed" ? "accent" : module.status === "in-progress" ? "brand" : "neutral";

  return (
    <Link
      href={`/app/training/${module.id}`}
      className="group block h-full rounded-2xl border border-hairline bg-canvas-raised/60 p-5 transition-all hover:border-hairline-strong hover:bg-white/[.02]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <StatusPill tone={tone} label={module.status} showDot />
            <Badge tone="muted" size="sm">{module.category}</Badge>
          </div>
          <h3 className="font-display text-base font-semibold tracking-tight text-ink">
            {module.title}
          </h3>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-ink-dim mb-1.5">
          <span>Progress</span>
          <span>{Math.round(module.progressPercent)}%</span>
        </div>
        <Progress value={module.progressPercent} tone={module.status === "completed" ? "accent" : "brand"} size="sm" />
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-ink-dim">
        <span>Est. {module.durationMinutes} min</span>
        {module.dueAt ? <span>Due {new Date(module.dueAt).toLocaleDateString()}</span> : null}
      </div>
    </Link>
  );
}
