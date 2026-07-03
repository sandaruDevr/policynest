import Link from "next/link";
import {
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Siren,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { EmergencyProtocol } from "@/types";

const ICON_MAP: Record<EmergencyProtocol["category"], LucideIcon> = {
  fire: Siren,
  medical: AlertTriangle,
  aggression: ShieldAlert,
  "incident-sirs": ShieldAlert,
  facility: AlertTriangle,
};

const TONE_MAP: Record<EmergencyProtocol["category"], string> = {
  fire: "bg-critical-500/12 ring-critical-500/30 text-critical-300",
  medical: "bg-warn-500/12 ring-warn-500/30 text-warn-300",
  aggression: "bg-critical-500/12 ring-critical-500/30 text-critical-300",
  "incident-sirs": "bg-warn-500/12 ring-warn-500/30 text-warn-300",
  facility: "bg-critical-500/12 ring-critical-500/30 text-critical-300",
};

export function ProtocolCard({ protocol }: { protocol: EmergencyProtocol }) {
  const Icon = ICON_MAP[protocol.category];
  return (
    <Link
      href={`/app/emergency/${protocol.category}`}
      className="group block h-full rounded-2xl border border-critical-500/30 bg-critical-500/8 p-5 transition-all hover:border-critical-500/50 hover:bg-critical-500/12"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={`grid h-12 w-12 place-items-center rounded-xl ring-1 ${TONE_MAP[protocol.category]}`}
        >
          <Icon className="h-5 w-5" />
        </span>
        <Badge tone="critical" size="sm">Protocol</Badge>
      </div>

      <h3 className="mt-4 font-display text-base font-semibold tracking-tight text-ink">
        {protocol.title}
      </h3>
      <p className="mt-1.5 text-sm text-ink-muted line-clamp-2">{protocol.description}</p>

      <div className="mt-4 flex items-center gap-2 text-xs text-ink-dim">
        <span className="capitalize">{protocol.category.replace("-", " ")}</span>
        <span>·</span>
        <span>Synced {new Date(protocol.lastSyncedAt).toLocaleDateString()}</span>
      </div>

      <div className="mt-4 flex items-center gap-2 text-sm font-medium text-critical-300">
        View steps
        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
