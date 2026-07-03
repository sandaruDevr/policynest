import { PageHeader } from "@/components/shared/page-header";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function EmergencyNotFound() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Not found"
        title="Protocol not found"
        description="The emergency protocol you are looking for does not exist or may have been removed."
      />

      <div className="surface-card p-6 sm:p-8">
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-critical-500/10 ring-1 ring-critical-500/30 text-critical-300">
            <ShieldAlert className="h-8 w-8" />
          </span>
          <p className="text-sm text-ink-muted">
            The protocol category may have changed or been removed. Check the
            Emergency page for available protocols.
          </p>
          <Link
            href="/app/emergency"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand-300 hover:text-brand-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to emergency protocols
          </Link>
        </div>
      </div>
    </div>
  );
}
