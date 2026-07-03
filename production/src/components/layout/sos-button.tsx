"use client";

import Link from "next/link";
import { Siren } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Globally-floating SOS entry point. Lives in the app shell so it is reachable
 * from every route. On desktop it sits in the lower-right; on mobile we hide it
 * because the bottom-bar already exposes Emergency.
 */
export function SOSFloating() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="hidden lg:block fixed bottom-6 right-6 z-40"
    >
      <Link
        href="/app/emergency"
        className="group relative inline-flex items-center gap-2.5 rounded-full border border-critical-500/40 bg-critical-500/10 backdrop-blur-md px-4 h-12 shadow-glow-critical hover:bg-critical-500/16 transition-colors"
        aria-label="Emergency SOS"
      >
        <span className="absolute -inset-px rounded-full ring-1 ring-critical-500/20" />
        <span className="grid h-7 w-7 place-items-center rounded-full bg-critical-500/20 ring-1 ring-critical-500/40">
          <Siren className="h-3.5 w-3.5 text-critical-300" />
        </span>
        <span className="relative font-display text-sm font-semibold text-ink">
          Emergency
        </span>
        <span className="relative ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-critical-400 animate-pulse-soft" />
      </Link>
    </motion.div>
  );
}
