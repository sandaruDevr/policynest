import {
  Building2,
  Users,
  FileText,
  MessageSquare,
  ShieldAlert,
  TrendingUp,
  Activity,
} from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils/format";
import { getPlatformMetrics } from "@/lib/data/platform/dashboard";
import { listTenants } from "@/lib/data/platform/tenants";
import { listPlatformAudit } from "@/lib/data/platform/audit";
import { TENANT_STATUS_LABEL } from "@/types/platform";

export const metadata = { title: "Platform Dashboard · CareSuite" };
export const dynamic = "force-dynamic";

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export default async function PlatformDashboardPage() {
  const [metrics, tenants, audit] = await Promise.all([
    getPlatformMetrics(),
    listTenants(),
    listPlatformAudit(10),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Platform Operations"
        title="Dashboard"
        description="Real-time platform health, tenant growth, and AI governance metrics across the CareSuite ecosystem."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Tenants"
          value={metrics.activeTenants}
          icon={Building2}
          tone="brand"
          hint={`${metrics.totalTenants} total · ${metrics.suspendedTenants} suspended`}
        />
        <StatCard
          label="Total Users"
          value={metrics.totalUsers}
          icon={Users}
          tone="info"
          hint="Across all customer tenants"
        />
        <StatCard
          label="Published Documents"
          value={metrics.publishedDocuments}
          icon={FileText}
          tone="accent"
          hint={`${metrics.totalDocuments} total documents`}
        />
        <StatCard
          label="AI Queries"
          value={metrics.totalQueries}
          icon={MessageSquare}
          tone="neutral"
          hint={`${pct(metrics.escalationRate)} escalation rate`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending Reviews"
          value={metrics.pendingReviews}
          icon={ShieldAlert}
          tone={metrics.pendingReviews > 0 ? "warn" : "neutral"}
          hint="HITL queue items"
        />
        <StatCard
          label="Open Incidents"
          value={metrics.openIncidents}
          icon={TrendingUp}
          tone={metrics.openIncidents > 0 ? "critical" : "neutral"}
          hint="Submitted or reviewing"
        />
        <StatCard
          label="Escalated Queries"
          value={metrics.escalatedQueries}
          icon={Activity}
          tone="warn"
          hint="Routed to human review"
        />
        <StatCard
          label="Provisioning"
          value={metrics.provisioningTenants}
          icon={Building2}
          tone="info"
          hint="Tenants in onboarding"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <SectionHeader
            title="Tenant Directory"
            description="Customer organizations across the platform"
          />
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hairline text-left">
                  <th className="pb-2 pr-4 font-medium text-ink-dim">Name</th>
                  <th className="pb-2 pr-4 font-medium text-ink-dim">Status</th>
                  <th className="pb-2 pr-4 font-medium text-ink-dim">Plan</th>
                  <th className="pb-2 pr-4 text-right font-medium text-ink-dim">Users</th>
                  <th className="pb-2 text-right font-medium text-ink-dim">Docs</th>
                </tr>
              </thead>
              <tbody>
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-ink-muted">
                      No customer tenants yet.
                    </td>
                  </tr>
                ) : (
                  tenants.slice(0, 10).map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-hairline/50 last:border-0"
                    >
                      <td className="py-2.5 pr-4">
                        <p className="font-medium text-ink">{t.name}</p>
                        <p className="text-xs text-ink-dim">
                          {t.industry ?? "—"}
                          {t.country ? ` · ${t.country}` : ""}
                        </p>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge
                          tone={
                            t.status === "active"
                              ? "brand"
                              : t.status === "suspended"
                                ? "critical"
                                : "warn"
                          }
                          size="sm"
                        >
                          {TENANT_STATUS_LABEL[t.status]}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-ink-muted">
                        {t.plan}
                      </td>
                      <td className="py-2.5 pr-4 text-right text-ink">
                        {t.userCount}
                      </td>
                      <td className="py-2.5 text-right text-ink">
                        {t.documentCount}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeader
            title="Platform Activity"
            description="Recent governance actions"
          />
          <ul className="mt-4 space-y-3">
            {audit.length === 0 ? (
              <li className="py-4 text-center text-sm text-ink-muted">
                No platform actions recorded yet.
              </li>
            ) : (
              audit.map((a) => (
                <li
                  key={a.id}
                  className="flex items-start gap-3 rounded-lg border border-hairline/50 bg-surface/40 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{a.action}</p>
                    {a.summary ? (
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {a.summary}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-[11px] text-ink-dim">
                    {formatDate(a.createdAt)}
                  </span>
                </li>
              ))
            )}
          </ul>
        </Card>
      </div>
    </div>
  );
}
