"use client";

import * as React from "react";
import {
  AlertOctagon,
  ArrowRight,
  BookOpen,
  CheckCheck,
  Copy,
  Pin,
  RefreshCcw,
  Share2,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ConfidenceTag,
  renderBlock,
} from "@/components/assistant/response-blocks";
import { timeAgo } from "@/lib/utils/format";
import type { AssistantNextAction, GuidanceResponse } from "@/types";

interface ResponseCardProps {
  response: GuidanceResponse;
  documentTitleById: Record<string, string>;
  onAction?: (action: AssistantNextAction) => void;
}

export function ResponseCard({ response, documentTitleById, onAction }: ResponseCardProps) {
  const [pinned, setPinned] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const openDocAction = response.nextActions.find((a) => a.kind === "open-document");

  const handleCopy = async () => {
    const text = response.blocks
      .map((b) => {
        if (b.kind === "summary") return b.text;
        if (b.kind === "steps") return b.steps.map((s) => `${s.index}. ${s.text}`).join("\n");
        if (b.kind === "warning") return b.text;
        return "";
      })
      .filter(Boolean)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handlePin = () => {
    onAction?.({ kind: "pin-quick-ref" });
    setPinned(true);
    setTimeout(() => setPinned(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="surface-card overflow-hidden"
    >
      <div className="flex items-center justify-between gap-3 border-b border-hairline px-5 py-3 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/30">
            <Sparkles className="h-3.5 w-3.5 text-brand-300" />
          </span>
          <span className="text-sm font-medium text-ink">Assistant</span>
          <ConfidenceTag level={response.confidence} />
          {response.escalate ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-critical-500/40 bg-critical-500/10 px-2 py-0.5 text-[11px] text-critical-300">
              <AlertOctagon className="h-3 w-3" />
              Escalate
            </span>
          ) : null}
        </div>
        <span className="text-[11px] text-ink-dim">{timeAgo(response.createdAt)}</span>
      </div>

      <div className="space-y-3 px-5 py-4 sm:px-6 sm:py-5">
        {response.blocks.map((b, i) => (
          <div key={i}>{renderBlock(b, documentTitleById)}</div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-hairline px-5 py-2.5 sm:px-6">
        {response.nextActions.map((a, i) => (
          <NextActionButton key={i} action={a} onClick={() => onAction?.(a)} />
        ))}
        <span className="ml-auto inline-flex items-center gap-1">
          {openDocAction ? (
            <Button variant="ghost" size="icon-sm" aria-label="Open source" onClick={() => onAction?.(openDocAction)}>
              <BookOpen className="h-4 w-4" />
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={pinned ? "Pinned to quick reference" : "Pin to quick reference"}
            onClick={handlePin}
          >
            <Pin className={`h-4 w-4 ${pinned ? "fill-brand-300 text-brand-300" : ""}`} />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Copy response" onClick={handleCopy}>
            {copied ? <CheckCheck className="h-4 w-4 text-accent-300" /> : <Copy className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Rephrase" onClick={() => onAction?.({ kind: "rephrase" })}>
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </span>
      </div>
    </motion.div>
  );
}

function NextActionButton({
  action,
  onClick,
}: {
  action: AssistantNextAction;
  onClick: () => void;
}) {
  switch (action.kind) {
    case "start-incident":
      return (
        <Button variant="danger" size="sm" onClick={onClick}>
          <AlertOctagon className="h-3.5 w-3.5" />
          Start incident
        </Button>
      );
    case "ask-followup":
      return (
        <Button variant="outline" size="sm" onClick={onClick}>
          {action.prompt}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      );
    case "share-internal":
      return (
        <Button variant="ghost" size="sm" onClick={onClick}>
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
      );
    default:
      return null;
  }
}
