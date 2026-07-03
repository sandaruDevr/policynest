import { PageHeader } from "@/components/shared/page-header";
import { DocumentRepository } from "@/components/admin/documents/document-repository";
import { listAdminDocuments } from "@/lib/data/admin/documents";

export const metadata = { title: "Documents · CareSuite Admin" };
export const dynamic = "force-dynamic";

export default async function AdminDocumentsPage() {
  const documents = await listAdminDocuments();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Governance"
        title="Policy & Document Management"
        description="Create, ingest, validate, and publish tenant policies and procedures to your workforce."
      />
      <DocumentRepository documents={documents} />
    </div>
  );
}
