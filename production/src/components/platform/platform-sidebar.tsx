"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Globe2 } from "lucide-react";
import { motion } from "framer-motion";
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

export function PlatformSidebar() {
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
    <aside
      aria-label="Platform navigation"
      className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-72 flex-col border-r border-hairline bg-canvas-raised/70 backdrop-blur-xl"
    >
      <div className="flex items-center gap-3 px-6 pt-6 pb-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 shadow-glow">
          <Globe2 className="h-4 w-4 text-white" />
        </div>
        <div className="leading-tight">
          <p className="font-display text-[15px] font-semibold tracking-tight text-ink">
            {APP_NAME}
          </p>
          <p className="text-[11px] uppercase tracking-[0.16em] text-ink-dim">
            Platform Console
          </p>
        </div>
      </div>

      <div className="mx-3 mb-2 rounded-xl border border-hairline bg-surface px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim/80">
          Environment
        </p>
        <p className="mt-0.5 text-sm font-medium text-ink">
          CareSuite Platform
        </p>
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
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-all",
                        active
                          ? "text-ink"
                          : "text-ink-muted hover:text-ink hover:bg-white/4",
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="platform-nav-active"
                          className="absolute inset-0 rounded-xl bg-surface-strong ring-1 ring-hairline-strong"
                          transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 32,
                          }}
                        />
                      ) : null}
                      <Icon
                        className={cn(
                          "relative h-[18px] w-[18px]",
                          active
                            ? "text-brand-300"
                            : "text-ink-muted group-hover:text-ink",
                        )}
                      />
                      <span className="relative font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-5">
        <Link
          href="/admin"
          className="group flex items-center gap-3 rounded-2xl border border-hairline bg-surface px-3 py-3 transition-all hover:border-hairline-strong hover:bg-white/[.03]"
        >
          <span className="leading-tight">
            <span className="block text-[11px] uppercase tracking-[0.14em] text-ink-dim">
              Switch view
            </span>
            <span className="block font-display text-sm font-semibold text-ink">
              Org Admin
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
