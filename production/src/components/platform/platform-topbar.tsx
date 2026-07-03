"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Globe2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { PlatformContext } from "@/types/platform";

interface PlatformTopbarProps {
  context: PlatformContext;
  onOpenMobileNav: () => void;
}

export function PlatformTopbar({ context, onOpenMobileNav }: PlatformTopbarProps) {
  const { profile } = context;

  return (
    <header className="sticky top-0 z-30 border-b border-hairline bg-canvas/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:pl-[18.5rem] lg:pr-6">
        <button
          type="button"
          onClick={onOpenMobileNav}
          className="lg:hidden grid h-10 w-10 place-items-center rounded-xl border border-hairline-strong bg-surface text-ink-muted hover:text-ink focus-ring"
          aria-label="Open navigation"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-2 text-sm">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-strong ring-1 ring-hairline-strong">
            <Globe2 className="h-4 w-4 text-brand-300" />
          </span>
          <div className="leading-tight">
            <p className="font-medium text-ink">Policy Nest Platform</p>
            <p className="text-[11px] text-ink-muted">
              Super Admin Console
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Badge tone="brand" size="sm" className="hidden sm:inline-flex">
            {profile.roleLabel}
          </Badge>
          <PlatformProfileMenu
            fullName={profile.fullName}
            roleLabel={profile.roleLabel}
          />
        </div>
      </div>
    </header>
  );
}

function PlatformProfileMenu({
  fullName,
  roleLabel,
}: {
  fullName: string;
  roleLabel: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const parts = fullName.trim().split(" ");
  const initials =
    (parts[0]?.charAt(0) || "P") + (parts.slice(-1)[0]?.charAt(0) || "");

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-white/5 focus-ring"
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white">
            {initials.toUpperCase()}
          </span>
          <span className="hidden text-left sm:block leading-tight">
            <span className="block text-sm font-medium text-ink">
              {fullName}
            </span>
            <span className="block text-[11px] text-ink-muted">{roleLabel}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="!normal-case !tracking-normal">
          <div className="px-1 pb-1">
            <p className="text-sm font-medium text-ink">{fullName}</p>
            <p className="text-xs text-ink-muted">Policy Nest Platform</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/admin">Switch to Org Admin</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app/home">Switch to Staff View</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-critical-400 hover:!text-critical-400 cursor-pointer"
          onClick={handleSignOut}
        >
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
