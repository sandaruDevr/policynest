import { notFound } from "next/navigation";
import { TenantDetailPanel } from "@/components/platform/tenant-detail-panel";
import { getTenantDetail, listPlans } from "@/lib/data/platform/tenant-management";
import type { TenantPlan } from "@/types/platform";

export const metadata = { title: "Tenant Detail · Policy Nest Platform" };
export const dynamic = "force-dynamic";

export default async function TenantDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [tenant, plans] = await Promise.all([
    getTenantDetail(params.id),
    listPlans(),
  ]);

  if (!tenant) notFound();

  return <TenantDetailPanel tenant={tenant} plans={plans as TenantPlan[]} />;
}
