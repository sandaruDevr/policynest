"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import type { AdminContext } from "@/types/admin";

export function AdminShell({
  context,
  children,
}: {
  context: AdminContext;
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <TooltipProvider delayDuration={150} skipDelayDuration={50}>
      <div className="relative min-h-screen bg-canvas text-ink">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-radial-brand"
        />
        <AdminSidebar tenantName={context.tenant.name} role={context.profile.role} />
        <AdminMobileNav
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          tenantName={context.tenant.name}
          role={context.profile.role}
        />

        <div className="lg:pl-72">
          <AdminTopbar
            context={context}
            onOpenMobileNav={() => setMobileNavOpen(true)}
          />
          <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10 pb-16">
            {children}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
