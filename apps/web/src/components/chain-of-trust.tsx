'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { truncateMiddle } from '@/lib/format';
import type { TrustChainNode } from '@/lib/api/registry';

// ---------------------------------------------------------------------------
// Node type → icon + color
// ---------------------------------------------------------------------------

const NODE_STYLES: Record<
  TrustChainNode['type'],
  { icon: React.ReactNode; markerClass: string }
> = {
  artifact: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
    markerClass: 'border-blue-600 bg-blue-950 text-blue-400',
  },
  signature: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
    markerClass: 'border-amber-600 bg-amber-950 text-amber-400',
  },
  device: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="3" rx="2" />
        <line x1="8" x2="16" y1="21" y2="21" />
        <line x1="12" x2="12" y1="17" y2="21" />
      </svg>
    ),
    markerClass: 'border-zinc-600 bg-zinc-900 text-zinc-400',
  },
  identity: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
    markerClass: 'border-emerald-600 bg-emerald-950 text-emerald-400',
  },
  authority: {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    markerClass: 'border-emerald-500 bg-emerald-950 text-emerald-300',
  },
};

// ---------------------------------------------------------------------------
// ChainOfTrust
// ---------------------------------------------------------------------------

export function ChainOfTrust({ nodes }: { nodes: TrustChainNode[] }) {
  if (nodes.length === 0) {
    return (
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Chain of Trust
        </h2>
        <p className="text-sm text-zinc-500">No signed releases yet.</p>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-1 text-sm font-semibold uppercase tracking-widest text-zinc-500">
        Chain of Trust
      </h2>
      <p className="mb-6 text-xs text-zinc-600">
        You aren&rsquo;t trusting a server. You are trusting math.
      </p>

      <motion.ol
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
        }}
        aria-label="Chain of trust verification"
        className="relative space-y-0"
      >
        {/* Animated vertical connector line */}
        {nodes.length > 1 && (
          <motion.div
            className="absolute left-[15px] top-5 bottom-5 w-px bg-zinc-700"
            style={{ originY: 0 }}
            variants={{
              hidden: { scaleY: 0 },
              visible: {
                scaleY: 1,
                transition: { duration: 0.8, ease: 'easeOut', delay: 0.1 },
              },
            }}
          />
        )}

        {nodes.map((node) => {
          const style = NODE_STYLES[node.type];

          return (
            <motion.li
              key={node.type}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
              }}
              className="relative flex gap-4 pb-6"
            >
              {/* Node marker */}
              <div
                className={`relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${style.markerClass}`}
              >
                {style.icon}
              </div>

              {/* Content */}
              <div className="min-w-0 flex-1 rounded-lg border border-border bg-muted-bg px-4 py-3">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  {node.label}
                </p>
                {node.link_did ? (
                  <Link
                    href={`/registry/identity/${encodeURIComponent(node.link_did)}`}
                    className="mt-0.5 block truncate font-mono text-sm text-emerald-400 hover:underline"
                    title={node.detail}
                  >
                    {truncateMiddle(node.detail, 56)}
                  </Link>
                ) : (
                  <p
                    className="mt-0.5 truncate font-mono text-sm text-zinc-300"
                    title={node.detail}
                  >
                    {truncateMiddle(node.detail, 56)}
                  </p>
                )}
              </div>
            </motion.li>
          );
        })}
      </motion.ol>
    </section>
  );
}
