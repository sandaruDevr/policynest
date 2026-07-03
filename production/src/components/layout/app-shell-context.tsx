"use client";

import * as React from "react";
import type { StaffProfile } from "@/types";

interface AppShellContextValue {
  profile: StaffProfile;
}

const AppShellContext = React.createContext<AppShellContextValue | null>(null);

export function AppShellProvider({
  profile,
  children,
}: {
  profile: StaffProfile;
  children: React.ReactNode;
}) {
  return (
    <AppShellContext.Provider value={{ profile }}>
      {children}
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  const ctx = React.useContext(AppShellContext);
  if (!ctx) {
    throw new Error("useAppShell must be used inside AppShellProvider");
  }
  return ctx;
}
