import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { ComplianceSummary } from "@/types";

export function ComplianceSnapshot({ summary }: { summary: ComplianceSummary }) {
  const tone =
    summary.overdueCount > 0
      ? "critical"
      : summary.expiringSoonCount > 0
        ? "warn"
        : "accent";

  return (
    <section
      aria-labelledby="compliance-snapshot"
      className="surface-card p-5 sm:p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-dim">
            Compliance
          </p>
          <h2
            id="compliance-snapshot"
            className="font-display text-base font-semibold tracking-tight text-ink"
          >
            {summary.overallPercent}% complete
          </h2>
        </div>
        <Link
          href="/app/compliance"
          className="group inline-flex items-center gap-1 text-xs font-medium text-brand-300 hover:text-brand-200"
        >
          Open
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <Progress value={summary.overallPercent} tone={tone} className="mt-4" />

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Stat
          label="Acknowledgements"
          value={`${summary.acknowledgementsDone}/${summary.acknowledgementsTotal}`}
        />
        <Stat
          label="Training"
          value={`${summary.trainingDone}/${summary.trainingTotal}`}
        />
        <Stat
          label="Credentials"
          value={`${summary.credentialsValid}/${summary.credentialsTotal}`}
          tone={summary.expiringSoonCount > 0 ? "warn" : "neutral"}
        />
      </div>

      {(summary.overdueCount > 0 || summary.expiringSoonCount > 0) && (
        <div className="mt-4 flex items-center gap-2 text-xs">
          {summary.overdueCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-critical-500/10 px-2.5 py-1 text-critical-400 ring-1 ring-critical-500/30">
              {summary.overdueCount} overdue
            </span>
          ) : null}
          {summary.expiringSoonCount > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-500/10 px-2.5 py-1 text-warn-400 ring-1 ring-warn-500/30">
              {summary.expiringSoonCount} expiring soon
            </span>
          ) : null}
        </div>
      )}
    </section>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warn";
}) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas-inset/40 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-lg font-semibold tracking-tight ${tone === "warn" ? "text-warn-300" : "text-ink"}`}
      >
        {value}
      </p>
    </div>
  );
}
