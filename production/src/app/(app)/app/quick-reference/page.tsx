import Link from "next/link";
import { QuickRefApi } from "@/lib/api-contracts";
import { PageHeader } from "@/components/shared/page-header";
import { BookOpen, PinOff, Sparkles } from "lucide-react";
import { QuickRefCard } from "@/components/quick-ref/quick-ref-card";

export const metadata = { title: "Quick Reference · CareSuite" };

export default async function QuickReferencePage() {
  const { data: refs } = await QuickRefApi.list();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="At a glance"
        title="Quick reference"
        description="Essential procedures, phone numbers, and reference materials."
      />

      {refs.length === 0 ? (
        <div className="surface-card p-6 sm:p-8">
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-surface-strong ring-1 ring-hairline-strong text-ink-muted">
              <PinOff className="h-7 w-7" />
            </span>
            <div>
              <p className="text-sm font-medium text-ink">Nothing pinned yet</p>
              <p className="mt-1 text-xs text-ink-muted max-w-sm">
                Pin items from the Assistant, Library, or Emergency pages to see them here.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/app/assistant"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-500/10 px-3 py-2 text-xs font-medium text-brand-300 ring-1 ring-brand-500/20 hover:bg-brand-500/15"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ask Assistant
              </Link>
              <Link
                href="/app/library"
                className="inline-flex items-center gap-2 rounded-lg bg-surface-strong px-3 py-2 text-xs font-medium text-ink ring-1 ring-hairline-strong hover:bg-white/[.03]"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Browse library
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {refs.map((r) => (
            <QuickRefCard
              key={r.id}
              id={r.id}
              kind={r.kind}
              title={r.title}
              subtitle={r.subtitle}
              targetId={r.targetId}
              externalUrl={r.externalUrl}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
