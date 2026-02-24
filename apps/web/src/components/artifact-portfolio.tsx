'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { formatRelativeTime, truncateMiddle } from '@/lib/format';
import { TerminalBlock } from '@/components/terminal-block';
import type { ArtifactEntry } from '@/lib/api/registry';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_VISIBLE = 6;
const BATCH_SIZE = 12;

// ---------------------------------------------------------------------------
// Parse ecosystem from package_name (e.g. "npm:react" → { ecosystem: "npm", name: "react" })
// ---------------------------------------------------------------------------

function parsePackageName(packageName: string): {
  ecosystem: string;
  name: string;
} {
  const idx = packageName.indexOf(':');
  if (idx > 0) {
    return {
      ecosystem: packageName.slice(0, idx),
      name: packageName.slice(idx + 1),
    };
  }
  return { ecosystem: 'unknown', name: packageName };
}

// ---------------------------------------------------------------------------
// Artifact Card
// ---------------------------------------------------------------------------

function ArtifactCard({
  artifact,
  index,
}: {
  artifact: ArtifactEntry;
  index: number;
}) {
  const { ecosystem, name } = parsePackageName(artifact.package_name);
  const href = `/registry/package/${encodeURIComponent(ecosystem)}/${name.split('/').map(encodeURIComponent).join('/')}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25, ease: 'easeOut' }}
      className="rounded-lg border border-border bg-muted-bg px-4 py-3"
    >
      <Link href={href} className="block group">
        <p className="truncate text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">
          {artifact.package_name}
        </p>
        <p className="mt-1 truncate font-mono text-xs text-zinc-500">
          {artifact.digest_algorithm.toUpperCase()}: {truncateMiddle(artifact.digest_hex, 24)}
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          {formatRelativeTime(artifact.published_at)}
        </p>
      </Link>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// ArtifactPortfolio
// ---------------------------------------------------------------------------

export function ArtifactPortfolio({
  artifacts,
}: {
  artifacts: ArtifactEntry[];
}) {
  const [visibleCount, setVisibleCount] = useState(DEFAULT_VISIBLE);

  const visible = artifacts.slice(0, visibleCount);
  const hasMore = artifacts.length > visibleCount;

  function handleShowMore() {
    setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, artifacts.length));
  }

  if (artifacts.length === 0) {
    return (
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3, ease: 'easeOut' }}
      >
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Signed Artifacts
        </h2>
        <div className="rounded-lg border border-dashed border-zinc-700 p-6 text-center">
          <p className="text-sm text-zinc-500">No signed artifacts yet.</p>
          <div className="mt-4">
            <TerminalBlock commands="auths artifact sign ./my-package.tar.gz" />
          </div>
        </div>
      </motion.section>
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
          Signed Artifacts
        </h2>
        <span className="text-xs text-zinc-600">
          Showing {artifacts.length} cryptographically registered project{artifacts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {visible.map((artifact, i) => (
          <ArtifactCard
            key={`${artifact.package_name}-${artifact.digest_hex}`}
            artifact={artifact}
            index={i}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={handleShowMore}
            className="rounded-lg border border-border bg-muted-bg px-6 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          >
            View All ({artifacts.length})
          </button>
        </div>
      )}

      {/* Gamification CTA */}
      <div className="mt-6 rounded-lg border border-dashed border-zinc-700 p-4 text-center">
        <p className="text-sm text-zinc-500">
          Maintain other packages? Publish their signatures to the registry to
          boost your Web of Trust rank.
        </p>
      </div>
    </motion.section>
  );
}
