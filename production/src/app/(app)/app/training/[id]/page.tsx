import { notFound } from "next/navigation";
import Link from "next/link";
import { TrainingApi } from "@/lib/api-contracts";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { StatusPill } from "@/components/shared/status-pill";
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  FileText,
  Play,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TrainingModulePage({
  params,
}: {
  params: { id: string };
}) {
  const { data: module } = await TrainingApi.module(params.id);

  if (!module) {
    notFound();
  }

  const tone =
    module.status === "completed"
      ? "accent"
      : module.status === "in-progress"
        ? "brand"
        : "neutral";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Training module"
        title={module.title}
        description={`${module.type.replace("-", " ")} • ${module.category}`}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="surface-card p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/12 ring-1 ring-brand-500/30 text-brand-300">
                <BookOpen className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-display text-base font-semibold tracking-tight text-ink">
                  Module overview
                </h2>
                <p className="text-xs text-ink-muted">
                  {module.required ? "Required" : "Optional"} for your role
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-xl border border-hairline bg-canvas-inset/40 p-4">
                <div className="flex items-center gap-2 text-ink-muted mb-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Duration</span>
                </div>
                <p className="text-sm font-semibold text-ink">
                  {module.durationMinutes} min
                </p>
              </div>

              <div className="rounded-xl border border-hairline bg-canvas-inset/40 p-4">
                <div className="flex items-center gap-2 text-ink-muted mb-1">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Relevant roles</span>
                </div>
                <p className="text-sm font-semibold text-ink">
                  {module.rolesRelevant.length > 0
                    ? module.rolesRelevant.join(", ")
                    : "All roles"}
                </p>
              </div>

              <div className="rounded-xl border border-hairline bg-canvas-inset/40 p-4">
                <div className="flex items-center gap-2 text-ink-muted mb-1">
                  <FileText className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Status</span>
                </div>
                <StatusPill tone={tone} label={module.status} showDot />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>Progress</span>
                <span className="font-medium text-ink">
                  {Math.round(module.progressPercent)}%
                </span>
              </div>
              <Progress
                value={module.progressPercent}
                tone={module.status === "completed" ? "accent" : "brand"}
                size="md"
              />
            </div>

            {module.dueAt ? (
              <p className="mt-4 text-xs text-ink-muted">
                Due by{" "}
                <span className="font-medium text-ink">
                  {new Date(module.dueAt).toLocaleDateString()}
                </span>
              </p>
            ) : null}
          </section>

          {module.status === "completed" ? (
            <div className="surface-card p-5 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-accent-400" />
              <p className="text-sm font-medium text-ink">
                You have completed this module.
              </p>
            </div>
          ) : (
            <section className="surface-card p-5 sm:p-6">
              <h2 className="font-display text-base font-semibold tracking-tight text-ink mb-4">
                Content
              </h2>
              <div className="rounded-xl border border-dashed border-hairline-strong bg-canvas-inset/40 p-8 text-center">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500/10 ring-1 ring-brand-500/20 text-brand-300 mx-auto mb-3">
                  <Play className="h-5 w-5" />
                </span>
                <p className="text-sm font-medium text-ink mb-1">
                  Module content
                </p>
                <p className="text-xs text-ink-muted max-w-sm mx-auto">
                  Content delivery is not yet configured for this module type.
                  Contact your administrator if you expected video, slides, or a
                  quiz here.
                </p>
              </div>
            </section>
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          <section className="surface-card p-5">
            <h2 className="font-display text-sm font-semibold tracking-tight text-ink mb-3">
              Actions
            </h2>
            <div className="space-y-2">
              {module.linkedPolicyId ? (
                <Link
                  href={`/app/library/${module.linkedPolicyId}`}
                  className="flex items-center gap-2 rounded-xl border border-hairline bg-canvas-inset/40 px-3 py-2.5 text-sm text-ink hover:bg-white/[.02] transition-colors"
                >
                  <FileText className="h-4 w-4 text-ink-muted" />
                  View linked policy
                </Link>
              ) : null}
              <Link
                href="/app/training"
                className="flex items-center gap-2 rounded-xl border border-hairline bg-canvas-inset/40 px-3 py-2.5 text-sm text-ink hover:bg-white/[.02] transition-colors"
              >
                <ArrowLeft className="h-4 w-4 text-ink-muted" />
                Back to training
              </Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
