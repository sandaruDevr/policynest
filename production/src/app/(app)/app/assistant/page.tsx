import { Suspense } from "react";
import { AssistantApi, LibraryApi, QuickRefApi } from "@/lib/api-contracts";
import { AssistantWorkspace } from "@/components/assistant/workspace";

export const metadata = { title: "Assistant · CareSuite" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AssistantPage() {
  const [prompts, history, documents, savedItems] = await Promise.all([
    AssistantApi.suggestedPrompts().then((r) => r.data),
    AssistantApi.history().then((r) => r.data),
    LibraryApi.list().then((r) => r.data),
    QuickRefApi.list().then((r) => (r.data || []).filter((i) => i.kind === "ai-answer")),
  ]);

  return (
    <Suspense fallback={null}>
      <AssistantWorkspace
        prompts={prompts}
        initialHistory={history}
        documents={documents}
        savedItems={savedItems}
      />
    </Suspense>
  );
}
