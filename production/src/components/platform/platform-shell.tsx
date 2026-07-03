"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PlatformSidebar } from "@/components/platform/platform-sidebar";
import { PlatformTopbar } from "@/components/platform/platform-topbar";
import { PlatformMobileNav } from "@/components/platform/platform-mobile-nav";
import type { PlatformContext } from "@/types/platform";

export function PlatformShell({
  context,
  children,
}: {
  context: PlatformContext;
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
        <PlatformSidebar />
        <PlatformMobileNav
          open={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
        />

        <div className="lg:pl-72">
          <PlatformTopbar
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
