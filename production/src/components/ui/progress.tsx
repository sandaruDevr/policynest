"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils/cn";

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
  value: number;
  tone?: "brand" | "accent" | "warn" | "critical";
  size?: "sm" | "md";
}

const TONE: Record<NonNullable<ProgressProps["tone"]>, string> = {
  brand: "bg-gradient-to-r from-brand-600 to-brand-400",
  accent: "bg-gradient-to-r from-accent-600 to-accent-400",
  warn: "bg-gradient-to-r from-warn-600 to-warn-400",
  critical: "bg-gradient-to-r from-critical-600 to-critical-400",
};

export const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ className, value, tone = "brand", size = "md", ...props }, ref) => (
  <ProgressPrimitive.Root
    ref={ref}
    className={cn(
      "relative w-full overflow-hidden rounded-full bg-white/5",
      size === "sm" ? "h-1.5" : "h-2",
      className,
    )}
    {...props}
  >
    <ProgressPrimitive.Indicator
      className={cn("h-full w-full flex-1 transition-transform duration-700", TONE[tone])}
      style={{ transform: `translateX(-${100 - Math.max(0, Math.min(100, value))}%)` }}
    />
  </ProgressPrimitive.Root>
));
Progress.displayName = "Progress";
