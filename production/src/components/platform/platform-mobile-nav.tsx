"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Globe2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  PLATFORM_ROUTE_GROUPS,
  PLATFORM_ROUTES,
} from "@/lib/route-config/platform-routes";
import { cn } from "@/lib/utils/cn";
import { APP_NAME } from "@/lib/constants/labels";

function isActive(pathname: string, href: string): boolean {
  if (href === "/platform") return pathname === "/platform";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function PlatformMobileNav({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const grouped = (
    Object.keys(PLATFORM_ROUTE_GROUPS) as Array<
      keyof typeof PLATFORM_ROUTE_GROUPS
    >
  )
    .map((group) => ({
      group,
      label: PLATFORM_ROUTE_GROUPS[group],
      items: PLATFORM_ROUTES.filter((r) => r.group === group),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <AnimatePresence>
      {open ? (
        <div className="lg:hidden fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            className="absolute inset-y-0 left-0 w-[18rem] max-w-[85vw] flex flex-col border-r border-hairline bg-canvas-raised"
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700">
                  <Globe2 className="h-4 w-4 text-white" />
                </div>
                <div className="leading-tight">
                  <p className="font-display text-sm font-semibold text-ink">
                    {APP_NAME}
                  </p>
                  <p className="text-[11px] text-ink-dim">Platform Console</p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Close navigation"
                className="grid h-9 w-9 place-items-center rounded-lg text-ink-muted hover:text-ink"
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
                      const active = isActive(pathname, item.href);
                      return (
                        <li key={item.key}>
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all",
                              active
                                ? "bg-surface-strong text-ink ring-1 ring-hairline-strong"
                                : "text-ink-muted hover:text-ink hover:bg-white/4",
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-[18px] w-[18px]",
                                active ? "text-brand-300" : "text-ink-muted",
                              )}
                            />
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
