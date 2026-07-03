"use client";

import { motion } from "framer-motion";
import { Globe, MapPin, Cloud, CheckCircle2 } from "lucide-react";
import { LOCALE_LABEL, SECTOR_LABEL } from "@/lib/constants/labels";
import { formatTime } from "@/lib/utils/format";
import type { StaffProfile } from "@/types";

function greeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function WelcomeStrip({ profile }: { profile: StaffProfile }) {
  const presence = {
    available: { tone: "bg-accent-400", label: "Available" },
    "in-care": { tone: "bg-info-400", label: "In care" },
    break: { tone: "bg-warn-400", label: "On break" },
    offline: { tone: "bg-ink-dim", label: "Offline" },
  } as const;
  const p = presence[profile.presence];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="surface-card relative overflow-hidden p-6 sm:p-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-20 h-40 bg-radial-brand"
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300/80">
            {greeting()}
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-[28px]">
            {profile.preferredName}, ready when you are.
          </h1>
          {profile.shift ? (
            <p className="text-sm text-ink-muted">
              {profile.shift.label} ·{" "}
              <span className="text-ink">
                {formatTime(profile.shift.startsAt)} – {formatTime(profile.shift.endsAt)}
              </span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Pill icon={MapPin}>{profile.site.name}</Pill>
          <Pill icon={Globe}>{LOCALE_LABEL[profile.locale]}</Pill>
          <Pill icon={Cloud}>
            <span className="text-ink-muted mr-1">Synced</span>
            {formatTime(profile.lastSyncAt)}
          </Pill>
          <span className="inline-flex items-center gap-2 rounded-full border border-hairline-strong bg-canvas-inset/60 px-3 py-1.5 text-xs">
            <span className={`h-1.5 w-1.5 rounded-full ${p.tone}`} />
            <span className="text-ink">{p.label}</span>
          </span>
        </div>
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ContextChip label="Sector" value={SECTOR_LABEL[profile.primarySector]} />
        <ContextChip label="Role" value={profile.roleLabel} />
        <ContextChip label="Site code" value={profile.site.id.replace("site_", "").toUpperCase()} />
        <ContextChip
          label="Voice"
          value={profile.voicePreferences.enableMicShortcut ? "Enabled" : "Off"}
          icon={profile.voicePreferences.enableMicShortcut ? CheckCircle2 : undefined}
        />
      </div>
    </motion.div>
  );
}

function Pill({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas-inset/60 px-3 py-1.5 text-xs text-ink">
      <Icon className="h-3.5 w-3.5 text-ink-muted" />
      {children}
    </span>
  );
}

function ContextChip({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-hairline bg-canvas-inset/40 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-dim">
        {label}
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-ink">
        {Icon ? <Icon className="h-3.5 w-3.5 text-accent-400" /> : null}
        {value}
      </p>
    </div>
  );
}
