import * as React from "react";
import { cn } from "@/lib/utils/cn";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type = "text", ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3.5 py-2 text-sm text-ink placeholder:text-ink-dim",
      "transition-colors focus-ring focus:border-brand-400/60 focus:bg-canvas-inset",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[88px] w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-dim",
      "transition-colors focus-ring focus:border-brand-400/60 focus:bg-canvas-inset",
      "resize-y disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
