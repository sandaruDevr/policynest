import Link from "next/link";
import { ArrowUpRight, ChevronRight, History, Sparkles } from "lucide-react";
import type { ActivityItem } from "@/types";
import { timeAgo } from "@/lib/utils/format";

const ICON: Record<ActivityItem["kind"], React.ComponentType<{ className?: string }>> = {
  "ai-question": Sparkles,
  "incident-submitted": History,
  "training-completed": History,
  "policy-acknowledged": History,
  "quick-ref-pinned": History,
  "credential-updated": History,
  "survey-submitted": History,
  "feedback-submitted": History,
  "bookmark-toggle": History,
};

export function ContinueSection({ items }: { items: ActivityItem[] }) {
  const list = items.slice(0, 4);
  return (
    <section className="surface-card p-5 sm:p-6" aria-labelledby="continue-heading">
      <div className="flex items-center justify-between">
        <h2 id="continue-heading" className="font-display text-base font-semibold text-ink">
          Continue where you left off
        </h2>
        <Link
          href="/app/history"
          className="group inline-flex items-center gap-1 text-xs font-medium text-brand-300 hover:text-brand-200"
        >
          History
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <ul className="mt-4 divide-y divide-hairline">
        {list.map((it) => {
          const Icon = ICON[it.kind];
          return (
            <li key={it.id}>
              <button
                type="button"
                className="group flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-white/[.02] -mx-2 px-2 rounded-lg"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-strong ring-1 ring-hairline-strong text-ink-muted">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-ink">{it.title}</span>
                  <span className="block text-[11px] text-ink-dim">{timeAgo(it.at)}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-ink-dim transition-transform group-hover:translate-x-0.5" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
