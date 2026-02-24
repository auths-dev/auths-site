'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { truncateMiddle, formatRelativeTime } from '@/lib/format';
import type { PackageRelease } from '@/lib/api/registry';

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: 'valid' | 'revoked' }) {
  if (status === 'valid') {
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Valid
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-xs text-red-400">
      <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
      Revoked
    </span>
  );
}

// ---------------------------------------------------------------------------
// Copy digest button
// ---------------------------------------------------------------------------

function CopyDigest({ digest }: { digest: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(digest);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  }, [digest]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="truncate font-mono text-sm text-zinc-300 hover:text-white transition-colors"
      title={`Click to copy: ${digest}`}
    >
      {copied ? (
        <span className="text-green-400">Copied!</span>
      ) : (
        truncateMiddle(digest, 20)
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Mobile accordion card
// ---------------------------------------------------------------------------

function MobileReleaseCard({
  release,
  index,
}: {
  release: PackageRelease;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2, ease: 'easeOut' }}
      className="rounded-lg border border-border bg-muted-bg"
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          <StatusBadge status={release.status} />
          <Link
            href={`/registry/identity/${encodeURIComponent(release.signer_did)}`}
            onClick={(e) => e.stopPropagation()}
            className="truncate font-mono text-sm text-emerald-400 hover:underline"
          >
            {truncateMiddle(release.signer_did, 20)}
          </Link>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-zinc-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Digest</span>
            <span className="font-mono text-xs text-zinc-400" title={release.digest_hex}>
              {release.digest_algorithm.toUpperCase()}: {truncateMiddle(release.digest_hex, 20)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Timestamp</span>
            <span className="text-xs text-zinc-400">
              {formatRelativeTime(release.published_at)}
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// ProvenanceLedger
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

export function ProvenanceLedger({
  releases,
}: {
  releases: PackageRelease[];
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = releases.slice(0, visibleCount);
  const hasMore = releases.length > visibleCount;

  if (releases.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Release History
        </h2>
        <p className="text-sm text-zinc-500">No releases published yet.</p>
      </section>
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3, ease: 'easeOut' }}
    >
      <div className="mb-4 flex items-baseline gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Release History
        </h2>
        <span className="text-xs text-zinc-600">
          {releases.length} release{releases.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 pr-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Digest Hash
              </th>
              <th className="pb-2 pr-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Signer DID
              </th>
              <th className="pb-2 pr-4 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Timestamp
              </th>
              <th className="pb-2 text-xs font-medium uppercase tracking-wider text-zinc-500">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {visible.map((release, i) => (
              <tr
                key={`${release.digest_hex}-${i}`}
                className="border-b border-border transition-colors hover:bg-muted-bg/50"
              >
                <td className="py-2.5 pr-4">
                  <CopyDigest digest={release.digest_hex} />
                </td>
                <td className="py-2.5 pr-4">
                  <Link
                    href={`/registry/identity/${encodeURIComponent(release.signer_did)}`}
                    className="font-mono text-sm text-emerald-400 hover:underline"
                  >
                    {truncateMiddle(release.signer_did, 24)}
                  </Link>
                </td>
                <td className="py-2.5 pr-4 text-xs text-zinc-500">
                  {formatRelativeTime(release.published_at)}
                </td>
                <td className="py-2.5">
                  <StatusBadge status={release.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="space-y-2 md:hidden">
        {visible.map((release, i) => (
          <MobileReleaseCard
            key={`${release.digest_hex}-${i}`}
            release={release}
            index={i}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="rounded-lg border border-border bg-muted-bg px-6 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          >
            Load More
          </button>
        </div>
      )}
    </motion.section>
  );
}
