import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon: LucideIcon;
  hint?: string;
  tone?: "brand" | "accent" | "warn" | "critical" | "info" | "neutral";
}

const TONE: Record<NonNullable<StatCardProps["tone"]>, string> = {
  brand: "text-brand-300 bg-brand-500/12 ring-brand-500/30",
  accent: "text-accent-300 bg-accent-500/12 ring-accent-500/30",
  warn: "text-warn-400 bg-warn-500/10 ring-warn-500/30",
  critical: "text-critical-400 bg-critical-500/10 ring-critical-500/30",
  info: "text-info-400 bg-info-500/10 ring-info-500/30",
  neutral: "text-ink-muted bg-white/5 ring-hairline-strong",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "neutral",
}: StatCardProps) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
            {label}
          </p>
          <p className="font-display text-2xl font-semibold tracking-tight text-ink">
            {value}
          </p>
          {hint ? <p className="text-xs text-ink-muted">{hint}</p> : null}
        </div>
        <span
          className={cn(
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1",
            TONE[tone],
          )}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </Card>
  );
}
