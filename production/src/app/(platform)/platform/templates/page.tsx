import { TemplateLibrary } from "@/components/platform/template-library";
import { listMasterTemplates } from "@/lib/data/platform/templates";

export const metadata = { title: "Master Templates · Policy Nest Platform" };
export const dynamic = "force-dynamic";

export default async function PlatformTemplatesPage() {
  const templates = await listMasterTemplates();
  return <TemplateLibrary templates={templates} />;
}
