"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

type OrbState = "idle" | "recording" | "processing" | "speaking";

interface VoiceOrbProps {
  state: OrbState;
  amplitude?: number;
  onClick?: () => void;
  disabled?: boolean;
}

const STATE_CONFIG: Record<
  OrbState,
  {
    gradient: string;
    glow: string;
    ringColor: string;
    label: string;
  }
> = {
  idle: {
    gradient: "radial-gradient(circle at 35% 30%, #8d78ff 0%, #6c54f5 50%, #4a30c2 100%)",
    glow: "0 0 60px 8px rgba(108,84,245,0.35), 0 0 120px 20px rgba(108,84,245,0.15), inset 0 0 30px rgba(0,0,0,0.25)",
    ringColor: "rgba(141,120,255,0.4)",
    label: "Start voice input",
  },
  recording: {
    gradient: "radial-gradient(circle at 35% 30%, #f87171 0%, #ef4444 50%, #b91c1c 100%)",
    glow: "0 0 60px 8px rgba(239,68,68,0.4), 0 0 120px 20px rgba(239,68,68,0.18), inset 0 0 30px rgba(0,0,0,0.25)",
    ringColor: "rgba(248,113,113,0.5)",
    label: "Stop recording",
  },
  processing: {
    gradient: "radial-gradient(circle at 35% 30%, #b0a3ff 0%, #6c54f5 50%, #3a259a 100%)",
    glow: "0 0 50px 6px rgba(108,84,245,0.3), 0 0 100px 16px rgba(108,84,245,0.12), inset 0 0 30px rgba(0,0,0,0.25)",
    ringColor: "rgba(176,163,255,0.4)",
    label: "Processing...",
  },
  speaking: {
    gradient: "radial-gradient(circle at 35% 30%, #8d78ff 0%, #6c54f5 50%, #4a30c2 100%)",
    glow: "0 0 60px 8px rgba(108,84,245,0.4), 0 0 120px 20px rgba(108,84,245,0.18), inset 0 0 30px rgba(0,0,0,0.25)",
    ringColor: "rgba(141,120,255,0.45)",
    label: "Speaking...",
  },
};

export function VoiceOrb({ state, amplitude = 0, onClick, disabled }: VoiceOrbProps) {
  const cfg = STATE_CONFIG[state];
  const breathScale =
    state === "speaking"
      ? 1 + amplitude * 0.25
      : state === "recording"
        ? 1.06
        : state === "idle"
          ? 1
          : 0.96;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={cfg.label}
      className="group relative grid place-items-center rounded-full focus-ring disabled:cursor-not-allowed"
      style={{ width: 180, height: 180 }}
    >
      {/* Ambient outer glow halo */}
      <motion.span
        className="absolute rounded-full"
        style={{
          inset: -20,
          background: `radial-gradient(circle, ${cfg.ringColor} 0%, transparent 65%)`,
          filter: "blur(20px)",
        }}
        animate={{
          opacity: state === "idle" ? [0.4, 0.7, 0.4] : [0.6, 1, 0.6],
          scale: state === "speaking" ? [1, 1 + amplitude * 0.15, 1] : [1, 1.05, 1],
        }}
        transition={{
          duration: state === "speaking" ? 0.8 : 3,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Expanding pulse rings — recording */}
      <AnimatePresence>
        {state === "recording" && (
          <>
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="absolute rounded-full border"
                style={{ borderColor: cfg.ringColor, inset: 0 }}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: i * 0.8,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Expanding pulse rings — speaking */}
      <AnimatePresence>
        {state === "speaking" && (
          <>
            {[0, 1].map((i) => (
              <motion.span
                key={i}
                className="absolute rounded-full border"
                style={{ borderColor: cfg.ringColor, inset: 0 }}
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.6,
                  repeat: Infinity,
                  ease: "easeOut",
                  delay: i * 0.8,
                }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Rotating conic gradient ring */}
      <motion.span
        className="absolute rounded-full"
        style={{
          inset: 8,
          background: `conic-gradient(from 0deg, transparent 0%, ${cfg.ringColor} 25%, transparent 50%, ${cfg.ringColor} 75%, transparent 100%)`,
          maskImage: "radial-gradient(transparent 62%, black 64%)",
          WebkitMaskImage: "radial-gradient(transparent 62%, black 64%)",
        }}
        animate={{ rotate: state === "processing" || state === "speaking" ? 360 : 0 }}
        transition={{
          duration: state === "processing" ? 1.5 : state === "speaking" ? 4 : 0,
          repeat: state === "processing" || state === "speaking" ? Infinity : 0,
          ease: "linear",
        }}
      />

      {/* Main orb body */}
      <motion.div
        className="relative grid place-items-center overflow-hidden rounded-full"
        animate={{ scale: breathScale }}
        transition={{
          type: "spring",
          stiffness: 180,
          damping: 18,
        }}
        style={{
          width: 120,
          height: 120,
          background: cfg.gradient,
          boxShadow: cfg.glow,
        }}
      >
        {/* Glassy highlight — top-left specular */}
        <span
          className="pointer-events-none absolute rounded-full"
          style={{
            top: "8%",
            left: "12%",
            width: "45%",
            height: "35%",
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.35) 0%, transparent 70%)",
            filter: "blur(4px)",
          }}
        />

        {/* Bottom rim shadow for depth */}
        <span
          className="pointer-events-none absolute rounded-full"
          style={{
            inset: 0,
            background:
              "radial-gradient(circle at 50% 85%, rgba(0,0,0,0.25) 0%, transparent 50%)",
          }}
        />

        {/* Content layer */}
        <div className="relative z-10 flex items-center justify-center">
          {/* Idle: mic icon */}
          {state === "idle" && (
            <motion.svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
              <line x1="8" y1="23" x2="16" y2="23" />
            </motion.svg>
          )}

          {/* Recording: stop square */}
          {state === "recording" && (
            <motion.span
              className="block rounded-lg bg-white/95"
              style={{ width: 28, height: 28 }}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          )}

          {/* Processing: animated dots */}
          {state === "processing" && (
            <div className="flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="block rounded-full bg-white/90"
                  style={{ width: 8, height: 8 }}
                  animate={{
                    opacity: [0.3, 1, 0.3],
                    scale: [0.7, 1.2, 0.7],
                    y: [0, -3, 0],
                  }}
                  transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    delay: i * 0.18,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </div>
          )}

          {/* Speaking: waveform bars */}
          {state === "speaking" && (
            <div className="flex items-center gap-[3px]">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                const baseH = 10 + amplitude * 28;
                const peakH = 22 + amplitude * 48;
                return (
                  <motion.span
                    key={i}
                    className="block w-[3px] rounded-full bg-white/90"
                    animate={{
                      height: [`${baseH}px`, `${peakH}px`, `${baseH}px`],
                      opacity: [0.6, 1, 0.6],
                    }}
                    transition={{
                      duration: 0.35 + (i % 3) * 0.08,
                      repeat: Infinity,
                      delay: i * 0.05,
                      ease: "easeInOut",
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </button>
  );
}
