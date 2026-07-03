import { TenantDirectory } from "@/components/platform/tenant-directory";
import { listTenants } from "@/lib/data/platform/tenants";
import { listPlans } from "@/lib/data/platform/tenant-management";
import type { TenantPlan } from "@/types/platform";

export const metadata = { title: "Tenants · CareSuite Platform" };
export const dynamic = "force-dynamic";

export default async function PlatformTenantsPage() {
  const [tenants, plans] = await Promise.all([
    listTenants(),
    listPlans(),
  ]);

  return <TenantDirectory tenants={tenants} plans={plans as TenantPlan[]} />;
}
