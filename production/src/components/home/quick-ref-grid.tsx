import Link from "next/link";
import {
  BookOpen,
  ClipboardList,
  ExternalLink,
  FileText,
  MapPin,
  Siren,
  Sparkles,
  Star,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { QuickReferenceItem, QuickRefKind } from "@/types";

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
  procedure:
    "from-info-500/15 to-info-500/0 ring-info-500/30 text-info-400",
  form: "from-accent-500/15 to-accent-500/0 ring-accent-500/30 text-accent-300",
  emergency:
    "from-critical-500/15 to-critical-500/0 ring-critical-500/30 text-critical-300",
  "ai-answer":
    "from-brand-400/15 to-brand-400/0 ring-brand-400/30 text-brand-300",
  "site-link":
    "from-warn-500/12 to-warn-500/0 ring-warn-500/30 text-warn-400",
};

export function QuickRefGrid({ items }: { items: QuickReferenceItem[] }) {
  const list = items.slice(0, 6);
  return (
    <section className="space-y-3" aria-labelledby="quick-ref-heading">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-brand-300" />
          <h2 id="quick-ref-heading" className="font-display text-base font-semibold text-ink">
            Quick reference
          </h2>
        </div>
        <Link
          href="/app/quick-reference"
          className="text-xs font-medium text-brand-300 hover:text-brand-200"
        >
          Manage
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {list.map((it) => {
          const Icon = ICON[it.kind];
          return (
            <li key={it.id}>
              <Link
                href={
                  it.targetId
                    ? `/app/library/${it.targetId}`
                    : it.kind === "emergency"
                      ? "/app/emergency"
                      : "/app/quick-reference"
                }
                className="group block h-full rounded-2xl border border-hairline bg-canvas-raised/60 p-4 transition-all hover:border-hairline-strong hover:bg-white/[.02]"
              >
                <span
                  className={`mb-3 inline-grid h-9 w-9 place-items-center rounded-xl ring-1 bg-gradient-to-br ${TONE[it.kind]}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <p className="line-clamp-2 text-sm font-medium text-ink">{it.title}</p>
                {it.subtitle ? (
                  <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-dim">{it.subtitle}</p>
                ) : null}
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] text-ink-muted">
                  Open
                  <ExternalLink className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
