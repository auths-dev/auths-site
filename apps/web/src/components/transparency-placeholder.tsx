'use client';

import { motion } from 'motion/react';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 } as const,
  whileInView: { opacity: 1, y: 0 } as const,
  viewport: { once: true, margin: '-40px' } as const,
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
});

export function TransparencyPlaceholder() {
  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6">
      <motion.div {...fadeUp(0)} className="flex items-start gap-4">
        <div className="hidden shrink-0 sm:block" aria-hidden="true">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-700"
          >
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
            <path d="m9 12 2 2 4-4" />
          </svg>
        </div>

        <div>
          <h2 className="font-mono text-sm font-semibold text-zinc-200">
            Public Audit Log
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-500">
            Every signature is publicly auditable — like Certificate Transparency
            for software packages. Independent witnesses verify the log so no
            single party can tamper with the record.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 font-mono text-xs text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
            Coming soon
          </div>
        </div>
      </motion.div>
    </section>
  );
}
