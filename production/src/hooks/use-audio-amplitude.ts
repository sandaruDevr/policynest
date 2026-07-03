"use client";

import * as React from "react";

/**
 * Analyses a playing <audio> element in real time and returns a
 * normalised amplitude (0-1) suitable for driving waveform/orb animations.
 */
export function useAudioAmplitude(audioEl: HTMLAudioElement | null, active: boolean) {
  const [amplitude, setAmplitude] = React.useState(0);
  const rafRef = React.useRef<number | null>(null);
  const ctxRef = React.useRef<AudioContext | null>(null);
  const sourceRef = React.useRef<MediaElementAudioSourceNode | null>(null);

  React.useEffect(() => {
    if (!audioEl || !active) {
      setAmplitude(0);
      return;
    }

    let analyser: AnalyserNode;
    let dataArray: Uint8Array;

    try {
      if (!ctxRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        ctxRef.current = new AudioCtx();
      }
      const ctx = ctxRef.current;

      if (!sourceRef.current) {
        sourceRef.current = ctx.createMediaElementSource(audioEl);
      }

      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      const buffer = new ArrayBuffer(analyser.frequencyBinCount);
      dataArray = new Uint8Array(buffer);

      sourceRef.current.connect(analyser);
      analyser.connect(ctx.destination);

      const tick = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        analyser.getByteFrequencyData(dataArray as any);
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        setAmplitude(Math.min(avg / 128, 1));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (err) {
      // Fallback: simple pulsing amplitude if AnalyserNode fails (e.g. CORS-tainted source)
      console.warn("Audio amplitude analysis unavailable, using fallback:", err);
      let t = 0;
      const fallbackTick = () => {
        t += 0.15;
        setAmplitude(0.4 + Math.abs(Math.sin(t)) * 0.4);
        rafRef.current = requestAnimationFrame(fallbackTick);
      };
      fallbackTick();
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setAmplitude(0);
    };
  }, [audioEl, active]);

  return amplitude;
}
