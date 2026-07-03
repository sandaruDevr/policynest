"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard, Volume2, VolumeX, Mic } from "lucide-react";
import { VoiceOrb } from "@/components/assistant/voice-orb";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import { useAudioAmplitude } from "@/hooks/use-audio-amplitude";
import type { GuidanceResponse } from "@/types";

type VoiceState = "idle" | "recording" | "transcribing" | "thinking" | "speaking" | "error";

interface VoiceModeProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<GuidanceResponse | null>;
}

function extractSpeakableText(response: GuidanceResponse | null): string {
  if (!response) return "";
  const parts: string[] = [];
  for (const block of response.blocks) {
    if (block.kind === "summary") parts.push(block.text);
    else if (block.kind === "warning") parts.push(block.text);
    else if (block.kind === "escalation") parts.push(`This requires escalation. ${block.reason}`);
  }
  if (parts.length === 0 && response.policyNotFound) {
    return "I couldn't find a relevant policy for that question. Please try rephrasing, or check with your supervisor.";
  }
  return parts.join(" ") || "Here's what I found. Check the screen for full details.";
}

const STATE_LABELS: Record<VoiceState, string> = {
  idle: "Tap to speak",
  recording: "Listening...",
  transcribing: "Transcribing...",
  thinking: "Thinking...",
  speaking: "Speaking...",
  error: "Something went wrong",
};

export function VoiceMode({ open, onClose, onSubmit }: VoiceModeProps) {
  const [state, setState] = React.useState<VoiceState>("idle");
  const [transcript, setTranscript] = React.useState("");
  const [answerText, setAnswerText] = React.useState("");
  const [errorMsg, setErrorMsg] = React.useState("");
  const [muted, setMuted] = React.useState(false);

  const { state: recState, audioBlob, startRecording, stopRecording, reset } = useVoiceRecorder();
  const audioElRef = React.useRef<HTMLAudioElement | null>(null);
  const [playingEl, setPlayingEl] = React.useState<HTMLAudioElement | null>(null);
  const amplitude = useAudioAmplitude(playingEl, state === "speaking");

  React.useEffect(() => {
    if (recState === "stopped" && audioBlob && state === "recording") {
      void transcribeAndSubmit(audioBlob);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recState, audioBlob]);

  React.useEffect(() => {
    if (!open) {
      setState("idle");
      setTranscript("");
      setAnswerText("");
      setErrorMsg("");
      reset();
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current = null;
      }
      setPlayingEl(null);
    }
  }, [open, reset]);

  const transcribeAndSubmit = async (blob: Blob) => {
    setState("transcribing");
    setErrorMsg("");
    try {
      const form = new FormData();
      form.append("audio", blob, "recording.webm");
      const res = await fetch("/api/voice/stt", { method: "POST", body: form });
      if (!res.ok) throw new Error("Transcription failed");
      const { text } = await res.json();

      if (!text || !text.trim()) {
        setErrorMsg("Didn't catch that. Try again.");
        setState("idle");
        reset();
        return;
      }

      setTranscript(text);
      setState("thinking");

      const response = await onSubmit(text);
      const speakable = extractSpeakableText(response);
      setAnswerText(speakable);

      if (muted || !speakable) {
        setState("idle");
        reset();
        return;
      }

      await speak(speakable);
    } catch (err) {
      console.error("Voice flow error:", err);
      setErrorMsg("Something went wrong. Try again.");
      setState("idle");
      reset();
    }
  };

  const speak = async (text: string) => {
    setState("speaking");
    try {
      const res = await fetch("/api/voice/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error("TTS failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audioEl = new Audio(url);
      audioElRef.current = audioEl;
      setPlayingEl(audioEl);

      await new Promise<void>((resolve) => {
        audioEl.onended = () => resolve();
        audioEl.onerror = () => resolve();
        audioEl.play().catch(() => resolve());
      });

      URL.revokeObjectURL(url);
      setPlayingEl(null);
      setState("idle");
      reset();
    } catch (err) {
      console.error("TTS playback error:", err);
      setState("idle");
      setPlayingEl(null);
      reset();
    }
  };

  const handleOrbClick = () => {
    if (state === "idle" || state === "error") {
      setErrorMsg("");
      setTranscript("");
      setAnswerText("");
      void startRecording();
      setState("recording");
    } else if (state === "recording") {
      stopRecording();
    } else if (state === "speaking") {
      audioElRef.current?.pause();
      audioElRef.current = null;
      setPlayingEl(null);
      setState("idle");
    }
  };

  const orbState =
    state === "recording"
      ? "recording"
      : state === "transcribing" || state === "thinking"
        ? "processing"
        : state === "speaking"
          ? "speaking"
          : "idle";

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
                Voice Mode
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label={muted ? "Unmute responses" : "Mute responses"}
                onClick={() => setMuted((m) => !m)}
                className="grid h-9 w-9 place-items-center rounded-full text-ink-muted transition-colors hover:bg-white/5 hover:text-ink focus-ring"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
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
                amplitude={amplitude}
                onClick={handleOrbClick}
                disabled={state === "transcribing" || state === "thinking"}
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
                {STATE_LABELS[state]}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Transcript / answer / hint area */}
          <div className="relative mt-8 w-full max-w-xl px-6 sm:px-8">
            <AnimatePresence mode="wait">
              {errorMsg ? (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mx-auto max-w-md rounded-xl border border-critical-500/20 bg-critical-500/8 px-4 py-3 text-center"
                >
                  <p className="text-sm text-critical-400">{errorMsg}</p>
                </motion.div>
              ) : transcript ? (
                <motion.div
                  key="transcript"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="rounded-xl border border-hairline bg-surface px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-ink-dim">
                      You said
                    </p>
                    <p className="mt-1 text-sm text-ink">&ldquo;{transcript}&rdquo;</p>
                  </div>
                  {answerText ? (
                    <div className="rounded-xl border border-brand-500/15 bg-brand-500/5 px-4 py-3">
                      <p className="text-xs font-medium uppercase tracking-wider text-brand-300/70">
                        Assistant
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-muted">{answerText}</p>
                    </div>
                  ) : null}
                </motion.div>
              ) : (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center text-sm text-ink-dim"
                >
                  Ask about a procedure, escalation, or scenario — I&apos;ll answer out loud.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom action bar */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center px-4 py-6 sm:py-8"
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
