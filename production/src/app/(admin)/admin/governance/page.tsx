import { PageHeader } from "@/components/shared/page-header";
import { GovernanceConsole } from "@/components/admin/governance/governance-console";
import {
  getAiActivityMetrics,
  getAiSettings,
  listAiActivity,
  listGoldenAnswers,
  listHitlItems,
} from "@/lib/data/admin/governance";

export const metadata = { title: "AI Governance · Policy Nest Admin" };
export const dynamic = "force-dynamic";

export default async function GovernancePage() {
  const [metrics, hitlItems, goldenAnswers, settings, activity] =
    await Promise.all([
      getAiActivityMetrics(),
      listHitlItems("all"),
      listGoldenAnswers(),
      getAiSettings(),
      listAiActivity(30),
    ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="AI Governance"
        description="Review escalated answers, curate golden answers, and tune Nestor AI behaviour."
      />
      <GovernanceConsole
        metrics={metrics}
        hitlItems={hitlItems}
        goldenAnswers={goldenAnswers}
        settings={settings}
        activity={activity}
      />
    </div>
  );
}
