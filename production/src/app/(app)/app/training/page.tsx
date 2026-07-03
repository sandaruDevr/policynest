import { TrainingApi } from "@/lib/api-contracts";
import { ModuleCard } from "@/components/training/module-card";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Training · CareSuite" };

export default async function TrainingPage() {
  const [{ data: modules }, { data: induction }, { data: credentials }] =
    await Promise.all([
      TrainingApi.modules(),
      TrainingApi.induction(),
      TrainingApi.credentials(),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learning & development"
        title="Training & induction"
        description="Track your progress on required modules, induction steps, and credentials."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section aria-label="Modules">
            <h2 className="font-display text-base font-semibold tracking-tight text-ink mb-3">
              Training modules
            </h2>
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {modules.map((m) => (
                <li key={m.id} className="h-full">
                  <ModuleCard module={m} />
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <section className="surface-card p-5" aria-label="Induction">
            <h2 className="font-display text-base font-semibold tracking-tight text-ink mb-3">
              Induction
            </h2>
            <div className="space-y-3">
              {induction.map((s: { id: string; title: string; status: string }, i: number) => (
                <div
                  key={s.id}
                  className={`flex items-start gap-3 rounded-xl border p-3 ${
                    s.status === "completed"
                      ? "border-accent-500/30 bg-accent-500/8"
                      : "border-hairline bg-canvas-inset/40"
                  }`}
                >
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-xs font-semibold ${
                      s.status === "completed"
                        ? "bg-accent-500/20 text-accent-300"
                        : "bg-surface-strong text-ink-muted"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{s.title}</p>
                  </div>
                  {s.status === "completed" ? (
                    <Badge tone="accent" size="sm">Done</Badge>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="surface-card p-5" aria-label="Credentials">
            <h2 className="font-display text-base font-semibold tracking-tight text-ink mb-3">
              Credentials
            </h2>
            <div className="space-y-3">
              {credentials.map((c: { id: string; name: string; expiresAt?: string; status: string }) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-hairline bg-canvas-inset/40 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{c.name}</p>
                    <p className="mt-0.5 text-[11px] text-ink-dim">
                      {c.expiresAt ? `Expires ${formatDate(c.expiresAt)}` : "No expiry"}
                    </p>
                  </div>
                  <Badge tone={c.status === "valid" ? "accent" : "critical"} size="sm">
                    {c.status === "valid" ? "Valid" : "Expired"}
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
