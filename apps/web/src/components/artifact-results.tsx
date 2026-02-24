'use client';

import { useCallback, useState } from 'react';
import { motion } from 'motion/react';
import type { ArtifactEntry } from '@/lib/api/registry';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// DigestDisplay — full hash in DOM, visually truncated via CSS
// ---------------------------------------------------------------------------

function DigestDisplay({
  algorithm,
  hex,
}: {
  algorithm: string;
  hex: string;
}) {
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const fullDigest = `${algorithm}:${hex}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullDigest);
      setCopyState('copied');
      setTimeout(() => setCopyState('idle'), 2000);
    } catch {
      // Select text for manual copy
      const el = document.getElementById(`digest-${hex}`);
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }, [fullDigest, hex]);

  const prefix = hex.slice(0, 8);
  const middle = hex.slice(8, -8);
  const suffix = hex.slice(-8);

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        id={`digest-${hex}`}
        className="font-mono text-xs text-zinc-400"
        title={fullDigest}
      >
        <span>{algorithm}:</span>
        <span>{prefix}</span>
        <span className="inline-block max-w-0 overflow-hidden align-bottom">{middle}</span>
        <span className="text-zinc-600">&hellip;</span>
        <span>{suffix}</span>
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 rounded px-1.5 py-0.5 text-[10px] text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        aria-label={`Copy digest ${fullDigest}`}
      >
        {copyState === 'copied' ? (
          <span className="text-green-400">Copied</span>
        ) : (
          'Copy'
        )}
      </button>
    </span>
  );
}

// ---------------------------------------------------------------------------
// ArtifactResults
// ---------------------------------------------------------------------------

interface ArtifactResultsProps {
  entries: ArtifactEntry[];
  onSignerClick?: (did: string) => void;
}

export function ArtifactResults({ entries, onSignerClick }: ArtifactResultsProps) {
  if (entries.length === 0) return null;

  return (
    <div role="list" className="divide-y divide-border">
      {entries.map((entry, i) => (
        <motion.div
          key={`${entry.digest_hex}-${i}`}
          role="listitem"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: i * 0.04 }}
          className="grid grid-cols-1 gap-2 px-2 py-3 transition-colors hover:bg-muted-bg md:grid-cols-[1fr_auto_auto_auto] md:items-center md:gap-4"
        >
          {/* Package name */}
          <span className="truncate text-sm font-medium text-white">
            {entry.package_name}
          </span>

          {/* Digest */}
          <DigestDisplay algorithm={entry.digest_algorithm} hex={entry.digest_hex} />

          {/* Signer DID */}
          <button
            type="button"
            onClick={() => onSignerClick?.(entry.signer_did)}
            className="truncate text-left font-mono text-xs text-verified underline-offset-2 hover:underline"
            aria-label={`Search for identity ${entry.signer_did}`}
          >
            {entry.signer_did}
          </button>

          {/* Published at */}
          <time
            dateTime={entry.published_at}
            className="text-xs text-muted"
            title={new Date(entry.published_at).toISOString()}
          >
            {formatRelativeTime(entry.published_at)}
          </time>
        </motion.div>
      ))}
    </div>
  );
}
