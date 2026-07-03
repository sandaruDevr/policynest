"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all focus-ring disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-500 text-white shadow-elev2 hover:bg-brand-400 active:bg-brand-600",
        secondary:
          "bg-surface-strong text-ink border border-hairline-strong hover:bg-white/10 active:bg-white/15",
        ghost:
          "bg-transparent text-ink-muted hover:bg-white/5 hover:text-ink",
        outline:
          "bg-transparent text-ink border border-hairline-strong hover:bg-white/5",
        danger:
          "bg-critical-600 text-white hover:bg-critical-500 active:bg-critical-700 shadow-elev2",
        accent:
          "bg-accent-500 text-white hover:bg-accent-400 active:bg-accent-600 shadow-elev2",
        link: "bg-transparent text-brand-300 hover:text-brand-200 underline-offset-4 hover:underline px-0",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 px-5 text-base",
        icon: "h-10 w-10 p-0",
        "icon-sm": "h-8 w-8 p-0",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
