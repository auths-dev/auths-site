'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { PlatformIcon } from '@/components/icons/platform-icon';
import { formatRelativeTime } from '@/lib/format';
import type { PlatformClaim } from '@/lib/api/registry';
import type { Platform } from '@/lib/registry';

// ---------------------------------------------------------------------------
// All supported platforms for ghost cards
// ---------------------------------------------------------------------------

const ALL_PLATFORMS: readonly string[] = ['github', 'gitlab', 'gitea', 'radicle', 'npm'];

// ---------------------------------------------------------------------------
// Verified card
// ---------------------------------------------------------------------------

function VerifiedCard({
  claim,
  index,
}: {
  claim: PlatformClaim;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25, ease: 'easeOut' }}
      className="rounded-lg border border-border bg-muted-bg px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <PlatformIcon platform={claim.platform} size={20} className="shrink-0 text-zinc-300" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">
            @{claim.namespace}
          </p>
          <p className="text-xs text-zinc-500">{claim.platform}</p>
        </div>
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Verified
        </span>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Ghost card (unlinked platform)
// ---------------------------------------------------------------------------

function GhostCard({
  platform,
  index,
}: {
  platform: string;
  index: number;
}) {
  const [showCommand, setShowCommand] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25, ease: 'easeOut' }}
      className="cursor-pointer rounded-lg border border-dashed border-border bg-muted-bg px-4 py-3 opacity-40 transition-opacity hover:opacity-70"
      onClick={() => setShowCommand((prev) => !prev)}
      onMouseEnter={() => setShowCommand(true)}
      onMouseLeave={() => setShowCommand(false)}
    >
      <div className="flex items-center gap-3">
        <PlatformIcon platform={platform} size={20} className="shrink-0 text-zinc-500" />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-zinc-500">{platform}</p>
          {showCommand ? (
            <p className="mt-0.5 truncate font-mono text-xs text-zinc-600">
              auths id claim {platform}
            </p>
          ) : (
            <p className="text-xs text-zinc-600">Unverified</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// PlatformPassport
// ---------------------------------------------------------------------------

export function PlatformPassport({
  claims,
}: {
  claims: PlatformClaim[];
}) {
  const claimedPlatforms = new Set<string>(claims.map((c) => c.platform));
  const unlinked = ALL_PLATFORMS.filter((p) => !claimedPlatforms.has(p));

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1, ease: 'easeOut' }}
    >
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">
        Platform Passport
      </h2>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {claims.map((claim, i) => (
          <VerifiedCard key={`${claim.platform}-${claim.namespace}`} claim={claim} index={i} />
        ))}
        {unlinked.map((platform, i) => (
          <GhostCard key={platform} platform={platform} index={claims.length + i} />
        ))}
      </div>

      {claims.length === 0 && unlinked.length === 0 && (
        <p className="text-sm text-zinc-500">No platform attestations.</p>
      )}
    </motion.section>
  );
}
