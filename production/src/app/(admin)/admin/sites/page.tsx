import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { SiteDirectory } from "@/components/admin/sites/site-directory";
import { listAdminSites } from "@/lib/data/admin/sites";
import { requireOrgAdmin } from "@/lib/data/admin/session";

export const metadata = { title: "Sites · Policy Nest Admin" };
export const dynamic = "force-dynamic";

export default async function SitesPage() {
  const admin = await requireOrgAdmin();
  if (!admin) redirect("/admin");

  const sites = await listAdminSites();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Organization"
        title="Sites"
        description="Operational locations, site codes, and workforce assignment."
      />
      <SiteDirectory sites={sites} />
    </div>
  );
}
