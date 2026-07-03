import Link from "next/link";
import { AlertTriangle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IncidentRow } from "@/components/incidents/incident-row";
import { PageHeader } from "@/components/shared/page-header";
import { IncidentsApi } from "@/lib/api-contracts";

export const metadata = { title: "Incidents · Policy Nest" };

export default async function IncidentsPage() {
  const { data: incidents } = await IncidentsApi.list();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Safety & compliance"
        title="Incident reports"
        description="Track, manage, and report incidents with full audit trails."
        actions={
          <Button variant="primary" size="md" asChild>
            <Link href="/app/incidents/new">
              <Plus className="h-4 w-4" />
              New incident
            </Link>
          </Button>
        }
      />

      {incidents.length === 0 ? (
        <div className="surface-card p-10 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-surface-strong shadow-elev1 ring-1 ring-hairline-strong">
            <AlertTriangle className="h-5 w-5 text-ink-muted" />
          </div>
          <h3 className="mt-4 font-display text-base font-semibold tracking-tight text-ink">
            No incidents reported
          </h3>
          <p className="mt-1 max-w-md text-sm text-ink-muted">
            When an incident is reported, it will appear here with severity, status, and timeline.
          </p>
          <div className="mt-5">
            <Button variant="primary" size="md" asChild>
              <Link href="/app/incidents/new">
                <Plus className="h-4 w-4" />
                Report an incident
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {incidents.map((i) => (
            <li key={i.id}>
              <IncidentRow incident={i} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
