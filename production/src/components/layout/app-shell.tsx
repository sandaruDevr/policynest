"use client";

import * as React from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav, MobileBottomBar } from "@/components/layout/mobile-nav";
import { SOSFloating } from "@/components/layout/sos-button";
import { AppShellProvider } from "@/components/layout/app-shell-context";
import { useNotifications } from "@/hooks/use-notifications";
import type { NotificationItem, StaffProfile } from "@/types";

export function AppShell({
  profile,
  initialNotifications,
  children,
}: {
  profile: StaffProfile;
  initialNotifications: NotificationItem[];
  children: React.ReactNode;
}) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  // Use polling hook for notifications (refreshes every 60 seconds)
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications(initialNotifications);

  return (
    <TooltipProvider delayDuration={150} skipDelayDuration={50}>
      <AppShellProvider profile={profile}>
        <div className="relative min-h-screen bg-canvas text-ink">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-radial-brand"
          />
          <Sidebar />
          <MobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

          <div className="lg:pl-72">
            <Topbar
              profile={profile}
              notifications={notifications}
              unreadCount={unreadCount}
              onOpenMobileNav={() => setMobileNavOpen(true)}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
            />
            <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10 pb-28 lg:pb-12">
              {children}
            </main>
          </div>

          <SOSFloating />
          <MobileBottomBar />
        </div>
      </AppShellProvider>
    </TooltipProvider>
  );
}
