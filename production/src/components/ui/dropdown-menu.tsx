"use client";

import * as React from "react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export const DropdownMenu = Dropdown.Root;
export const DropdownMenuTrigger = Dropdown.Trigger;
export const DropdownMenuGroup = Dropdown.Group;

export const DropdownMenuContent = React.forwardRef<
  React.ElementRef<typeof Dropdown.Content>,
  React.ComponentPropsWithoutRef<typeof Dropdown.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <Dropdown.Portal>
    <Dropdown.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 min-w-[12rem] overflow-hidden rounded-xl border border-hairline-strong bg-canvas-raised p-1 shadow-elev3",
        "data-[state=open]:animate-in data-[state=closed]:animate-out fade-in-0 fade-out-0 zoom-in-95",
        className,
      )}
      {...props}
    />
  </Dropdown.Portal>
));
DropdownMenuContent.displayName = "DropdownMenuContent";

export const DropdownMenuItem = React.forwardRef<
  React.ElementRef<typeof Dropdown.Item>,
  React.ComponentPropsWithoutRef<typeof Dropdown.Item>
>(({ className, ...props }, ref) => (
  <Dropdown.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center gap-2 rounded-lg px-3 py-2 text-sm",
      "text-ink-muted outline-none transition-colors",
      "data-[highlighted]:bg-white/5 data-[highlighted]:text-ink",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className,
    )}
    {...props}
  />
));
DropdownMenuItem.displayName = "DropdownMenuItem";

export const DropdownMenuLabel = React.forwardRef<
  React.ElementRef<typeof Dropdown.Label>,
  React.ComponentPropsWithoutRef<typeof Dropdown.Label>
>(({ className, ...props }, ref) => (
  <Dropdown.Label
    ref={ref}
    className={cn("px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-dim", className)}
    {...props}
  />
));
DropdownMenuLabel.displayName = "DropdownMenuLabel";

export const DropdownMenuSeparator = React.forwardRef<
  React.ElementRef<typeof Dropdown.Separator>,
  React.ComponentPropsWithoutRef<typeof Dropdown.Separator>
>(({ className, ...props }, ref) => (
  <Dropdown.Separator
    ref={ref}
    className={cn("my-1 h-px bg-hairline", className)}
    {...props}
  />
));
DropdownMenuSeparator.displayName = "DropdownMenuSeparator";

export const DropdownMenuCheckboxItem = React.forwardRef<
  React.ElementRef<typeof Dropdown.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof Dropdown.CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
  <Dropdown.CheckboxItem
    ref={ref}
    checked={checked}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-lg pl-8 pr-3 py-2 text-sm text-ink-muted",
      "outline-none transition-colors data-[highlighted]:bg-white/5 data-[highlighted]:text-ink",
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <Dropdown.ItemIndicator>
        <Check className="h-3.5 w-3.5 text-brand-300" />
      </Dropdown.ItemIndicator>
    </span>
    {children}
  </Dropdown.CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = "DropdownMenuCheckboxItem";
