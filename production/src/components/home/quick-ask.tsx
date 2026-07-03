"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Mic, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { SuggestedPrompt } from "@/types";

export function QuickAsk({ prompts }: { prompts: SuggestedPrompt[] }) {
  const router = useRouter();
  const [value, setValue] = React.useState("");

  const submit = (q: string) => {
    if (!q.trim()) return;
    router.push(`/app/assistant?q=${encodeURIComponent(q)}`);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.05 }}
      className="surface-card relative overflow-hidden p-6 sm:p-7"
      aria-labelledby="quick-ask-heading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-12 left-1/2 h-40 w-[420px] -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl"
      />
      <div className="relative flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-500/15 ring-1 ring-brand-500/30">
          <Sparkles className="h-3.5 w-3.5 text-brand-300" />
        </span>
        <h2
          id="quick-ask-heading"
          className="font-display text-base font-semibold tracking-tight text-ink"
        >
          Ask Nestor AI
        </h2>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="relative mt-4 flex items-center gap-2 rounded-2xl border border-hairline-strong bg-canvas-inset/70 p-2 pl-4 focus-within:border-brand-400/60 transition-colors"
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="What do you need to know?"
          className="flex-1 bg-transparent py-2 text-sm text-ink placeholder:text-ink-dim focus:outline-none"
        />
        <button
          type="button"
          aria-label="Voice input"
          className="grid h-9 w-9 place-items-center rounded-xl text-ink-muted hover:bg-white/5 hover:text-ink transition-colors focus-ring"
        >
          <Mic className="h-4 w-4" />
        </button>
        <button
          type="submit"
          aria-label="Send"
          className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white shadow-elev2 hover:bg-brand-400 disabled:opacity-50 transition-colors focus-ring"
          disabled={!value.trim()}
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>

      <div className="relative mt-4 flex flex-wrap gap-2">
        {prompts.slice(0, 4).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => submit(p.label)}
            className="group inline-flex items-center gap-1.5 rounded-full border border-hairline bg-canvas-inset/40 px-3 py-1.5 text-xs text-ink-muted transition-colors hover:border-brand-500/30 hover:bg-brand-500/8 hover:text-ink"
          >
            <Sparkles className="h-3 w-3 text-brand-300/80" />
            {p.label}
          </button>
        ))}
      </div>
    </motion.section>
  );
}
