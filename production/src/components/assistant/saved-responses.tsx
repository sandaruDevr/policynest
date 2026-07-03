"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Calendar, PinOff, Sparkles } from "lucide-react";
import type { QuickReferenceItem, GuidanceResponse } from "@/types";

interface SavedResponsesProps {
  savedItems: QuickReferenceItem[];
  onSelectItem: (item: QuickReferenceItem) => void;
  onUnpin: (id: string) => void;
}

export function SavedResponses({ savedItems, onSelectItem, onUnpin }: SavedResponsesProps) {
  if (savedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-hairline bg-canvas-inset/40 py-16 text-center">
        <Sparkles className="h-8 w-8 text-ink-dim/60" />
        <p className="mt-3 text-sm font-medium text-ink-muted">No saved responses yet</p>
        <p className="mt-1 text-xs text-ink-dim">
          Pin an assistant answer to see it here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {savedItems.map((item) => {
        const payload = item.content as { query?: string; response?: GuidanceResponse } | undefined;
        const queryText = payload?.query || item.title;
        const date = new Date(item.pinnedAt).toLocaleDateString("en-AU", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        return (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
          >
            <button
              onClick={() => onSelectItem(item)}
              className="group w-full rounded-2xl border border-hairline bg-canvas-raised/60 p-5 text-left transition-all hover:border-hairline-strong hover:bg-white/[.02]"
            >
              <div className="mb-3 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-ink-dim">
                    Question
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-ink line-clamp-2">
                    {queryText}
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnpin(item.id);
                  }}
                  className="rounded-lg p-1.5 text-ink-dim opacity-0 transition-all hover:bg-critical-500/10 hover:text-critical-300 group-hover:opacity-100"
                  aria-label="Remove from saved"
                >
                  <PinOff className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-ink-dim">
                <Calendar className="h-3 w-3" />
                <span>{date}</span>
              </div>
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}
