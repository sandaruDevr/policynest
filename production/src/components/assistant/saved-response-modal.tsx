"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { ResponseCard } from "@/components/assistant/response-card";
import type { QuickReferenceItem, GuidanceResponse } from "@/types";

interface SavedResponseModalProps {
  item: QuickReferenceItem | null;
  documentTitleById: Record<string, string>;
  onClose: () => void;
}

export function SavedResponseModal({ item, documentTitleById, onClose }: SavedResponseModalProps) {
  const payload = item?.content as { query?: string; response?: GuidanceResponse } | undefined;
  const response = payload?.response;
  const queryText = payload?.query || item?.title || "";

  return (
    <AnimatePresence>
      {item && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-4 z-50 flex flex-col overflow-hidden rounded-2xl border border-hairline-strong bg-canvas-raised shadow-2xl sm:inset-8 lg:inset-12"
          >
            <div className="flex items-center justify-between border-b border-hairline px-6 py-4">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-dim">
                  Saved Question
                </p>
                <h2 className="mt-0.5 text-base font-semibold text-ink line-clamp-1">
                  {queryText}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-ink-dim transition-colors hover:bg-canvas-inset hover:text-ink"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {response ? (
                <ResponseCard
                  response={response}
                  documentTitleById={documentTitleById}
                  onAction={() => {
                    // Saved responses in modal don't support inline actions
                  }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-hairline bg-canvas-inset/50 py-12 text-center">
                  <p className="text-sm text-ink-muted">
                    Response data not available. This may be a legacy saved item.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
