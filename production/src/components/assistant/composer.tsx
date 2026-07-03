"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ArrowUp, Mic, Paperclip } from "lucide-react";

const MAX_CHARS = 2000;

interface ComposerProps {
  onSubmit: (text: string, options?: { voice?: boolean }) => void;
  initialValue?: string;
  disabled?: boolean;
}

export function Composer({ onSubmit, initialValue = "", disabled }: ComposerProps) {
  const [value, setValue] = React.useState(initialValue);
  const [listening, setListening] = React.useState(false);
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (initialValue) {
      setValue(initialValue);
      ref.current?.focus();
    }
  }, [initialValue]);

  // Auto-resize textarea
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const submit = (text: string, options?: { voice?: boolean }) => {
    if (!text.trim() || disabled) return;
    onSubmit(text, options);
    setValue("");
    if (ref.current) {
      ref.current.style.height = "auto";
    }
  };

  const charCount = value.length;
  const nearLimit = charCount > MAX_CHARS * 0.9;
  const overLimit = charCount > MAX_CHARS;

  return (
    <div className="space-y-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(value);
        }}
        className="relative rounded-2xl border border-hairline-strong bg-canvas-inset p-1.5 focus-within:border-brand-400/60 transition-colors"
      >
        <textarea
          ref={ref}
          rows={1}
          value={value}
          maxLength={MAX_CHARS + 100}
          onChange={(e) => {
            const next = e.target.value;
            if (next.length <= MAX_CHARS + 100) setValue(next);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (!overLimit) submit(value);
            }
          }}
          placeholder="Ask about a procedure, escalation, or scenario…"
          disabled={disabled}
          aria-describedby="composer-hint"
          className="block w-full resize-none rounded-xl bg-transparent px-3 py-2 text-sm text-ink placeholder:text-ink-dim focus:outline-none disabled:opacity-50"
        />
        <div className="flex items-center gap-1.5 px-1.5 pb-1.5">
          <button
            type="button"
            aria-label="Attach context"
            className="grid h-8 w-8 place-items-center rounded-lg text-ink-muted hover:bg-white/5 hover:text-ink transition-colors focus-ring"
          >
            <Paperclip className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-pressed={listening}
            onClick={() => setListening((v) => !v)}
            className={`relative grid h-8 w-8 place-items-center rounded-lg transition-colors focus-ring ${
              listening
                ? "bg-critical-500/15 text-critical-300 ring-1 ring-critical-500/40"
                : "text-ink-muted hover:bg-white/5 hover:text-ink"
            }`}
            aria-label={listening ? "Stop listening" : "Voice input"}
          >
            <Mic className="h-4 w-4" />
            {listening ? (
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-lg ring-2 ring-critical-500/40"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
            ) : null}
          </button>
          <span
            id="composer-hint"
            className={`ml-auto text-[11px] transition-colors ${nearLimit ? (overLimit ? "text-critical-300" : "text-warn-300") : "text-ink-dim"}`}
          >
            {charCount}/{MAX_CHARS}
          </span>
          <button
            type="submit"
            disabled={!value.trim() || disabled || overLimit}
            aria-label="Send"
            className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500 text-white shadow-elev2 transition-all hover:bg-brand-400 disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
