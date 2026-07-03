import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-tight",
  {
    variants: {
      tone: {
        neutral: "border-hairline-strong bg-white/5 text-ink-muted",
        brand:
          "border-brand-500/40 bg-brand-500/12 text-brand-200",
        accent:
          "border-accent-500/40 bg-accent-500/12 text-accent-300",
        warn:
          "border-warn-500/40 bg-warn-500/10 text-warn-400",
        critical:
          "border-critical-500/40 bg-critical-500/10 text-critical-400",
        info: "border-info-500/40 bg-info-500/10 text-info-400",
        muted: "border-hairline-subtle bg-white/3 text-ink-dim",
      },
      size: {
        sm: "h-5 px-2 text-[10px]",
        md: "h-6 px-2.5 text-xs",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}
