import Link from "next/link";
import { Megaphone, MessageCircle, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/utils/format";
import type { NotificationItem, SurveySummary } from "@/types";

export function BroadcastsAndSurveys({
  notifications,
  surveys,
}: {
  notifications: NotificationItem[];
  surveys: SurveySummary[];
}) {
  const broadcasts = notifications.filter((n) => n.category === "broadcast").slice(0, 3);
  const active = surveys.filter((s) => s.status === "active");

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <section className="surface-card p-5 sm:p-6" aria-labelledby="broadcasts-heading">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-info-500/10 ring-1 ring-info-500/30">
            <Megaphone className="h-3.5 w-3.5 text-info-400" />
          </span>
          <h2 id="broadcasts-heading" className="font-display text-base font-semibold text-ink">
            Site broadcasts
          </h2>
        </div>
        <ul className="mt-4 space-y-3">
          {broadcasts.length === 0 ? (
            <li className="text-sm text-ink-muted">No new broadcasts.</li>
          ) : (
            broadcasts.map((n) => (
              <li key={n.id} className="rounded-xl border border-hairline bg-canvas-inset/40 p-3">
                <p className="text-sm font-medium text-ink">{n.title}</p>
                {n.body ? <p className="mt-0.5 text-xs text-ink-muted">{n.body}</p> : null}
                <p className="mt-1.5 text-[11px] text-ink-dim">{timeAgo(n.at)}</p>
              </li>
            ))
          )}
        </ul>
      </section>

      <section
        className="surface-card relative overflow-hidden p-5 sm:p-6"
        aria-labelledby="safe-voice-heading"
      >
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent-500/10 ring-1 ring-accent-500/30">
            <ShieldCheck className="h-3.5 w-3.5 text-accent-300" />
          </span>
          <h2 id="safe-voice-heading" className="font-display text-base font-semibold text-ink">
            Voice & feedback
          </h2>
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Surveys are confidential. Suggestions can be submitted anonymously.
        </p>

        <ul className="mt-4 space-y-2">
          {active.slice(0, 2).map((s) => (
            <li key={s.id}>
              <Link
                href="/app/feedback"
                className="group flex items-center gap-3 rounded-xl border border-hairline bg-canvas-inset/40 p-3 transition-colors hover:border-hairline-strong"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-strong text-ink-muted ring-1 ring-hairline-strong">
                  <MessageCircle className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">{s.title}</span>
                  <span className="block text-[11px] text-ink-dim">
                    {s.questionCount} questions · ~{s.estimatedMinutes} min
                  </span>
                </span>
                {s.anonymous ? <Badge tone="accent" size="sm">Anonymous</Badge> : null}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/app/feedback"
          className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-brand-300 hover:text-brand-200"
        >
          Open feedback workspace
        </Link>
      </section>
    </div>
  );
}
