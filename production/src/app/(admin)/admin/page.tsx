import Link from "next/link";
import {
  FileText,
  FileCheck2,
  Clock3,
  Users,
  Building2,
  AlertTriangle,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/admin/stat-card";
import { getAdminContext } from "@/lib/data/admin/session";
import { getAdminDashboard } from "@/lib/data/admin/dashboard";

export const metadata = { title: "Dashboard · Policy Nest Admin" };
export const dynamic = "force-dynamic";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_TONE: Record<string, "brand" | "accent" | "warn" | "neutral"> = {
  in_review: "warn",
  published: "accent",
  approved: "brand",
  draft: "neutral",
};

export default async function AdminDashboardPage() {
  const [context, dash] = await Promise.all([
    getAdminContext(),
    getAdminDashboard(),
  ]);

  const firstName =
    context?.profile.fullName?.split(" ")[0] ?? "Administrator";

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${firstName}`}
        description="Operational readiness, document governance, and workforce status for your organization."
      />

      {/* Primary metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Published policies"
          value={dash.documents.published}
          icon={FileCheck2}
          tone="accent"
          hint={`${dash.documents.total} documents total`}
        />
        <StatCard
          label="Pending approvals"
          value={dash.documents.inReview}
          icon={Clock3}
          tone="warn"
          hint="Awaiting review & publish"
        />
        <StatCard
          label="Open incidents"
          value={dash.incidents.open}
          icon={AlertTriangle}
          tone={dash.incidents.open > 0 ? "critical" : "neutral"}
          hint="Submitted or under review"
        />
        <StatCard
          label="Drafts"
          value={dash.documents.draft}
          icon={FileText}
          tone="neutral"
          hint="Not yet submitted"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Users"
          value={dash.people.users}
          icon={Users}
          tone="brand"
          hint="Active workforce profiles"
        />
        <StatCard
          label="Sites"
          value={dash.people.sites}
          icon={Building2}
          tone="info"
          hint="Operational locations"
        />
        <StatCard
          label="Acknowledgement policies"
          value={dash.acknowledgements.requiredDocuments}
          icon={FileCheck2}
          tone="neutral"
          hint="Published & require sign-off"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending reviews */}
        <Card className="p-5 sm:p-6">
          <SectionHeader
            title="Pending approvals"
            description="Documents awaiting your review"
            actions={
              <Link
                href="/admin/documents"
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-300 hover:text-brand-200"
              >
                Open documents <ArrowRight className="h-3 w-3" />
              </Link>
            }
          />
          <div className="mt-4 space-y-2">
            {dash.pendingReviews.length === 0 ? (
              <EmptyRow text="Nothing awaiting approval." />
            ) : (
              dash.pendingReviews.map((d) => (
                <Link
                  key={d.id}
                  href={`/admin/documents/${d.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface px-3 py-2.5 transition-all hover:border-hairline-strong hover:bg-white/[.03]"
                >
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium text-ink">
                      {d.title}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      {d.version} · updated {formatDate(d.updatedAt)}
                    </p>
                  </div>
                  <Badge tone={STATUS_TONE[d.status] ?? "neutral"} size="sm">
                    In review
                  </Badge>
                </Link>
              ))
            )}
          </div>
        </Card>

        {/* Upcoming expiries */}
        <Card className="p-5 sm:p-6">
          <SectionHeader
            title="Upcoming reviews & expiries"
            description="Published policies expiring within 30 days"
          />
          <div className="mt-4 space-y-2">
            {dash.upcomingExpiries.length === 0 ? (
              <EmptyRow text="No policies expiring soon." />
            ) : (
              dash.upcomingExpiries.map((d) => (
                <Link
                  key={d.id}
                  href={`/admin/documents/${d.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-hairline bg-surface px-3 py-2.5 transition-all hover:border-hairline-strong hover:bg-white/[.03]"
                >
                  <div className="min-w-0">
                    <p className="line-clamp-1 text-sm font-medium text-ink">
                      {d.title}
                    </p>
                    <p className="text-[11px] text-ink-muted">{d.version}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs text-warn-400">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {formatDate(d.expiryDate)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-hairline bg-surface/50 px-3 py-6 text-center text-sm text-ink-muted">
      {text}
    </div>
  );
}
