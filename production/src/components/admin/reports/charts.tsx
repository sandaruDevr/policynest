import * as React from "react";
import { cn } from "@/lib/utils/cn";
import type { NamedCount, TrendPoint } from "@/lib/data/admin/analytics";

const BAR_TONES = [
  "bg-brand-500",
  "bg-accent-500",
  "bg-info-500",
  "bg-warn-500",
  "bg-critical-500",
  "bg-brand-400",
  "bg-accent-400",
];

/** Horizontal bar list — proportional bars for categorical counts. */
export function BarList({
  data,
  emptyText = "No data yet.",
  max,
}: {
  data: NamedCount[];
  emptyText?: string;
  max?: number;
}) {
  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-muted">{emptyText}</p>;
  }
  const peak = max ?? Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={d.label} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="capitalize text-ink-muted">
              {d.label.replace(/_/g, " ")}
            </span>
            <span className="font-medium text-ink">{d.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
            <div
              className={cn(
                "h-full rounded-full",
                BAR_TONES[i % BAR_TONES.length],
              )}
              style={{ width: `${Math.max(2, (d.value / peak) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const DONUT_COLORS = [
  "#6366f1",
  "#10b981",
  "#0ea5e9",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
];

/** SVG donut chart with legend. */
export function DonutChart({
  data,
  emptyText = "No data yet.",
}: {
  data: NamedCount[];
  emptyText?: string;
}) {
  const total = data.reduce((a, b) => a + b.value, 0);
  if (total === 0) {
    return <p className="py-6 text-center text-sm text-ink-muted">{emptyText}</p>;
  }

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = data.map((d, i) => {
    const fraction = d.value / total;
    const dash = fraction * circumference;
    const seg = {
      color: DONUT_COLORS[i % DONUT_COLORS.length],
      dash,
      gap: circumference - dash,
      offset: -offset,
      label: d.label,
      value: d.value,
      pct: Math.round(fraction * 100),
    };
    offset += dash;
    return seg;
  });

  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="h-32 w-32 shrink-0 -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth="12"
        />
        {segments.map((s) => (
          <circle
            key={s.label}
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={s.color}
            strokeWidth="12"
            strokeDasharray={`${s.dash} ${s.gap}`}
            strokeDashoffset={s.offset}
          />
        ))}
      </svg>
      <div className="min-w-0 flex-1 space-y-1.5">
        {segments.map((s) => (
          <div
            key={s.label}
            className="flex items-center justify-between gap-2 text-xs"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: s.color }}
              />
              <span className="truncate capitalize text-ink-muted">
                {s.label.replace(/_/g, " ")}
              </span>
            </span>
            <span className="shrink-0 font-medium text-ink">
              {s.value}{" "}
              <span className="text-ink-dim">({s.pct}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** SVG area trend chart for a daily time series. */
export function TrendChart({
  data,
  height = 80,
}: {
  data: TrendPoint[];
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-ink-muted">No data yet.</p>
    );
  }
  const width = 100;
  const peak = Math.max(...data.map((d) => d.value), 1);
  const stepX = width / Math.max(1, data.length - 1);

  const points = data.map((d, i) => {
    const x = i * stepX;
    const y = height - (d.value / peak) * (height - 8) - 4;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const linePath = `M ${points.join(" L ")}`;
  const areaPath = `${linePath} L ${width},${height} L 0,${height} Z`;
  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-20 w-full"
      >
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#trendFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="#6366f1"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-1 flex items-center justify-between text-[10px] text-ink-dim">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{total} total over {data.length}d</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

/** Circular completion gauge (0–1). */
export function ProgressRing({
  value,
  label,
  tone = "#6366f1",
}: {
  value: number;
  label?: string;
  tone?: string;
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const dash = (pct / 100) * circumference;

  return (
    <div className="relative grid h-32 w-32 place-items-center">
      <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={tone}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="font-display text-2xl font-semibold text-ink">
          {pct}%
        </span>
        {label ? (
          <span className="text-[10px] text-ink-dim">{label}</span>
        ) : null}
      </div>
    </div>
  );
}
