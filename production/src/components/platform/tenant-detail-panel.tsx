"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  FileText,
  Building,
  MapPin,
  CheckCircle2,
  XCircle,
  Clock,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import Link from "next/link";
import { PageHeader, SectionHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format";
import { TENANT_STATUS_LABEL } from "@/types/platform";
import type { TenantDetail, TenantPlan } from "@/types/platform";

const STATUS_TONE: Record<string, "brand" | "critical" | "warn" | "neutral"> = {
  active: "brand",
  suspended: "critical",
  provisioning: "warn",
  archived: "neutral",
};

const LOG_STATUS_ICON: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-4 w-4 text-brand-300" />,
  failed: <XCircle className="h-4 w-4 text-critical-400" />,
  pending: <Clock className="h-4 w-4 text-warn-400" />,
  skipped: <Clock className="h-4 w-4 text-ink-dim" />,
};

export function TenantDetailPanel({
  tenant,
  plans,
}: {
  tenant: TenantDetail;
  plans: TenantPlan[];
}) {
  const router = useRouter();
  const [loading, setLoading] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState({
    name: tenant.name,
    industry: tenant.industry ?? "",
    country: tenant.country ?? "",
    stateOrTerritory: tenant.stateOrTerritory ?? "",
    plan: tenant.plan,
  });

  async function patchTenant(body: Record<string, unknown>, actionLabel: string) {
    setLoading(actionLabel);
    setError(null);
    try {
      const res = await fetch(`/api/platform/tenants/${tenant.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(null);
    }
  }

  async function toggleFeature(feature: string, enabled: boolean) {
    await patchTenant({ featureFlag: { feature, enabled: !enabled } }, `flag-${feature}`);
  }

  const planDetails = tenant.planDetails;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/platform/tenants"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Tenants
        </Link>
      </div>

      <PageHeader
        eyebrow="Tenant Management"
        title={tenant.name}
        description={`${tenant.industry ?? "Unknown industry"} · ${tenant.country ?? "—"}`}
        actions={
          <Badge tone={STATUS_TONE[tenant.status] ?? "neutral"} size="sm">
            {TENANT_STATUS_LABEL[tenant.status]}
          </Badge>
        }
      />

      {error ? (
        <div className="rounded-xl border border-critical-500/30 bg-critical-500/10 px-4 py-3 text-sm text-critical-400">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-brand-300" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Users</p>
              <p className="font-display text-2xl font-semibold text-ink">{tenant.userCount}</p>
              {planDetails ? (
                <p className="text-xs text-ink-muted">of {planDetails.maxUsers} max</p>
              ) : null}
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-accent-300" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Documents</p>
              <p className="font-display text-2xl font-semibold text-ink">{tenant.documentCount}</p>
              {planDetails ? (
                <p className="text-xs text-ink-muted">of {planDetails.maxDocuments} max</p>
              ) : null}
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Building className="h-5 w-5 text-info-400" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Sites</p>
              <p className="font-display text-2xl font-semibold text-ink">{tenant.siteCount}</p>
              {planDetails ? (
                <p className="text-xs text-ink-muted">of {planDetails.maxSites} max</p>
              ) : null}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <SectionHeader title="Edit Details" description="Update tenant metadata and plan" />
          <form
            className="mt-4 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              patchTenant(
                {
                  name: editForm.name,
                  industry: editForm.industry || undefined,
                  country: editForm.country || undefined,
                  stateOrTerritory: editForm.stateOrTerritory || undefined,
                  plan: editForm.plan,
                },
                "save",
              );
            }}
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Name</span>
                <input
                  className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3.5 py-2 text-sm text-ink focus-ring"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Industry</span>
                <input
                  className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3.5 py-2 text-sm text-ink focus-ring"
                  value={editForm.industry}
                  onChange={(e) => setEditForm((f) => ({ ...f, industry: e.target.value }))}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Country</span>
                <input
                  className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3.5 py-2 text-sm text-ink focus-ring"
                  value={editForm.country}
                  onChange={(e) => setEditForm((f) => ({ ...f, country: e.target.value }))}
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">State / Territory</span>
                <input
                  className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3.5 py-2 text-sm text-ink focus-ring"
                  value={editForm.stateOrTerritory}
                  onChange={(e) => setEditForm((f) => ({ ...f, stateOrTerritory: e.target.value }))}
                />
              </label>
              <label className="block space-y-1.5 sm:col-span-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">Plan</span>
                <select
                  className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3.5 py-2 text-sm text-ink focus-ring"
                  value={editForm.plan}
                  onChange={(e) => setEditForm((f) => ({ ...f, plan: e.target.value }))}
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label} — {p.maxUsers} users, {p.maxDocuments} docs, {p.storageGb}GB
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading === "save"}>
                {loading === "save" ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <SectionHeader title="Lifecycle" description="Suspend or reactivate this tenant" />
            <div className="mt-4 flex items-center gap-3">
              {tenant.status === "active" ? (
                <Button
                  variant="danger"
                  onClick={() => patchTenant({ status: "suspended" }, "suspend")}
                  disabled={loading === "suspend"}
                >
                  {loading === "suspend" ? "Suspending..." : "Suspend Tenant"}
                </Button>
              ) : (
                <Button
                  variant="accent"
                  onClick={() => patchTenant({ status: "active" }, "activate")}
                  disabled={loading === "activate"}
                >
                  {loading === "activate" ? "Activating..." : "Activate Tenant"}
                </Button>
              )}
              <span className="text-xs text-ink-muted">
                Current status: <strong className="text-ink">{TENANT_STATUS_LABEL[tenant.status]}</strong>
              </span>
            </div>
          </Card>

          {planDetails ? (
            <Card className="p-6">
              <SectionHeader title="Plan Details" description={planDetails.label} />
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Detail label="Max Users" value={planDetails.maxUsers} />
                <Detail label="Max Documents" value={planDetails.maxDocuments} />
                <Detail label="Max Sites" value={planDetails.maxSites} />
                <Detail label="Storage" value={`${planDetails.storageGb} GB`} />
                <Detail
                  label="AI Queries/mo"
                  value={planDetails.aiQueriesPerMonth ?? "Unlimited"}
                />
                <Detail label="HITL" value={planDetails.hitlEnabled ? "Enabled" : "Disabled"} />
                <Detail
                  label="Golden Answers"
                  value={planDetails.goldenAnswersEnabled ? "Enabled" : "Disabled"}
                />
                <Detail
                  label="Custom Guidance"
                  value={planDetails.customGuidanceEnabled ? "Enabled" : "Disabled"}
                />
              </dl>
            </Card>
          ) : null}
        </div>
      </div>

      {tenant.featureFlags.length > 0 ? (
        <Card className="p-6">
          <SectionHeader title="Feature Flags" description="Per-tenant feature toggles" />
          <ul className="mt-4 space-y-2">
            {tenant.featureFlags.map((f) => (
              <li
                key={f.feature}
                className="flex items-center justify-between rounded-xl border border-hairline/50 bg-surface/40 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{f.feature}</p>
                  <p className="text-xs text-ink-dim">Updated {formatDate(f.updatedAt)}</p>
                </div>
                <button
                  onClick={() => toggleFeature(f.feature, f.enabled)}
                  disabled={loading === `flag-${f.feature}`}
                  className="flex items-center gap-2 text-sm"
                >
                  {f.enabled ? (
                    <ToggleRight className="h-6 w-6 text-brand-300" />
                  ) : (
                    <ToggleLeft className="h-6 w-6 text-ink-dim" />
                  )}
                  <span className={f.enabled ? "text-brand-300" : "text-ink-muted"}>
                    {f.enabled ? "Enabled" : "Disabled"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {tenant.provisioningLog.length > 0 ? (
        <Card className="p-6">
          <SectionHeader title="Provisioning Log" description="Automated onboarding steps" />
          <ul className="mt-4 space-y-2">
            {tenant.provisioningLog.map((l) => (
              <li
                key={l.id}
                className="flex items-start gap-3 rounded-xl border border-hairline/50 bg-surface/40 px-4 py-3"
              >
                {LOG_STATUS_ICON[l.status] ?? <Clock className="h-4 w-4 text-ink-dim" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{l.step}</p>
                  {l.detail ? (
                    <p className="text-xs text-ink-muted">{l.detail}</p>
                  ) : null}
                </div>
                <span className="shrink-0 text-[11px] text-ink-dim">
                  {formatDate(l.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{value}</dd>
    </div>
  );
}
