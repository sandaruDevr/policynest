"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Users,
  Plus,
  Loader2,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  UserCheck,
  UserX,
  Copy,
  Check,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { SYSTEM_ROLE_LABEL } from "@/types/admin";
import type { AdminUser, UserStatus } from "@/types/admin";

const STATUS_FILTER = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "invited", label: "Invited" },
  { key: "inactive", label: "Inactive" },
] as const;

const ROLE_OPTIONS = [
  { value: "staff", label: "Staff" },
  { value: "organisation_admin", label: "Organization Admin" },
  { value: "compliance_manager", label: "Compliance Manager" },
];

export function UserDirectory({
  users,
  sites,
}: {
  users: AdminUser[];
  sites: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [status, setStatus] = React.useState<UserStatus | "all">("all");
  const [search, setSearch] = React.useState("");
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState("");
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteResult, setInviteResult] = React.useState<{
    email: string;
    tempPassword: string;
  } | null>(null);

  const counts = React.useMemo(() => {
    const map: Record<string, number> = { all: users.length };
    for (const u of users) map[u.status] = (map[u.status] || 0) + 1;
    return map;
  }, [users]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (status !== "all" && u.status !== status) return false;
      if (q) {
        const hay = `${u.fullName ?? ""} ${u.email ?? ""} ${u.staffRole ?? ""} ${u.jobTitle ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [users, status, search]);

  const patch = async (id: string, patch: Record<string, unknown>) => {
    setBusy(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Update failed");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="pl-9"
          />
        </div>
        <InviteDialog
          open={inviteOpen}
          onOpenChange={setInviteOpen}
          sites={sites}
          onInvite={async (payload) => {
            setBusy("invite");
            setError("");
            try {
              const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Invite failed");
              setInviteResult({
                email: payload.email,
                tempPassword: data.data.tempPassword,
              });
              router.refresh();
            } catch (err: any) {
              setError(err.message);
            } finally {
              setBusy(null);
            }
          }}
          busy={busy === "invite"}
          error={error}
          result={inviteResult}
          onClearResult={() => setInviteResult(null)}
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_FILTER.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-all",
              status === f.key
                ? "border-brand-500/50 bg-brand-500/12 text-brand-200"
                : "border-hairline bg-surface text-ink-muted hover:text-ink",
            )}
          >
            {f.label}
            <span className="text-ink-dim">{counts[f.key] ?? 0}</span>
          </button>
        ))}
      </div>

      {error && !inviteResult ? (
        <p className="rounded-xl border border-critical-500/30 bg-critical-500/8 px-3 py-2 text-sm text-critical-400">
          {error}
        </p>
      ) : null}

      {filtered.length === 0 ? (
        <Card className="p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-ink-dim" />
          <p className="mt-3 text-sm text-ink-muted">
            {users.length === 0
              ? "No users yet. Invite your first team member."
              : "No users match your filters."}
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-hairline overflow-hidden p-0">
          {filtered.map((u) => (
            <div
              key={u.id}
              className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-ink">
                    {u.preferredName || u.fullName || "Unnamed"}
                  </p>
                  <UserStatusBadge status={u.status} />
                  <RoleBadge role={u.role} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                  {u.email ? (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {u.email}
                    </span>
                  ) : null}
                  {u.phone ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {u.phone}
                    </span>
                  ) : null}
                  {u.siteName ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {u.siteName}
                    </span>
                  ) : null}
                  {u.staffRole ? (
                    <span>{u.staffRole}</span>
                  ) : null}
                  {u.jobTitle ? (
                    <span>{u.jobTitle}</span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Role select */}
                <select
                  value={u.role}
                  onChange={(e) =>
                    patch(u.id, { role: e.target.value })
                  }
                  disabled={busy === u.id}
                  className="h-8 rounded-lg border border-hairline bg-canvas-inset/60 px-2 text-xs text-ink focus-ring"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>

                {/* Site select */}
                <select
                  value={u.siteId ?? ""}
                  onChange={(e) =>
                    patch(u.id, {
                      siteId: e.target.value || null,
                    })
                  }
                  disabled={busy === u.id}
                  className="h-8 rounded-lg border border-hairline bg-canvas-inset/60 px-2 text-xs text-ink focus-ring"
                >
                  <option value="">No site</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>

                {/* Status toggle */}
                {u.status === "active" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => patch(u.id, { status: "inactive" })}
                    disabled={busy === u.id}
                  >
                    <UserX className="h-3.5 w-3.5 text-critical-400" />
                    Deactivate
                  </Button>
                ) : u.status === "inactive" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => patch(u.id, { status: "active" })}
                    disabled={busy === u.id}
                  >
                    <UserCheck className="h-3.5 w-3.5 text-accent-400" />
                    Activate
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => patch(u.id, { status: "active" })}
                    disabled={busy === u.id}
                  >
                    <UserCheck className="h-3.5 w-3.5 text-brand-400" />
                    Accept
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

function UserStatusBadge({ status }: { status: UserStatus }) {
  const tone: Record<UserStatus, Parameters<typeof Badge>[0]["tone"]> = {
    active: "accent",
    invited: "warn",
    inactive: "neutral",
  };
  return (
    <Badge tone={tone[status]} size="sm">
      {status}
    </Badge>
  );
}

function RoleBadge({ role }: { role: string }) {
  const label = SYSTEM_ROLE_LABEL[role as keyof typeof SYSTEM_ROLE_LABEL] ?? role;
  return (
    <Badge tone={role === "staff" ? "neutral" : "brand"} size="sm">
      {label}
    </Badge>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  sites,
  onInvite,
  busy,
  error,
  result,
  onClearResult,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sites: { id: string; name: string }[];
  onInvite: (v: {
    email: string;
    fullName: string;
    role: string;
    staffRole?: string | null;
    siteId?: string | null;
    jobTitle?: string | null;
    phone?: string | null;
  }) => void;
  busy: boolean;
  error: string;
  result: { email: string; tempPassword: string } | null;
  onClearResult: () => void;
}) {
  const [form, setForm] = React.useState({
    email: "",
    fullName: "",
    role: "staff",
    staffRole: "",
    siteId: "",
    jobTitle: "",
    phone: "",
  });

  React.useEffect(() => {
    if (open && !result) {
      setForm({
        email: "",
        fullName: "",
        role: "staff",
        staffRole: "",
        siteId: "",
        jobTitle: "",
        phone: "",
      });
    }
  }, [open, result]);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="primary" size="md">
          <Plus className="h-4 w-4" /> Invite user
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite user</DialogTitle>
          <DialogDescription>
            Create an account and send a temporary password to a new team
            member.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="mt-2 rounded-xl border border-critical-500/30 bg-critical-500/8 px-3 py-2 text-sm text-critical-400">
            {error}
          </p>
        ) : null}

        {result ? (
          <div className="mt-3 space-y-3 rounded-xl border border-accent-500/30 bg-accent-500/8 p-4">
            <p className="text-sm font-medium text-accent-300">
              User invited successfully
            </p>
            <div className="space-y-1 text-sm text-ink">
              <p>
                <span className="text-ink-muted">Email:</span> {result.email}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-ink-muted">Temp password:</span>
                <code className="rounded bg-canvas-inset px-1.5 py-0.5 text-xs font-mono">
                  {result.tempPassword}
                </code>
                <CopyButton text={result.tempPassword} />
              </div>
            </div>
            <p className="text-xs text-ink-muted">
              Share this password securely. The user should change it on first
              login.
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={() => {
                onClearResult();
                onOpenChange(false);
              }}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            <Labeled label="Email" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Labeled>
            <Labeled label="Full name" required>
              <Input
                value={form.fullName}
                onChange={(e) => set("fullName", e.target.value)}
              />
            </Labeled>
            <div className="grid grid-cols-2 gap-3">
              <Labeled label="System role">
                <select
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3 text-sm text-ink focus-ring"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Labeled>
              <Labeled label="Site">
                <select
                  value={form.siteId}
                  onChange={(e) => set("siteId", e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-hairline-strong bg-canvas-inset/60 px-3 text-sm text-ink focus-ring"
                >
                  <option value="">No site</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Labeled>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Labeled label="Job title">
                <Input
                  value={form.jobTitle}
                  onChange={(e) => set("jobTitle", e.target.value)}
                />
              </Labeled>
              <Labeled label="Staff role">
                <Input
                  value={form.staffRole}
                  onChange={(e) => set("staffRole", e.target.value)}
                  placeholder="e.g. RN, EN, PCA"
                />
              </Labeled>
            </div>
            <Labeled label="Phone">
              <Input
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Labeled>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  onInvite({
                    email: form.email,
                    fullName: form.fullName,
                    role: form.role,
                    staffRole: form.staffRole || null,
                    siteId: form.siteId || null,
                    jobTitle: form.jobTitle || null,
                    phone: form.phone || null,
                  })
                }
                disabled={busy || !form.email || !form.fullName}
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Send invite
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded p-1 text-ink-muted hover:bg-white/5 hover:text-ink"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-accent-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

function Labeled({
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
      <span className="text-xs font-medium text-ink-muted">
        {label}
        {required ? <span className="text-critical-400"> *</span> : null}
      </span>
      {children}
    </label>
  );
}
