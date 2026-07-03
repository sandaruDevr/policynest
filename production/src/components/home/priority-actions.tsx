"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Clock,
  FileSignature,
  GraduationCap,
  ShieldAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/shared/status-pill";
import type { ComplianceItem } from "@/types";
import { timeAgo } from "@/lib/utils/format";

const ICON_BY_KIND: Record<ComplianceItem["kind"], LucideIcon> = {
  acknowledgement: FileSignature,
  training: GraduationCap,
  credential: ShieldAlert,
  "policy-signoff": FileSignature,
};

export function PriorityActions({ items }: { items: ComplianceItem[] }) {
  const visible = items
    .filter((i) => i.state !== "complete")
    .slice(0, 4);

  if (visible.length === 0) return null;

  return (
    <section aria-labelledby="priority-heading" className="space-y-3">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-warn-400/90 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" />
            Action required
          </p>
          <h2
            id="priority-heading"
            className="font-display text-lg font-semibold tracking-tight text-ink"
          >
            Priorities for today
          </h2>
        </div>
        <Link
          href="/app/compliance"
          className="text-xs font-medium text-brand-300 hover:text-brand-200"
        >
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {visible.map((item, idx) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.35 }}
          >
            <PriorityCard item={item} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function PriorityCard({ item }: { item: ComplianceItem }) {
  const Icon = ICON_BY_KIND[item.kind];
  const overdue = item.state === "overdue";
  return (
    <Link
      href={
        item.linkedDocumentId
          ? `/app/library/${item.linkedDocumentId}`
          : "/app/compliance"
      }
      className={[
        "group block rounded-2xl border bg-canvas-raised/60 p-4 transition-all",
        overdue
          ? "border-critical-500/30 hover:border-critical-500/50 hover:bg-critical-500/[.04]"
          : "border-hairline hover:border-hairline-strong hover:bg-white/[.02]",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <span
          className={[
            "grid h-10 w-10 shrink-0 place-items-center rounded-xl ring-1",
            overdue
              ? "bg-critical-500/12 ring-critical-500/30"
              : "bg-warn-500/10 ring-warn-500/30",
          ].join(" ")}
        >
          <Icon
            className={`h-[18px] w-[18px] ${overdue ? "text-critical-300" : "text-warn-400"}`}
          />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusPill
              tone={overdue ? "critical" : "warn"}
              label={overdue ? "Overdue" : "Due soon"}
            />
            <span className="text-[11px] text-ink-dim capitalize">{item.kind.replace("-", " ")}</span>
          </div>
          <p className="mt-1.5 line-clamp-2 text-sm font-medium text-ink">
            {item.title}
          </p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-ink-muted">
            <Clock className="h-3 w-3" />
            {item.dueAt ? `Due ${timeAgo(item.dueAt)}` : "Open"}
          </p>
        </div>
        <Button
          size="sm"
          variant={overdue ? "danger" : "secondary"}
          className="shrink-0 self-center group-hover:translate-x-0.5 transition-transform"
          asChild
        >
          <span>{overdue ? "Resolve" : "Start"}</span>
        </Button>
      </div>
    </Link>
  );
}
