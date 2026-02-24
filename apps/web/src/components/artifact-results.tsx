'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import type { ArtifactEntry } from '@/lib/api/registry';
import { formatRelativeTime } from '@/lib/format';

function parsePackageHref(packageName: string): string {
  const idx = packageName.indexOf(':');
  if (idx > 0) {
    const ecosystem = packageName.slice(0, idx);
    const name = packageName.slice(idx + 1);
    return `/registry/package/${encodeURIComponent(ecosystem)}/${name.split('/').map(encodeURIComponent).join('/')}`;
  }
  return `/registry/package/unknown/${encodeURIComponent(packageName)}`;
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
  fromQuery?: string;
}

export function ArtifactResults({ entries, onSignerClick, fromQuery }: ArtifactResultsProps) {
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
          <Link
            href={`${parsePackageHref(entry.package_name)}${fromQuery ? `?from_query=${encodeURIComponent(fromQuery)}` : ''}`}
            className="truncate text-sm font-medium text-white hover:text-emerald-400 transition-colors"
          >
            {entry.package_name}
          </Link>

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
