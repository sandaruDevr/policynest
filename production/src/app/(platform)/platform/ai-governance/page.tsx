import { AiGovernanceConsole } from "@/components/platform/ai-governance-console";
import { listModels, listPrompts, listEvaluations } from "@/lib/data/platform/ai-governance";

export const metadata = { title: "AI Governance · CareSuite Platform" };
export const dynamic = "force-dynamic";

export default async function PlatformAiGovernancePage() {
  const [models, prompts, evaluations] = await Promise.all([
    listModels(),
    listPrompts(),
    listEvaluations(),
  ]);

  return (
    <AiGovernanceConsole
      models={models}
      prompts={prompts}
      evaluations={evaluations}
    />
  );
}
