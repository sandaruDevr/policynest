"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Cloud,
  CloudOff,
  Globe,
  Menu,
  Mic,
  Shield,
} from "lucide-react";
import { isAdminRole } from "@/lib/auth/roles";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LOCALE_LABEL } from "@/lib/constants/labels";
import { cn } from "@/lib/utils/cn";
import type { Locale, NotificationItem, StaffProfile } from "@/types";
import { CommandPaletteTrigger } from "@/components/layout/command-palette";
import { createClient } from "@/lib/supabase/client";

interface TopbarProps {
  profile: StaffProfile;
  notifications: NotificationItem[];
  unreadCount: number;
  onOpenMobileNav: () => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function Topbar({
  profile,
  notifications,
  unreadCount,
  onOpenMobileNav,
  onMarkAsRead,
  onMarkAllAsRead,
}: TopbarProps) {
  const [locale, setLocale] = useState<Locale>(profile.locale);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

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

        <CommandPaletteTrigger />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <SyncBadge online={online} lastSyncAt={profile.lastSyncAt} />

          <Button
            variant="ghost"
            size="icon"
            aria-label="Voice"
            className="hidden sm:inline-flex"
          >
            <Mic className="h-[18px] w-[18px]" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Language"
                className="hidden sm:inline-flex"
              >
                <Globe className="h-[18px] w-[18px]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(LOCALE_LABEL) as Locale[]).map((l) => (
                <DropdownMenuCheckboxItem
                  key={l}
                  checked={locale === l}
                  onCheckedChange={() => setLocale(l)}
                >
                  {LOCALE_LABEL[l]}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
                <Bell className="h-[18px] w-[18px]" />
                {unreadCount > 0 ? (
                  <span className="absolute right-1 top-1 grid h-4 min-w-[1rem] place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-semibold text-white shadow-elev1">
                    {unreadCount}
                  </span>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[20rem]">
              <div className="flex items-center justify-between px-3 py-2">
                <DropdownMenuLabel className="py-0">Notifications</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAllAsRead();
                    }}
                    className="flex items-center gap-1 text-xs text-brand-300 hover:text-brand-200"
                  >
                    <CheckCheck className="h-3 w-3" />
                    Mark all read
                  </button>
                )}
              </div>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="px-3 py-4 text-sm text-ink-muted">You&apos;re all caught up.</div>
              ) : (
                notifications.slice(0, 6).map((n) => (
                  <DropdownMenuItem key={n.id} asChild>
                    <div className="flex w-full items-start gap-2 px-2 py-2">
                      <Link href={n.href ?? "#"} className="flex flex-1 flex-col items-start gap-0.5">
                        <span className="flex w-full items-center gap-2">
                          <NotifLevelDot level={n.level} />
                          <span className="line-clamp-1 flex-1 font-medium text-ink">{n.title}</span>
                          {!n.read ? <Badge tone="brand" size="sm">New</Badge> : null}
                        </span>
                        {n.body ? (
                          <span className="line-clamp-2 text-xs text-ink-muted">{n.body}</span>
                        ) : null}
                      </Link>
                      {!n.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            onMarkAsRead(n.id);
                          }}
                          className="mt-0.5 rounded p-1 text-ink-dim hover:bg-canvas-inset hover:text-ink"
                          title="Mark as read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/app/history" className="justify-center">View history</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ProfileMenu profile={profile} />
        </div>
      </div>
    </header>
  );
}

function NotifLevelDot({ level }: { level: NotificationItem["level"] }) {
  const map = {
    info: "bg-info-400",
    warn: "bg-warn-400",
    critical: "bg-critical-400",
  } as const;
  return <span className={cn("h-1.5 w-1.5 rounded-full", map[level])} />;
}

function SyncBadge({ online, lastSyncAt }: { online: boolean; lastSyncAt: string }) {
  return (
    <div
      className={cn(
        "hidden md:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px]",
        online
          ? "border-accent-500/30 bg-accent-500/10 text-accent-300"
          : "border-warn-500/30 bg-warn-500/10 text-warn-400",
      )}
      title={online ? `Synced • ${new Date(lastSyncAt).toLocaleTimeString()}` : "Offline"}
    >
      {online ? <Cloud className="h-3 w-3" /> : <CloudOff className="h-3 w-3" />}
      <span className="font-medium">{online ? "Synced" : "Offline"}</span>
    </div>
  );
}

function ProfileMenu({ profile }: { profile: StaffProfile }) {
  const router = useRouter();
  const supabase = createClient();
  const initials = profile.preferredName.charAt(0) + profile.fullName.split(" ").slice(-1)[0]?.charAt(0);

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
            {initials}
          </span>
          <span className="hidden text-left sm:block leading-tight">
            <span className="block text-sm font-medium text-ink">{profile.preferredName}</span>
            <span className="block text-[11px] text-ink-muted">{profile.roleLabel}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="!normal-case !tracking-normal">
          <div className="px-1 pb-1">
            <p className="text-sm font-medium text-ink">{profile.fullName}</p>
            <p className="text-xs text-ink-muted">{profile.site.name}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAdminRole(profile.systemRole) ? (
          <DropdownMenuItem asChild>
            <Link href="/admin" className="flex items-center gap-2 text-brand-300">
              <Shield className="h-3.5 w-3.5" />
              Switch to Admin
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem asChild>
          <Link href="/app/profile">Profile & Preferences</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app/compliance">My Compliance</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app/history">Activity History</Link>
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
