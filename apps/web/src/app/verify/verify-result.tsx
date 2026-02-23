'use client';

import { motion } from 'motion/react';
import type { ResolveResult } from '@/lib/resolver';

interface VerifyResultProps {
  result: ResolveResult;
  repo: string;
  commit?: string;
}

export function VerifyResult({ result, repo, commit }: VerifyResultProps) {
  const valid = result.bundle != null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {valid ? (
        <div className="rounded-xl border border-[var(--accent-verified-dim)] bg-[var(--accent-verified-dim)]/20 p-6">
          {/* Verified header */}
          <div className="flex items-center gap-3">
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
              className="text-3xl"
            >
              ✅
            </motion.span>
            <div>
              <p className="text-lg font-semibold text-[var(--accent-verified)]">
                Verified Identity
              </p>
              <p className="text-sm text-zinc-400">{repo}</p>
            </div>
          </div>

          {/* Details */}
          <div className="mt-5 space-y-3 border-t border-[var(--accent-verified-dim)] pt-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-600">Identity DID</p>
              <p className="mt-1 break-all font-mono text-sm text-zinc-300">
                {result.bundle!.identity_did}
              </p>
            </div>
            {commit && (
              <div>
                <p className="text-xs uppercase tracking-widest text-zinc-600">Commit</p>
                <p className="mt-1 font-mono text-sm text-zinc-300">{commit}</p>
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-widest text-zinc-600">
                Attestation Chain
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                {result.bundle!.attestation_chain.length} device
                {result.bundle!.attestation_chain.length !== 1 ? 's' : ''} verified
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">❌</span>
            <div>
              <p className="text-lg font-semibold text-zinc-300">Identity Not Found</p>
              <p className="text-sm text-zinc-500">{repo}</p>
            </div>
          </div>
          {result.error && (
            <p className="mt-4 rounded border border-zinc-800 bg-zinc-950 px-4 py-3 font-mono text-sm text-red-400">
              {result.error}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}
