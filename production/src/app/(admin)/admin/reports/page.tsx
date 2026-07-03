import * as React from "react";
import {
  AlertTriangle,
  BadgeCheck,
  BookOpenCheck,
  FileCheck2,
  GraduationCap,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/admin/stat-card";
import {
  BarList,
  DonutChart,
  ProgressRing,
  TrendChart,
} from "@/components/admin/reports/charts";
import { getAdminAnalytics } from "@/lib/data/admin/analytics";

export const metadata = { title: "Reports · Policy Nest Admin" };
export const dynamic = "force-dynamic";

function pct(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export default async function ReportsPage() {
  const a = await getAdminAnalytics();

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Insights"
        title="Reports & Analytics"
        description="Operational analytics grounded in real tenant data across policy, workforce, and compliance."
      />

      {/* Headline metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Published policies"
          value={
            a.documents.byStatus.find((s) => s.label === "published")?.value ?? 0
          }
          icon={FileCheck2}
          tone="accent"
          hint={`${a.documents.total} documents total`}
        />
        <StatCard
          label="Ack. completion"
          value={pct(a.acknowledgements.completionRate)}
          icon={BadgeCheck}
          tone={a.acknowledgements.completionRate >= 0.9 ? "accent" : "warn"}
          hint={`${a.acknowledgements.completedSignatures}/${a.acknowledgements.expectedSignatures} signatures`}
        />
        <StatCard
          label="Training completion"
          value={pct(a.training.completionRate)}
          icon={GraduationCap}
          tone={a.training.completionRate >= 0.9 ? "accent" : "warn"}
          hint={`${a.training.overdue} overdue`}
        />
        <StatCard
          label="Open incidents"
          value={a.incidents.open}
          icon={AlertTriangle}
          tone={a.incidents.open > 0 ? "critical" : "neutral"}
          hint={`${a.incidents.total} all-time`}
        />
      </div>

      {/* Document lifecycle + acknowledgements */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 sm:p-6 lg:col-span-2">
          <SectionHeader
            title="Policy lifecycle"
            description="Documents by governance status"
          />
          <div className="mt-4">
            <BarList data={a.documents.byStatus} />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-hairline pt-4 text-center">
            <div>
              <p className="font-display text-xl font-semibold text-warn-400">
                {a.documents.expiringSoon}
              </p>
              <p className="text-[11px] text-ink-muted">Expiring in 30 days</p>
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-critical-400">
                {a.documents.overdueReview}
              </p>
              <p className="text-[11px] text-ink-muted">Overdue review</p>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col items-center justify-center p-5 sm:p-6">
          <SectionHeader
            title="Acknowledgements"
            description="Required policy sign-off"
          />
          <div className="mt-2">
            <ProgressRing
              value={a.acknowledgements.completionRate}
              label="signed"
              tone="#10b981"
            />
          </div>
          <p className="mt-3 text-center text-xs text-ink-muted">
            {a.acknowledgements.requiredDocuments} policies require sign-off
          </p>
        </Card>
      </div>

      {/* Incidents */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 sm:p-6 lg:col-span-2">
          <SectionHeader
            title="Incident trend"
            description="Reported incidents over the last 30 days"
            actions={
              <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                <TrendingUp className="h-3.5 w-3.5" /> {a.incidents.total} total
              </span>
            }
          />
          <div className="mt-4">
            <TrendChart data={a.incidents.trend} />
          </div>
        </Card>
        <Card className="p-5 sm:p-6">
          <SectionHeader title="Incidents by type" />
          <div className="mt-4">
            <BarList
              data={a.incidents.byType.slice(0, 6)}
              emptyText="No incidents reported."
            />
          </div>
        </Card>
      </div>

      {/* Credentials + training + AI */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 sm:p-6">
          <SectionHeader
            title="Credential status"
            description="Workforce certifications"
          />
          <div className="mt-4">
            <DonutChart
              data={[
                { label: "valid", value: a.credentials.valid },
                { label: "expiring", value: a.credentials.expiringSoon },
                { label: "expired", value: a.credentials.expired },
              ].filter((d) => d.value > 0)}
              emptyText="No credentials recorded."
            />
          </div>
          {a.credentials.expired > 0 ? (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-critical-400">
              <ShieldAlert className="h-3.5 w-3.5" />
              {a.credentials.expired} expired credential
              {a.credentials.expired === 1 ? "" : "s"}
            </p>
          ) : null}
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeader
            title="Training status"
            description="Assignment progress"
          />
          <div className="mt-4">
            <BarList
              data={a.training.byStatus}
              emptyText="No training assigned."
            />
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <SectionHeader
            title="Nestor AI (30d)"
            description="Policy intelligence usage"
          />
          <div className="mt-4 space-y-3">
            <Metric
              icon={Sparkles}
              label="Total queries"
              value={a.ai.totalQueries}
            />
            <Metric
              icon={AlertTriangle}
              label="Escalation rate"
              value={pct(a.ai.escalationRate)}
            />
            <Metric
              icon={BookOpenCheck}
              label="Avg confidence"
              value={a.ai.avgConfidence != null ? pct(a.ai.avgConfidence) : "—"}
            />
            <Metric
              icon={ShieldAlert}
              label="Pending review"
              value={a.ai.pendingReviews}
            />
          </div>
        </Card>
      </div>

      {/* Sites + surveys */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 sm:p-6 lg:col-span-2">
          <SectionHeader
            title="Workforce by site"
            description="Active users per operational location"
          />
          <div className="mt-4">
            <BarList data={a.sites} emptyText="No sites configured." />
          </div>
        </Card>
        <Card className="flex flex-col items-center justify-center p-5 sm:p-6">
          <SectionHeader title="Survey completion" />
          <div className="mt-2">
            <ProgressRing
              value={a.surveys.completionRate}
              label="completed"
              tone="#0ea5e9"
            />
          </div>
          <p className="mt-3 text-center text-xs text-ink-muted">
            {a.surveys.completed}/{a.surveys.totalAssignments} survey responses
          </p>
        </Card>
      </div>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="inline-flex items-center gap-2 text-sm text-ink-muted">
        <Icon className="h-4 w-4 text-ink-dim" />
        {label}
      </span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}
