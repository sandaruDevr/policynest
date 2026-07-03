"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard, Mic, MicOff } from "lucide-react";
import { VoiceOrb } from "@/components/assistant/voice-orb";
import { useRealtimeSession } from "@/hooks/use-realtime-session";

interface VoiceModeProps {
  open: boolean;
  onClose: () => void;
}

const STATE_LABELS: Record<string, string> = {
  idle: "Tap to connect",
  connecting: "Connecting...",
  connected: "Listening — just speak",
  listening: "Listening...",
  speaking: "Speaking...",
  error: "Connection error",
};

export function VoiceMode({ open, onClose }: VoiceModeProps) {
  const {
    state,
    transcript,
    assistantText,
    error,
    connect,
    disconnect,
    toggleMute,
    muted,
  } = useRealtimeSession();

  const hasConnected = React.useRef(false);

  React.useEffect(() => {
    if (open && !hasConnected.current && state === "idle") {
      hasConnected.current = true;
      void connect();
    }
    if (!open) {
      hasConnected.current = false;
      disconnect();
    }
  }, [open, state, connect, disconnect]);

  const orbState =
    state === "connecting"
      ? "processing"
      : state === "listening"
        ? "recording"
        : state === "speaking"
          ? "speaking"
          : "idle";

  const handleOrbClick = () => {
    if (state === "error" || state === "idle") {
      hasConnected.current = true;
      void connect();
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas/95 backdrop-blur-2xl"
        >
          {/* Ambient background glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 50% at 50% 45%, rgba(108,84,245,0.12) 0%, transparent 70%)",
            }}
          />

          {/* Top bar */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-5 sm:px-8"
          >
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/15">
                <Mic className="h-4 w-4 text-brand-300" />
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand-300/80">
                Nestor AI · Voice
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label={muted ? "Unmute microphone" : "Mute microphone"}
                onClick={toggleMute}
                className="grid h-9 w-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-white/5 hover:text-ink focus-ring"
              >
                {muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <button
                type="button"
                aria-label="Close voice mode"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-white/5 hover:text-ink focus-ring"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>

          {/* Center: orb + state label */}
          <div className="relative flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.7, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <VoiceOrb
                state={orbState}
                amplitude={state === "speaking" ? 0.6 : 0}
                onClick={handleOrbClick}
                disabled={state === "connecting" || state === "connected" || state === "listening" || state === "speaking"}
              />
            </motion.div>

            {/* State label */}
            <AnimatePresence mode="wait">
              <motion.p
                key={state}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="mt-8 text-sm font-medium tracking-wide text-ink-muted"
              >
                {STATE_LABELS[state] || "Ready"}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Transcript / answer / hint area */}
          <div className="relative mt-8 w-full max-w-xl px-6 sm:px-8">
            <AnimatePresence mode="wait">
              {error ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mx-auto max-w-md rounded-xl border border-critical-500/20 bg-critical-500/8 px-4 py-3 text-center"
                >
                  <p className="text-sm text-critical-400">{error}</p>
                  <p className="mt-1 text-xs text-ink-dim">Tap the orb to retry</p>
                </motion.div>
              ) : transcript || assistantText ? (
                <motion.div
                  key="conversation"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {transcript && (
                    <div className="rounded-xl border border-hairline bg-surface px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wider text-ink-dim">
                        You said
                      </p>
                      <p className="mt-1 text-sm text-ink">&ldquo;{transcript}&rdquo;</p>
                    </div>
                  )}
                  {assistantText && (
                    <div className="rounded-xl border border-brand-500/15 bg-brand-500/5 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wider text-brand-300/70">
                        Nestor AI
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{assistantText}</p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-sm text-ink-dim"
                >
                  {state === "connecting"
                    ? "Establishing realtime connection..."
                    : "Just start speaking — I'll search your policies and answer out loud."}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom action bar */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-3 px-4 py-6 sm:py-8"
          >
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 rounded-full border border-hairline bg-surface px-5 py-2.5 text-xs font-medium text-ink-muted transition-all hover:border-brand-500/30 hover:bg-brand-500/8 hover:text-ink focus-ring"
            >
              <Keyboard className="h-3.5 w-3.5" />
              Switch to text mode
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
