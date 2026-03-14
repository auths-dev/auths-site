'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { TIER_STYLES } from '@/lib/tier-styles';
import type { TrustTier } from '@/lib/api/registry';

interface TrustTierBadgeProps {
  tier: TrustTier;
  score: number;
  breakdown: { claims: number; keys: number; artifacts: number };
}

export function TrustTierBadge({ tier, score, breakdown }: TrustTierBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const tierStyle = TIER_STYLES[tier];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative inline-flex items-center gap-3" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${tierStyle.color}`}
        aria-describedby="trust-tier-tooltip"
      >
        {tierStyle.label}
      </button>
      <span className="text-xs text-zinc-500">
        Trust Score: {score}/100
      </span>

      <AnimatePresence>
        {open && (
          <motion.div
            id="trust-tier-tooltip"
            role="tooltip"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-zinc-700 bg-zinc-800 p-3 shadow-xl"
          >
            <p className="mb-2 text-xs font-medium text-zinc-300">
              Trust Score Breakdown
            </p>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Platform claims</span>
                <span className="font-mono text-zinc-200">+{breakdown.claims}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Public keys</span>
                <span className="font-mono text-zinc-200">+{breakdown.keys}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Artifacts</span>
                <span className="font-mono text-zinc-200">+{breakdown.artifacts}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-zinc-700 pt-2">
                <span className="font-medium text-zinc-300">Total</span>
                <span className="font-mono font-medium text-zinc-100">
                  {Math.min(breakdown.claims + breakdown.keys + breakdown.artifacts, 100)}/100
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
