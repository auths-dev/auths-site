'use client';

import { motion, AnimatePresence } from 'motion/react';
import type { ResolveResult } from '@/lib/resolver';
import { truncateMiddle } from '@/lib/format';

interface TrustGraphProps {
  result: ResolveResult;
}

interface TrustNode {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
}

function buildNodes(result: ResolveResult): TrustNode[] {
  const bundle = result.bundle;
  if (!bundle) return [];

  const nodes: TrustNode[] = [
    { label: 'Repository', value: 'Verified source' },
    { label: 'Signer DID', value: bundle.identity_did, mono: true, accent: true },
    { label: 'Public Key', value: bundle.public_key_hex, mono: true },
  ];

  if (bundle.attestation_chain.length > 0) {
    const first = bundle.attestation_chain[0] as Record<string, unknown>;
    const subject = first['subject'] ?? first['issuer'];
    if (typeof subject === 'string') {
      nodes.push({ label: 'Platform Attestation', value: subject, mono: true });
    }

    const deviceKey = first['device_public_key'];
    if (typeof deviceKey === 'string') {
      nodes.push({ label: 'Device Key', value: deviceKey, mono: true });
    }
  }

  return nodes;
}

export function TrustGraph({ result }: TrustGraphProps) {
  const nodes = buildNodes(result);

  if (nodes.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted-bg p-6 text-sm text-zinc-500">
        No identity found.
        {result.error && (
          <p className="mt-1 text-zinc-600">{result.error}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-zinc-500">
        Chain of Trust
      </h2>
      <ol className="relative space-y-0">
        <AnimatePresence>
          {nodes.map((node, i) => {
            const isFirst = i === 0;
            const isLast = i === nodes.length - 1;

            return (
              <motion.li
                key={node.label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.25, ease: 'easeOut' }}
                className="relative flex gap-5 pb-6"
              >
                {!isLast && (
                  <div className="absolute left-[9px] top-5 bottom-0 w-px bg-border" />
                )}

                <div className="relative mt-0.5 shrink-0">
                  {isFirst ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-verified bg-verified-dim">
                      <div className="h-1.5 w-1.5 rounded-full bg-verified" />
                    </div>
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-zinc-700 bg-background" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                    {node.label}
                  </span>
                  <p
                    className={`mt-0.5 truncate text-sm ${
                      node.mono ? 'font-mono' : ''
                    } ${node.accent ? 'text-verified' : 'text-zinc-300'}`}
                    title={node.value}
                  >
                    {truncateMiddle(node.value, 48)}
                  </p>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ol>
    </div>
  );
}
