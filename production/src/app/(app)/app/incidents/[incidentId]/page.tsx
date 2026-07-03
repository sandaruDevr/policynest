import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertTriangle, MapPin, Calendar, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { SeverityIndicator } from "@/components/shared/severity-icon";
import { StatusPill } from "@/components/shared/status-pill";
import { getIncident } from "@/lib/data/incidents";
import { formatDate } from "@/lib/utils/format";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: { incidentId: string };
}) {
  const incident = await getIncident(params.incidentId);
  return {
    title: incident ? `${incident.reference} · Incident` : "Incident · Policy Nest",
  };
}

export default async function IncidentDetailPage({
  params,
}: {
  params: { incidentId: string };
}) {
  const incident = await getIncident(params.incidentId);
  if (!incident) return notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Safety & compliance"
        title={`Incident ${incident.reference}`}
        description="Incident details and audit trail."
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/incidents">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to incidents
            </Link>
          </Button>
        }
      />

      <div className="surface-card p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <SeverityIndicator severity={incident.severity} />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink">
                {incident.type.replace("-", " ")}
              </h2>
              {incident.status === "submitted" ? (
                <StatusPill tone="warn" label="Submitted" showDot />
              ) : incident.status === "in-review" ? (
                <StatusPill tone="brand" label="In review" showDot />
              ) : incident.status === "actioned" ? (
                <StatusPill tone="accent" label="Actioned" showDot />
              ) : (
                <StatusPill tone="neutral" label="Closed" showDot />
              )}
              <Badge tone="muted" size="sm">
                {incident.severity}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-3 text-sm text-ink-dim">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(incident.occurredAt)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {incident.location || "Unknown location"}
              </span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-ink">Description</h3>
          <p className="text-sm text-ink-muted leading-relaxed">{incident.description}</p>
        </div>

        {incident.immediateActions ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-ink">Immediate actions taken</h3>
            <p className="text-sm text-ink-muted leading-relaxed">{incident.immediateActions}</p>
          </div>
        ) : null}

        {incident.notifiedParties.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-ink">Notified parties</h3>
            <div className="flex flex-wrap gap-2">
              {incident.notifiedParties.map((party) => (
                <Badge key={party} tone="muted" size="sm">
                  {party}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {incident.aiSuggestedNextSteps ? (
          <div className="rounded-2xl border border-brand-500/20 bg-brand-500/8 p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="h-4 w-4 text-brand-300" />
              <h3 className="text-sm font-medium text-ink">AI suggested next steps</h3>
            </div>
            <ul className="space-y-2">
              {incident.aiSuggestedNextSteps.map((step, i) => (
                <li key={i} className="text-sm text-ink-muted flex gap-2">
                  <span className="text-brand-300">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {incident.followUpRequired ? (
          <div className="rounded-2xl border border-warn-500/20 bg-warn-500/8 p-5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warn-300" />
              <p className="text-sm font-medium text-ink">Follow-up required</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
