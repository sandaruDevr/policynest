"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Keyboard, Volume2, VolumeX } from "lucide-react";
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

  // When recording stops and we have a blob, transcribe it.
  React.useEffect(() => {
    if (recState === "stopped" && audioBlob && state === "recording") {
      void transcribeAndSubmit(audioBlob);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recState, audioBlob]);

  // Reset everything when the overlay closes.
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
    } finally {
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
    } catch (err) {
      console.error("TTS playback error:", err);
      setState("idle");
      setPlayingEl(null);
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

  const stateLabel =
    state === "recording"
      ? "Listening…"
      : state === "transcribing"
        ? "Transcribing…"
        : state === "thinking"
          ? "Thinking…"
          : state === "speaking"
            ? "Speaking…"
            : "Tap to speak";

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas/98 backdrop-blur-xl"
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 sm:p-6">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300/80">
              Voice mode
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={muted ? "Unmute responses" : "Mute responses"}
                onClick={() => setMuted((m) => !m)}
                className="grid h-9 w-9 place-items-center rounded-full text-ink-muted hover:bg-white/5 hover:text-ink transition-colors focus-ring"
              >
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button
                type="button"
                aria-label="Switch to text mode"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full text-ink-muted hover:bg-white/5 hover:text-ink transition-colors focus-ring"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Orb */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <VoiceOrb
              state={
                state === "recording"
                  ? "recording"
                  : state === "transcribing" || state === "thinking"
                    ? "processing"
                    : state === "speaking"
                      ? "speaking"
                      : "idle"
              }
              amplitude={amplitude}
              onClick={handleOrbClick}
              disabled={state === "transcribing" || state === "thinking"}
            />
          </motion.div>

          {/* State label */}
          <motion.p
            key={stateLabel}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-sm font-medium text-ink-muted"
          >
            {stateLabel}
          </motion.p>

          {/* Live transcript / answer */}
          <div className="mt-8 w-full max-w-lg px-6 text-center">
            <AnimatePresence mode="wait">
              {errorMsg ? (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-critical-300"
                >
                  {errorMsg}
                </motion.p>
              ) : transcript ? (
                <motion.div
                  key="transcript"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <p className="text-sm text-ink">
                    <span className="text-ink-dim">You said: </span>
                    &ldquo;{transcript}&rdquo;
                  </p>
                  {answerText ? (
                    <p className="text-sm leading-relaxed text-ink-muted">{answerText}</p>
                  ) : null}
                </motion.div>
              ) : (
                <motion.p
                  key="hint"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm text-ink-dim"
                >
                  Ask about a procedure, escalation, or scenario — I&apos;ll answer out loud.
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom: switch to text */}
          <button
            type="button"
            onClick={onClose}
            className="absolute bottom-8 flex items-center gap-2 rounded-full border border-hairline bg-canvas-inset/60 px-4 py-2 text-xs text-ink-muted transition-colors hover:border-brand-500/30 hover:text-ink focus-ring"
          >
            <Keyboard className="h-3.5 w-3.5" />
            Switch to text
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
