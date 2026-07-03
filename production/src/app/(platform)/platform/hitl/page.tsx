import { HitlGovernanceConsole } from "@/components/platform/hitl-governance-console";
import { listPlatformHitlItems, listSlaConfigs } from "@/lib/data/platform/hitl-governance";

export const metadata = { title: "HITL Governance · Policy Nest Platform" };
export const dynamic = "force-dynamic";

export default async function PlatformHitlPage() {
  const [items, slaConfigs] = await Promise.all([
    listPlatformHitlItems({ limit: 200 }),
    listSlaConfigs(),
  ]);

  return <HitlGovernanceConsole items={items} slaConfigs={slaConfigs} />;
}
