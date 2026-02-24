'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { truncateMiddle } from '@/lib/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PublicKey {
  key_id: string;
  algorithm: string;
  public_key_hex: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// CopyKeyButton
// ---------------------------------------------------------------------------

function CopyKeyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for restricted contexts
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="shrink-0 rounded px-2 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
      aria-label="Copy full key"
    >
      {copied ? <span className="text-green-400">Copied!</span> : 'Copy Full Key'}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Key Card
// ---------------------------------------------------------------------------

function KeyCard({ pubkey, index }: { pubkey: PublicKey; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25, ease: 'easeOut' }}
      className="rounded-lg border border-border bg-muted-bg px-4 py-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
              {pubkey.algorithm}
            </span>
            <span className="truncate text-xs text-zinc-500">
              {truncateMiddle(pubkey.key_id, 16)}
            </span>
          </div>
          <p
            className="mt-1.5 truncate font-mono text-sm text-zinc-300"
            title={pubkey.public_key_hex}
          >
            {truncateMiddle(pubkey.public_key_hex, 48)}
          </p>
          {pubkey.created_at && (
            <p className="mt-1 text-xs text-zinc-600">
              Created {new Date(pubkey.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}
        </div>
        <CopyKeyButton value={pubkey.public_key_hex} />
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// KeyDisplay
// ---------------------------------------------------------------------------

export function KeyDisplay({
  publicKeys,
}: {
  publicKeys: PublicKey[];
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2, ease: 'easeOut' }}
    >
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-zinc-500">
        Authorized Keys
      </h2>
      <p className="mb-4 text-xs text-zinc-600">
        {publicKeys.length === 0
          ? 'No public keys registered yet.'
          : `${publicKeys.length} active key${publicKeys.length !== 1 ? 's' : ''}`}
      </p>

      {publicKeys.length > 0 && (
        <div className="space-y-3">
          {publicKeys.map((key, i) => (
            <KeyCard key={key.key_id} pubkey={key} index={i} />
          ))}
        </div>
      )}
    </motion.section>
  );
}
