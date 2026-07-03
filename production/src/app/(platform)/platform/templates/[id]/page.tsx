import { notFound } from "next/navigation";
import { TemplateDetailPanel } from "@/components/platform/template-detail-panel";
import { getMasterTemplateDetail } from "@/lib/data/platform/templates";

export const metadata = { title: "Template Detail · CareSuite Platform" };
export const dynamic = "force-dynamic";

export default async function TemplateDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const template = await getMasterTemplateDetail(params.id);
  if (!template) notFound();

  return <TemplateDetailPanel template={template} />;
}
