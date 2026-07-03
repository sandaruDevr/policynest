import { ProfileApi } from "@/lib/api-contracts";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils/format";

export const metadata = { title: "Profile · Policy Nest" };

export default async function ProfilePage() {
  const { data: profile } = await ProfileApi.getMe();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Your staff information, role, and permissions."
      />

      <div className="surface-card p-6">
        <div className="flex items-start gap-6">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-surface-strong ring-1 ring-hairline-strong text-2xl font-display font-semibold text-ink-muted">
            {profile.fullName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
              {profile.preferredName || profile.fullName}
            </h2>
            <p className="mt-1 text-sm text-ink-muted">{profile.roleLabel}</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone="brand" size="sm">{profile.role}</Badge>
              <Badge tone="muted" size="sm">{profile.primarySector}</Badge>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-dim">
              Site
            </p>
            <p className="mt-1 text-sm text-ink">{profile.site.name}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-dim">
              Shift
            </p>
            <p className="mt-1 text-sm text-ink">{profile.shift?.label || "Not assigned"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-dim">
              Presence
            </p>
            <p className="mt-1 text-sm text-ink capitalize">{profile.presence}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-dim">
              Last Sync
            </p>
            <p className="mt-1 text-sm text-ink">{formatDate(profile.lastSyncAt)}</p>
          </div>
        </div>
      </div>

    </div>
  );
}
