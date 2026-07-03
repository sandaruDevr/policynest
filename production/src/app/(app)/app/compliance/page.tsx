import { ComplianceApi } from "@/lib/api-contracts";
import { PageHeader } from "@/components/shared/page-header";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const metadata = { title: "Compliance · Policy Nest" };

export default async function CompliancePage() {
  const [{ data: summary }, { data: items }] = await Promise.all([
    ComplianceApi.summary(),
    ComplianceApi.items(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Regulatory"
        title="Compliance overview"
        description="Track your compliance status across training, documents, and credentials."
      />

      <div className="surface-card p-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-dim">
              Overall score
            </p>
            <p className="mt-2 text-3xl font-display font-semibold tracking-tight text-ink">
              {summary.overallPercent}%
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-dim">
              Acknowledgements
            </p>
            <p className="mt-2 text-3xl font-display font-semibold tracking-tight text-ink">
              {summary.acknowledgementsDone} / {summary.acknowledgementsTotal}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-dim">
              Overdue
            </p>
            <p className="mt-2 text-3xl font-display font-semibold tracking-tight text-critical-300">
              {summary.overdueCount}
            </p>
          </div>
        </div>
        <Separator className="my-6" />
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-ink">Training</span>
              <span className="text-ink-muted">
                {summary.trainingTotal > 0
                  ? `${Math.round((summary.trainingDone / summary.trainingTotal) * 100)}%`
                  : "0%"}
              </span>
            </div>
            <Progress
              value={summary.trainingTotal > 0 ? (summary.trainingDone / summary.trainingTotal) * 100 : 0}
              tone="brand"
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="text-ink">Credentials</span>
              <span className="text-ink-muted">
                {summary.credentialsTotal > 0
                  ? `${Math.round((summary.credentialsValid / summary.credentialsTotal) * 100)}%`
                  : "0%"}
              </span>
            </div>
            <Progress
              value={summary.credentialsTotal > 0 ? (summary.credentialsValid / summary.credentialsTotal) * 100 : 0}
              tone="brand"
            />
          </div>
        </div>
      </div>

      <section aria-label="Compliance items">
        <h2 className="font-display text-base font-semibold tracking-tight text-ink mb-3">
          Items
        </h2>
        <ul className="space-y-2">
          {items.map((i: { id: string; title: string; kind: string; dueAt?: string; state: string }) => (
            <li
              key={i.id}
              className="flex items-center justify-between rounded-xl border border-hairline bg-canvas-inset/40 p-4"
            >
              <div>
                <p className="text-sm font-medium text-ink">{i.title}</p>
                <p className="mt-0.5 text-xs text-ink-dim capitalize">{i.kind.replace("-", " ")}</p>
              </div>
              <div className="flex items-center gap-3">
                {i.dueAt ? (
                  <span className="text-xs text-ink-dim">
                    Due {new Date(i.dueAt).toLocaleDateString()}
                  </span>
                ) : null}
                <Badge
                  tone={i.state === "complete" ? "accent" : i.state === "overdue" ? "critical" : "neutral"}
                  size="sm"
                >
                  {i.state.replace("-", " ")}
                </Badge>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
