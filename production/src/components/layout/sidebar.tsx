"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, ShieldAlert, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { ROUTE_GROUPS, STAFF_ROUTES } from "@/lib/route-config/routes";
import { cn } from "@/lib/utils/cn";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants/labels";
import { isAdminRole } from "@/lib/auth/roles";
import { useAppShell } from "./app-shell-context";

export function Sidebar() {
  const pathname = usePathname();
  const grouped = (Object.keys(ROUTE_GROUPS) as Array<keyof typeof ROUTE_GROUPS>).map(
    (group) => ({
      group,
      label: ROUTE_GROUPS[group],
      items: STAFF_ROUTES.filter((r) => r.group === group),
    }),
  );

  return (
    <aside
      aria-label="Primary navigation"
      className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-72 flex-col border-r border-hairline bg-canvas-raised/70 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 px-6 pt-6 pb-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-[15px] font-semibold tracking-tight text-ink">
            {APP_NAME}
          </p>
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-dim">
            {APP_TAGLINE}
          </p>
        </div>
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
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                        active
                          ? "text-ink"
                          : "text-ink-muted hover:text-ink hover:bg-white/4",
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="nav-active"
                          className="absolute inset-0 rounded-xl bg-surface-strong ring-1 ring-hairline-strong"
                          transition={{ type: "spring", stiffness: 380, damping: 32 }}
                        />
                      ) : null}
                      <Icon
                        className={cn(
                          "relative h-[18px] w-[18px]",
                          active ? "text-brand-300" : "text-ink-muted group-hover:text-ink",
                        )}
                      />
                      <span className="relative font-medium">{item.label}</span>
                      {item.key === "emergency" ? (
                        <span className="relative ml-auto inline-flex h-1.5 w-1.5 rounded-full bg-critical-500 animate-pulse-soft" />
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-5 space-y-2">
        <AdminSwitchLink />
        <Link
          href="/app/emergency"
          className="group flex items-center gap-3 rounded-2xl border border-critical-500/30 bg-critical-500/8 px-3 py-3 transition-all hover:border-critical-500/50 hover:bg-critical-500/12"
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
    </aside>
  );
}

function AdminSwitchLink() {
  const { profile } = useAppShell();
  if (!isAdminRole(profile?.systemRole)) return null;
  return (
    <Link
      href="/admin"
      className="group flex items-center gap-3 rounded-2xl border border-brand-500/30 bg-brand-500/8 px-3 py-3 transition-all hover:border-brand-500/50 hover:bg-brand-500/12"
    >
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/15 ring-1 ring-brand-500/40">
        <Shield className="h-4 w-4 text-brand-400" />
      </span>
      <span className="leading-tight">
        <span className="block font-display text-sm font-semibold text-ink">
          Admin
        </span>
        <span className="block text-[11px] text-ink-muted">
          Switch to admin view
        </span>
      </span>
    </Link>
  );
}
