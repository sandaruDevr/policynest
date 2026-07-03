import type { Severity } from "@/types";
import { cn } from "@/lib/utils/cn";

const SEV_RING: Record<Severity, string> = {
  low: "ring-info-500/30 bg-info-500/10",
  medium: "ring-warn-500/30 bg-warn-500/10",
  high: "ring-warn-500/40 bg-warn-500/15",
  critical: "ring-critical-500/40 bg-critical-500/15",
};
const SEV_DOT: Record<Severity, string> = {
  low: "bg-info-400",
  medium: "bg-warn-400",
  high: "bg-warn-400",
  critical: "bg-critical-400",
};

export function SeverityIndicator({
  severity,
  className,
}: {
  severity: Severity;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "grid h-6 w-6 place-items-center rounded-full ring-1",
        SEV_RING[severity],
        className,
      )}
      aria-label={`Severity: ${severity}`}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", SEV_DOT[severity])} />
    </span>
  );
}
