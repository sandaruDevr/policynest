"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ShieldAlert, Shield } from "lucide-react";
import { isAdminRole } from "@/lib/auth/roles";
import { useAppShell } from "@/components/layout/app-shell-context";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ROUTE_GROUPS, STAFF_ROUTES } from "@/lib/route-config/routes";
import { cn } from "@/lib/utils/cn";

interface MobileNavProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function MobileNav({ open, onOpenChange }: MobileNavProps) {
  const pathname = usePathname();
  const { profile } = useAppShell();
  const grouped = (Object.keys(ROUTE_GROUPS) as Array<keyof typeof ROUTE_GROUPS>).map(
    (group) => ({
      group,
      label: ROUTE_GROUPS[group],
      items: STAFF_ROUTES.filter((r) => r.group === group),
    }),
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose
        className="!max-w-full !rounded-none !left-0 !top-0 !translate-x-0 !translate-y-0 !w-[90vw] sm:!w-[24rem] h-screen !p-0 lg:hidden"
      >
        <DialogTitle className="sr-only">Navigation</DialogTitle>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
            <p className="font-display text-base font-semibold tracking-tight">
              Navigation
            </p>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-md p-1 text-ink-muted hover:bg-white/5 hover:text-ink focus-ring"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 pb-6">
            {grouped.map((g) => (
              <div key={g.group} className="mt-4 first:mt-1">
                <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim/80">
                  {g.label}
                </p>
                <ul className="space-y-0.5">
                  {g.items.map((item) => {
                    const Icon = item.icon;
                    const active =
                      pathname === item.href ||
                      (item.href !== "/app/home" && pathname.startsWith(item.href));
                    return (
                      <li key={item.key}>
                        <Link
                          href={item.href}
                          onClick={() => onOpenChange(false)}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                            active
                              ? "bg-surface-strong text-ink ring-1 ring-hairline-strong"
                              : "text-ink-muted hover:bg-white/4 hover:text-ink",
                          )}
                        >
                          <Icon className={cn("h-[18px] w-[18px]", active ? "text-brand-300" : "")} />
                          <span className="font-medium">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
          <div className="px-3 pb-5 pt-2 space-y-2">
            {isAdminRole(profile?.systemRole) ? (
              <Link
                href="/admin"
                onClick={() => onOpenChange(false)}
                className="flex items-center gap-3 rounded-2xl border border-brand-500/30 bg-brand-500/8 px-3 py-3"
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/15 ring-1 ring-brand-500/40">
                  <Shield className="h-4 w-4 text-brand-400" />
                </span>
                <span className="leading-tight">
                  <span className="block font-display text-sm font-semibold text-ink">
                    Switch to Admin
                  </span>
                  <span className="block text-[11px] text-ink-muted">
                    Organization admin
                  </span>
                </span>
              </Link>
            ) : null}
            <Link
              href="/app/emergency"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-2xl border border-critical-500/30 bg-critical-500/8 px-3 py-3"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-critical-500/15 ring-1 ring-critical-500/40">
                <ShieldAlert className="h-4 w-4 text-critical-400" />
              </span>
              <span className="leading-tight">
                <span className="block font-display text-sm font-semibold text-ink">
                  Emergency
                </span>
                <span className="block text-[11px] text-ink-muted">
                  Always-on protocols
                </span>
              </span>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function MobileBottomBar() {
  const pathname = usePathname();
  const items = STAFF_ROUTES.filter((r) => r.mobilePrimary).slice(0, 5);
  return (
    <nav
      aria-label="Bottom navigation"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-hairline bg-canvas/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-4 px-1 pt-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/app/home" && pathname.startsWith(item.href));
          const isEmergency = item.key === "emergency";
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-medium transition-colors",
                  active ? "text-ink" : "text-ink-muted",
                  isEmergency && "text-critical-400",
                )}
              >
                <span
                  className={cn(
                    "grid h-9 w-9 place-items-center rounded-xl",
                    active && !isEmergency && "bg-surface-strong ring-1 ring-hairline-strong",
                    isEmergency && "bg-critical-500/12 ring-1 ring-critical-500/30",
                  )}
                >
                  <Icon className={cn("h-[18px] w-[18px]", active && !isEmergency && "text-brand-300")} />
                </span>
                {item.label.split(" ")[0]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
