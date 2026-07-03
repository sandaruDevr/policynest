import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        "rounded-2xl border border-dashed border-hairline-strong bg-canvas-inset/40 p-10",
        className,
      )}
    >
      {Icon ? (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl bg-surface-strong shadow-elev1 ring-1 ring-hairline-strong">
          <Icon className="h-5 w-5 text-ink-muted" />
        </div>
      ) : null}
      <h3 className="font-display text-base font-semibold tracking-tight text-ink">
        {title}
      </h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-ink-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
