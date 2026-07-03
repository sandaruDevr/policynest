import { LibraryApi } from "@/lib/api-contracts";
import { LibraryBrowser } from "@/components/library/library-browser";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Library · Policy Nest" };

export default async function LibraryPage() {
  const { data: documents } = await LibraryApi.list();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Knowledge"
        title="Policies, procedures & forms"
        description="Versioned, role-scoped, and always the source for Nestor AI."
      />
      <LibraryBrowser documents={documents} />
    </div>
  );
}
