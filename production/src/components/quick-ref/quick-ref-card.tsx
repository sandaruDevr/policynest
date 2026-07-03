"use client";

import * as React from "react";
import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  ExternalLink,
  FileText,
  MapPin,
  PinOff,
  Siren,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { QuickRefKind } from "@/types";

const ICON: Record<QuickRefKind, LucideIcon> = {
  policy: BookOpen,
  procedure: ClipboardList,
  form: FileText,
  emergency: Siren,
  "ai-answer": Sparkles,
  "site-link": MapPin,
};

const TONE: Record<QuickRefKind, string> = {
  policy: "from-brand-500/15 to-brand-500/0 ring-brand-500/30 text-brand-200",
  procedure: "from-info-500/15 to-info-500/0 ring-info-500/30 text-info-400",
  form: "from-accent-500/15 to-accent-500/0 ring-accent-500/30 text-accent-300",
  emergency: "from-critical-500/15 to-critical-500/0 ring-critical-500/30 text-critical-300",
  "ai-answer": "from-brand-400/15 to-brand-400/0 ring-brand-400/30 text-brand-300",
  "site-link": "from-warn-500/12 to-warn-500/0 ring-warn-500/30 text-warn-400",
};

function quickRefHref(r: {
  kind: QuickRefKind;
  targetId?: string;
  externalUrl?: string;
  id?: string;
}): string {
  if (r.externalUrl) return r.externalUrl;
  if (r.kind === "ai-answer") return `/app/assistant?tab=saved&id=${r.id}`;
  if (r.targetId) return `/app/library/${r.targetId}`;
  if (r.kind === "emergency") return "/app/emergency";
  return "/app/quick-reference";
}

interface QuickRefCardProps {
  id: string;
  kind: QuickRefKind;
  title: string;
  subtitle?: string;
  targetId?: string;
  externalUrl?: string;
}

export function QuickRefCard({ id, kind, title, subtitle, targetId, externalUrl }: QuickRefCardProps) {
  const [removed, setRemoved] = React.useState(false);

  const handleUnpin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await fetch("/api/quick-reference/unpin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) setRemoved(true);
    } catch (error) {
      console.error("Failed to unpin:", error);
    }
  };

  if (removed) return null;

  const Icon = ICON[kind];
  const href = quickRefHref({ kind, targetId, externalUrl, id });
  const isExternal = href.startsWith("http") || href.startsWith("mailto:");

  return (
    <li>
      <Link
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="group block h-full rounded-2xl border border-hairline bg-canvas-raised/60 p-5 transition-all hover:border-hairline-strong hover:bg-white/[.02]"
      >
        <div className="flex items-center justify-between mb-3">
          <span
            className={`inline-grid h-10 w-10 place-items-center rounded-xl ring-1 bg-gradient-to-br ${TONE[kind]}`}
          >
            <Icon className="h-5 w-5" />
          </span>
          <button
            onClick={handleUnpin}
            className="rounded-lg p-1.5 text-ink-dim opacity-0 transition-all hover:bg-critical-500/10 hover:text-critical-300 group-hover:opacity-100"
            aria-label="Remove from quick reference"
          >
            <PinOff className="h-4 w-4" />
          </button>
        </div>
        <h3 className="font-display text-base font-semibold tracking-tight text-ink">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-1 text-sm text-ink-muted line-clamp-2">{subtitle}</p>
        ) : null}
        <p className="mt-3 text-[11px] text-ink-dim capitalize">
          {kind.replace("-", " ")}
        </p>
      </Link>
    </li>
  );
}
