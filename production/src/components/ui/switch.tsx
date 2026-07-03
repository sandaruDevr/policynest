"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { cn } from "@/lib/utils/cn";

export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
      "border border-hairline-strong transition-colors focus-ring",
      "data-[state=checked]:bg-brand-500 data-[state=unchecked]:bg-white/8",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-elev1",
        "ring-0 transition-transform",
        "data-[state=checked]:translate-x-[22px] data-[state=unchecked]:translate-x-1",
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";
