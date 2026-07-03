import { ActivityApi } from "@/lib/api-contracts";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "History · Policy Nest" };

export default async function HistoryPage() {
  const { data: activity } = await ActivityApi.list();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity log"
        title="History"
        description="Your recent activity across the platform."
      />

      <ul className="space-y-2">
        {activity.map((a: { id: string; kind: string; title: string; meta?: string; at: string }) => (
          <li
            key={a.id}
            className="flex items-start gap-4 rounded-xl border border-hairline bg-canvas-inset/40 p-4"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-strong ring-1 ring-hairline-strong">
              <span className="text-xs text-ink-muted">{a.kind.slice(0, 2).toUpperCase()}</span>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">{a.title}</p>
              <p className="mt-0.5 text-xs text-ink-dim">{a.meta || ""}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-xs text-ink-dim">{formatDate(a.at)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
