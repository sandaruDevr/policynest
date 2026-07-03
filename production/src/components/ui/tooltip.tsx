"use client";

import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils/cn";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 overflow-hidden rounded-lg border border-hairline-strong bg-canvas-raised px-2.5 py-1.5",
      "text-xs text-ink shadow-elev2",
      "data-[state=delayed-open]:animate-in data-[state=closed]:animate-out fade-in-0 fade-out-0 zoom-in-95",
      className,
    )}
    {...props}
  />
));
TooltipContent.displayName = "TooltipContent";
