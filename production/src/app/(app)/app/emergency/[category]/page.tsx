import { notFound } from "next/navigation";
import { EmergencyApi } from "@/lib/api-contracts";
import { PageHeader } from "@/components/shared/page-header";
import { Phone, AlertTriangle, ChevronRight, Siren, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const ICON_MAP: Record<string, LucideIcon> = {
  fire: Siren,
  medical: AlertTriangle,
  aggression: ShieldAlert,
  "incident-sirs": ShieldAlert,
  facility: AlertTriangle,
};

export default async function EmergencyProtocolPage({
  params,
}: {
  params: { category: string };
}) {
  const { data: protocol } = await EmergencyApi.protocol(params.category);

  if (!protocol) {
    notFound();
  }

  const Icon = ICON_MAP[protocol.category] || AlertTriangle;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Emergency protocol"
        title={protocol.title}
        description={protocol.description}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="surface-card p-5 sm:p-6" aria-label="Steps">
            <div className="flex items-center gap-3 mb-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-critical-500/12 ring-1 ring-critical-500/30 text-critical-300">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-base font-semibold tracking-tight text-ink">
                  Steps
                </h2>
                <p className="text-xs text-ink-muted capitalize">
                  {protocol.category.replace("-", " ")}
                </p>
              </div>
            </div>

            <ol className="space-y-4">
              {protocol.steps.map((step) => (
                <li
                  key={step.index}
                  className="flex items-start gap-4 rounded-xl border border-hairline bg-canvas-inset/40 p-4"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-strong ring-1 ring-hairline-strong text-xs font-semibold text-ink-muted">
                    {step.index}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{step.title}</p>
                    <p className="mt-1 text-sm text-ink-muted">{step.detail}</p>
                    {step.caution ? (
                      <p className="mt-2 text-xs text-critical-300">
                        Caution: {step.caution}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>

            {protocol.steps.length === 0 ? (
              <p className="text-sm text-ink-muted">No steps defined for this protocol.</p>
            ) : null}
          </section>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <section className="surface-card p-5" aria-label="Contacts">
            <h2 className="font-display text-base font-semibold tracking-tight text-ink mb-3">
              Key contacts
            </h2>
            <div className="space-y-3">
              {protocol.contacts.map((c) => (
                <div
                  key={c.id}
                  className="flex items-start gap-3 rounded-xl border border-critical-500/20 bg-critical-500/6 p-3"
                >
                  <a
                    href={`tel:${c.phone}`}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-critical-500/15 ring-1 ring-critical-500/30 text-critical-300 transition-colors hover:bg-critical-500/25"
                    aria-label={`Call ${c.label}`}
                  >
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{c.label}</p>
                    <a href={`tel:${c.phone}`} className="text-xs text-ink-muted hover:text-ink underline-offset-2 hover:underline">
                      {c.phone}
                    </a>
                    <p className="mt-0.5 text-[11px] text-ink-dim">{c.role}</p>
                  </div>
                </div>
              ))}
              {protocol.contacts.length === 0 ? (
                <p className="text-sm text-ink-muted">No contacts linked.</p>
              ) : null}
            </div>
          </section>

          {protocol.linkedDocumentIds.length > 0 ? (
            <section className="surface-card p-5" aria-label="Documents">
              <h2 className="font-display text-base font-semibold tracking-tight text-ink mb-3">
                Linked documents
              </h2>
              <ul className="space-y-2">
                {protocol.linkedDocumentIds.map((docId) => (
                  <li key={docId}>
                    <a
                      href={`/app/library/${docId}`}
                      className="flex items-center gap-2 text-sm text-brand-300 hover:text-brand-200"
                    >
                      Open document
                      <ChevronRight className="h-3.5 w-3.5" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
