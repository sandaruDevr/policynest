import * as React from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "neutral" | "brand" | "accent" | "warn" | "critical" | "info" | "muted";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "bg-white/5 text-ink-muted ring-hairline-strong",
  brand: "bg-brand-500/12 text-brand-200 ring-brand-500/30",
  accent: "bg-accent-500/12 text-accent-300 ring-accent-500/30",
  warn: "bg-warn-500/10 text-warn-400 ring-warn-500/30",
  critical: "bg-critical-500/10 text-critical-400 ring-critical-500/30",
  info: "bg-info-500/10 text-info-400 ring-info-500/30",
  muted: "bg-white/3 text-ink-dim ring-hairline-subtle",
};

const TONE_DOT: Record<Tone, string> = {
  neutral: "bg-ink-muted/60",
  brand: "bg-brand-300",
  accent: "bg-accent-300",
  warn: "bg-warn-400",
  critical: "bg-critical-400",
  info: "bg-info-400",
  muted: "bg-ink-dim/60",
};

export function StatusPill({
  tone = "neutral",
  label,
  showDot = true,
  className,
}: {
  tone?: Tone;
  label: string;
  showDot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ring-1",
        TONE_CLASS[tone],
        className,
      )}
    >
      {showDot ? (
        <span className={cn("h-1.5 w-1.5 rounded-full", TONE_DOT[tone])} />
      ) : null}
      {label}
    </span>
  );
}
