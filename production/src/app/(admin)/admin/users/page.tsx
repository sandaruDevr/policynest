import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { UserDirectory } from "@/components/admin/users/user-directory";
import { listAdminUsers } from "@/lib/data/admin/users";
import { listAdminSites } from "@/lib/data/admin/sites";
import { requireOrgAdmin } from "@/lib/data/admin/session";

export const metadata = { title: "Users & Roles · Policy Nest Admin" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const admin = await requireOrgAdmin();
  if (!admin) redirect("/admin");

  const [users, sites] = await Promise.all([
    listAdminUsers(),
    listAdminSites(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organization"
        title="Users & Roles"
        description="Invite, assign roles and sites, and manage workforce access."
      />
      <UserDirectory
        users={users}
        sites={sites.map((s) => ({ id: s.id, name: s.name }))}
      />
    </div>
  );
}
