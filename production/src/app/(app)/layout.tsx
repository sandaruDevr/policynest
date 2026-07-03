import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { QueryProvider } from "@/components/providers/query-provider";
import { NotificationsApi, ProfileApi } from "@/lib/api-contracts";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side fetch via API contracts.
  // If profile is null (not authenticated), redirect to login.
  const [{ data: profile }, { data: notifications }] = await Promise.all([
    ProfileApi.getMe().catch(() => ({ data: null })),
    NotificationsApi.list().catch(() => ({ data: [] })),
  ]);

  if (!profile) {
    redirect("/login");
  }

  return (
    <QueryProvider>
      <AppShell profile={profile} initialNotifications={notifications}>
        {children}
      </AppShell>
    </QueryProvider>
  );
}
