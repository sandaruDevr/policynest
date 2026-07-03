import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LucideIcon } from "lucide-react";

interface ModulePlaceholderProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  planned: string[];
}

/**
 * Honest scaffold for an admin module that is on the roadmap but not yet
 * implemented. Clearly communicates status — never presents fake controls.
 */
export function ModulePlaceholder({
  eyebrow,
  title,
  description,
  icon: Icon,
  planned,
}: ModulePlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <Card className="p-8">
        <div className="flex flex-col items-start gap-4">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/12 ring-1 ring-brand-500/30">
            <Icon className="h-6 w-6 text-brand-300" />
          </span>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-lg font-semibold text-ink">
              In development
            </h2>
            <Badge tone="warn" size="sm">
              Roadmap
            </Badge>
          </div>
          <p className="max-w-xl text-sm text-ink-muted">
            This module is part of the Organization Admin build and is being
            implemented in a dedicated phase. Planned capabilities:
          </p>
          <ul className="grid gap-2 sm:grid-cols-2">
            {planned.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-2 text-sm text-ink-muted"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Card>
    </div>
  );
}
