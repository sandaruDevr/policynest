import * as React from "react";
import { cn } from "@/lib/utils/cn";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-300/80">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl text-balance">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function SectionHeader({
  title,
  description,
  actions,
  className,
  level = "h2",
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
  level?: "h2" | "h3";
}) {
  const HeadingTag = (level === "h2" ? "h2" : "h3") as keyof JSX.IntrinsicElements;
  return (
    <div
      className={cn(
        "flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div>
        <HeadingTag className="font-display text-base font-semibold tracking-tight text-ink">
          {title}
        </HeadingTag>
        {description ? (
          <p className="text-xs text-ink-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}
