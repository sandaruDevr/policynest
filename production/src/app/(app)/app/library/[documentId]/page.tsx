import { notFound } from "next/navigation";
import { LibraryApi, QuickRefApi } from "@/lib/api-contracts";
import { DocumentViewer } from "@/components/library/document-viewer";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: { documentId: string };
}) {
  const { data } = await LibraryApi.get(params.documentId);
  return { title: data ? `${data.title} · Library` : "Document · Library" };
}

export default async function DocumentPage({
  params,
}: {
  params: { documentId: string };
}) {
  const [{ data: doc }, { data: all }, { data: existingPin }] = await Promise.all([
    LibraryApi.get(params.documentId),
    LibraryApi.list(),
    QuickRefApi.findByTarget("document", params.documentId),
  ]);
  if (!doc) return notFound();

  const related = doc.relatedForms
    .map((r: { id: string; title: string }) => ({ id: r.id, title: r.title }))
    .concat(doc.relatedFaqs.map((r: { id: string; title: string }) => ({ id: r.id, title: r.title })));

  return <DocumentViewer document={doc} related={related} isPinned={!!existingPin} pinId={existingPin?.id} />;
}
