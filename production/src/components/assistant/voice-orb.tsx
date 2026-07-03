"use client";

import * as React from "react";
import { motion } from "framer-motion";

interface VoiceOrbProps {
  state: "idle" | "recording" | "processing" | "speaking";
  amplitude?: number;
  onClick?: () => void;
  disabled?: boolean;
}

export function VoiceOrb({ state, amplitude = 0, onClick, disabled }: VoiceOrbProps) {
  const size = 120;
  const baseScale = state === "speaking" ? 1 + amplitude * 0.3 : state === "recording" ? 1.05 : 1;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={
        state === "recording"
          ? "Stop recording"
          : state === "processing"
            ? "Processing..."
            : state === "speaking"
              ? "Speaking..."
              : "Start voice input"
      }
      className="relative grid place-items-center rounded-full focus-ring disabled:cursor-not-allowed"
      style={{ width: size, height: size }}
    >
      {/* Outer glow rings */}
      {state === "recording" && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full border border-critical-400/30"
            animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.span
            className="absolute inset-0 rounded-full border border-critical-400/20"
            animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
          />
        </>
      )}

      {state === "speaking" && (
        <>
          <motion.span
            className="absolute inset-0 rounded-full border border-brand-400/30"
            animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.span
            className="absolute inset-0 rounded-full border border-brand-400/20"
            animate={{ scale: [1, 1.7], opacity: [0.3, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut", delay: 0.4 }}
          />
        </>
      )}

      {/* Main orb */}
      <motion.div
        className="relative grid place-items-center rounded-full"
        animate={{
          scale: baseScale,
        }}
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 15,
        }}
        style={{
          width: size * 0.72,
          height: size * 0.72,
          background:
            state === "recording"
              ? "radial-gradient(circle at 30% 30%, #ef4444, #b91c1c)"
              : state === "processing"
                ? "radial-gradient(circle at 30% 30%, #6366f1, #4338ca)"
                : state === "speaking"
                  ? "radial-gradient(circle at 30% 30%, #6366f1, #4f46e5)"
                  : "radial-gradient(circle at 30% 30%, #818cf8, #4f46e5)",
          boxShadow:
            state === "recording"
              ? "0 0 40px rgba(239,68,68,0.4), inset 0 0 20px rgba(0,0,0,0.2)"
              : state === "speaking"
                ? "0 0 40px rgba(99,102,241,0.4), inset 0 0 20px rgba(0,0,0,0.2)"
                : "0 0 30px rgba(99,102,241,0.25), inset 0 0 20px rgba(0,0,0,0.15)",
        }}
      >
        {/* Inner shimmer */}
        <motion.span
          className="absolute inset-2 rounded-full opacity-30"
          style={{
            background:
              "radial-gradient(circle at 70% 70%, transparent 40%, rgba(255,255,255,0.1) 70%)",
          }}
          animate={
            state === "processing"
              ? { rotate: 360 }
              : state === "speaking"
                ? { rotate: -360 }
                : { rotate: 0 }
          }
          transition={{
            duration: state === "processing" ? 2 : state === "speaking" ? 8 : 0,
            repeat: state === "processing" || state === "speaking" ? Infinity : 0,
            ease: "linear",
          }}
        />

        {/* Waveform bars when speaking */}
        {state === "speaking" && (
          <div className="flex items-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                className="w-1 rounded-full bg-white/80"
                animate={{
                  height: [
                    `${8 + amplitude * 20}px`,
                    `${20 + amplitude * 40}px`,
                    `${8 + amplitude * 20}px`,
                  ],
                }}
                transition={{
                  duration: 0.4,
                  repeat: Infinity,
                  delay: i * 0.06,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

        {/* Pulse dots when processing */}
        {state === "processing" && (
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="h-2 w-2 rounded-full bg-white/80"
                animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
        )}

        {/* Mic icon when idle */}
        {state === "idle" && (
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )}

        {/* Stop icon when recording */}
        {state === "recording" && (
          <span className="h-6 w-6 rounded-md bg-white/90" />
        )}
      </motion.div>
    </button>
  );
}
