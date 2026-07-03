"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search, Building2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CreateTenantDialog } from "@/components/platform/create-tenant-dialog";
import { formatDate } from "@/lib/utils/format";
import { TENANT_STATUS_LABEL } from "@/types/platform";
import type { PlatformTenantSummary, TenantPlan } from "@/types/platform";

const STATUS_TONE: Record<string, "brand" | "critical" | "warn" | "neutral"> = {
  active: "brand",
  suspended: "critical",
  provisioning: "warn",
  archived: "neutral",
};

export function TenantDirectory({
  tenants,
  plans,
}: {
  tenants: PlatformTenantSummary[];
  plans: TenantPlan[];
}) {
  const [query, setQuery] = React.useState("");
  const [createOpen, setCreateOpen] = React.useState(false);

  const filtered = React.useMemo(() => {
    if (!query) return tenants;
    const q = query.toLowerCase();
    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        (t.industry ?? "").toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        t.plan.toLowerCase().includes(q),
    );
  }, [tenants, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform Operations"
        title="Tenants"
        description="Provision, manage, and monitor all customer organizations on the platform."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Provision Tenant
          </Button>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, industry, status..."
          className="pl-9"
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline text-left">
                <th className="px-4 py-3 font-medium text-ink-dim">Name</th>
                <th className="px-4 py-3 font-medium text-ink-dim">Status</th>
                <th className="px-4 py-3 font-medium text-ink-dim">Plan</th>
                <th className="px-4 py-3 text-right font-medium text-ink-dim">Users</th>
                <th className="px-4 py-3 text-right font-medium text-ink-dim">Docs</th>
                <th className="px-4 py-3 text-right font-medium text-ink-dim">Sites</th>
                <th className="px-4 py-3 font-medium text-ink-dim">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Building2 className="mx-auto mb-3 h-8 w-8 text-ink-dim" />
                    <p className="text-ink-muted">
                      {query
                        ? "No tenants match your search."
                        : "No customer tenants yet. Provision one to get started."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-hairline/50 last:border-0 transition-colors hover:bg-white/[.02]"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/platform/tenants/${t.id}`}
                        className="block"
                      >
                        <p className="font-medium text-ink hover:text-brand-300">
                          {t.name}
                        </p>
                        <p className="text-xs text-ink-dim">
                          {t.industry ?? "—"}
                          {t.country ? ` · ${t.country}` : ""}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATUS_TONE[t.status] ?? "neutral"} size="sm">
                        {TENANT_STATUS_LABEL[t.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-ink-muted capitalize">
                      {t.plan}
                    </td>
                    <td className="px-4 py-3 text-right text-ink">
                      {t.userCount}
                    </td>
                    <td className="px-4 py-3 text-right text-ink">
                      {t.documentCount}
                    </td>
                    <td className="px-4 py-3 text-right text-ink">
                      {t.siteCount}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {formatDate(t.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CreateTenantDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        plans={plans}
      />
    </div>
  );
}
