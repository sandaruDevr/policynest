import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DocumentWorkspace } from "@/components/admin/documents/document-workspace";
import { getAdminDocument } from "@/lib/data/admin/documents";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const doc = await getAdminDocument(params.id).catch(() => null);
  return { title: `${doc?.title ?? "Document"} · CareSuite Admin` };
}

export default async function AdminDocumentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const doc = await getAdminDocument(params.id);
  if (!doc) notFound();

  return (
    <div className="space-y-5">
      <Link
        href="/admin/documents"
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Documents
      </Link>
      <DocumentWorkspace doc={doc} />
    </div>
  );
}
