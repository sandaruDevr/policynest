"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, Trash2, Pencil, Loader2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import type { AdminSiteDetail } from "@/types/admin";

export function SiteDirectory({ sites }: { sites: AdminSiteDetail[] }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<AdminSiteDetail | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [error, setError] = React.useState("");

  const run = async (key: string, fn: () => Promise<Response>) => {
    setBusy(key);
    setError("");
    try {
      const res = await fn();
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Action failed");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  const remove = (id: string) => {
    if (!confirm("Delete this site? Users assigned here will be unassigned.")) return;
    run(`del-${id}`, () => fetch(`/api/admin/sites/${id}`, { method: "DELETE" }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-muted">
          {sites.length} site{sites.length === 1 ? "" : "s"}
        </p>
        <SiteDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={async (payload) => {
            setBusy("create");
            setError("");
            try {
              const res = await fetch("/api/admin/sites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Create failed");
              }
              setDialogOpen(false);
              router.refresh();
            } catch (err: any) {
              setError(err.message);
            } finally {
              setBusy(null);
            }
          }}
          busy={busy === "create"}
          error={error}
        />
      </div>

      {error && !editing ? (
        <p className="rounded-xl border border-critical-500/30 bg-critical-500/8 px-3 py-2 text-sm text-critical-400">
          {error}
        </p>
      ) : null}

      {sites.length === 0 ? (
        <Card className="p-10 text-center">
          <Building2 className="mx-auto h-8 w-8 text-ink-dim" />
          <p className="mt-3 text-sm text-ink-muted">
            No sites yet. Create your first operational location.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sites.map((s) => (
            <Card key={s.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-ink">
                    {s.name}
                  </p>
                  {s.code ? (
                    <p className="text-[11px] text-ink-dim">Code: {s.code}</p>
                  ) : null}
                  {s.address ? (
                    <p className="mt-1 text-xs text-ink-muted">{s.address}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setEditing(s)}
                  >
                    <Pencil className="h-4 w-4 text-ink-muted" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(s.id)}
                    disabled={busy === `del-${s.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-critical-400" />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted">
                <Users className="h-3.5 w-3.5" />
                {s.userCount} user{s.userCount === 1 ? "" : "s"}
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <SiteDialog
          open
          onOpenChange={(o) => !o && setEditing(null)}
          site={editing}
          onSubmit={async (payload) => {
            setBusy(`edit-${editing.id}`);
            setError("");
            try {
              const res = await fetch(`/api/admin/sites/${editing.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Update failed");
              }
              setEditing(null);
              router.refresh();
            } catch (err: any) {
              setError(err.message);
            } finally {
              setBusy(null);
            }
          }}
          busy={busy === `edit-${editing.id}`}
          error={error}
        />
      )}
    </div>
  );
}

function SiteDialog({
  open,
  onOpenChange,
  site,
  onSubmit,
  busy,
  error,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  site?: AdminSiteDetail;
  onSubmit: (v: { name: string; code?: string | null; address?: string | null }) => void;
  busy: boolean;
  error: string;
}) {
  const [name, setName] = React.useState(site?.name ?? "");
  const [code, setCode] = React.useState(site?.code ?? "");
  const [address, setAddress] = React.useState(site?.address ?? "");

  React.useEffect(() => {
    if (open) {
      setName(site?.name ?? "");
      setCode(site?.code ?? "");
      setAddress(site?.address ?? "");
    }
  }, [open, site]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {!site ? (
          <Button variant="primary" size="md">
            <Plus className="h-4 w-4" /> New site
          </Button>
        ) : null}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{site ? "Edit site" : "Create site"}</DialogTitle>
          <DialogDescription>
            Operational locations drive document applicability and workforce
            assignment.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="mt-2 rounded-xl border border-critical-500/30 bg-critical-500/8 px-3 py-2 text-sm text-critical-400">
            {error}
          </p>
        ) : null}
        <div className="mt-3 space-y-3">
          <Labeled label="Name" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Labeled>
          <Labeled label="Site code">
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. MEL-01" />
          </Labeled>
          <Labeled label="Address">
            <Textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} />
          </Labeled>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() =>
                onSubmit({
                  name,
                  code: code || null,
                  address: address || null,
                })
              }
              disabled={busy || !name.trim()}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {site ? "Save" : "Create"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Labeled({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-ink-muted">
        {label}
        {required ? <span className="text-critical-400"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
