"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { TenantPlan } from "@/types/platform";

interface CreateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plans: TenantPlan[];
}

export function CreateTenantDialog({
  open,
  onOpenChange,
  plans,
}: CreateTenantDialogProps) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    name: "",
    industry: "",
    country: "Australia",
    stateOrTerritory: "",
    plan: "standard",
    defaultSiteName: "Main Site",
    defaultSiteCode: "HQ",
  });

  const update = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/platform/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          industry: form.industry || undefined,
          country: form.country || undefined,
          stateOrTerritory: form.stateOrTerritory || undefined,
          plan: form.plan,
          defaultSiteName: form.defaultSiteName || undefined,
          defaultSiteCode: form.defaultSiteCode || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create tenant");
        return;
      }

      onOpenChange(false);
      setForm({
        name: "",
        industry: "",
        country: "Australia",
        stateOrTerritory: "",
        plan: "standard",
        defaultSiteName: "Main Site",
        defaultSiteCode: "HQ",
      });
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Provision New Tenant</DialogTitle>
          <DialogDescription>
            Creates a new organization with default AI settings and a primary site.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Organization Name" required>
              <Input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                placeholder="e.g. Sunrise Care"
                required
                minLength={2}
              />
            </Field>
            <Field label="Industry">
              <Input
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
                placeholder="e.g. Aged Care"
              />
            </Field>
            <Field label="Country">
              <Input
                value={form.country}
                onChange={(e) => update("country", e.target.value)}
              />
            </Field>
            <Field label="State / Territory">
              <Input
                value={form.stateOrTerritory}
                onChange={(e) => update("stateOrTerritory", e.target.value)}
                placeholder="e.g. NSW"
              />
            </Field>
            <Field label="Default Site Name">
              <Input
                value={form.defaultSiteName}
                onChange={(e) => update("defaultSiteName", e.target.value)}
              />
            </Field>
            <Field label="Default Site Code">
              <Input
                value={form.defaultSiteCode}
                onChange={(e) => update("defaultSiteCode", e.target.value)}
              />
            </Field>
          </div>

          <Field label="Plan">
            <select
              value={form.plan}
              onChange={(e) => update("plan", e.target.value)}
              className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3.5 py-2 text-sm text-ink focus-ring"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — {p.maxUsers} users, {p.maxDocuments} docs
                </option>
              ))}
            </select>
          </Field>

          {error ? (
            <p className="text-sm text-critical-400">{error}</p>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !form.name}>
              {loading ? "Provisioning..." : "Provision Tenant"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-dim">
        {label}
        {required ? <span className="text-critical-400"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
