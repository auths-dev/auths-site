/**
 * Renders recent artifacts and identities from the registry as two
 * side-by-side (desktop) or stacked (mobile) lists.
 *
 * Accepts server-fetched data so the initial render is fully hydrated
 * without a client-side loading state.
 *
 * @example
 * <RecentActivityFeed
 *   activity={activity}
 *   onSearch={(q) => submitSearch(q)}
 * />
 */

'use client';

import { motion } from 'motion/react';
import type { RecentActivity, RecentArtifact, RecentIdentity } from '@/lib/api/registry';
import { formatRelativeTime, truncateMiddle } from '@/lib/format';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * A single row in the recent artifacts list.
 *
 * @param artifact - The recent artifact entry from the API.
 * @param index    - Position in the list, used for staggered animation delay.
 * @param onSearch - Callback invoked when the user clicks the artifact name.
 *
 * @example
 * <ArtifactRow artifact={entry} index={0} onSearch={(q) => search(q)} />
 */
function ArtifactRow({
  artifact,
  index,
  onSearch,
}: {
  artifact: RecentArtifact;
  index: number;
  onSearch: (query: string) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onSearch(`npm:${artifact.package_name}`)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-muted-bg px-4 py-3 text-left transition-colors hover:border-zinc-500"
    >
      <div className="min-w-0 flex-1">
        <span className="block truncate font-mono text-sm text-white">
          {artifact.package_name}
        </span>
        <span
          className="block truncate font-mono text-xs text-zinc-500"
          title={artifact.signer_did}
        >
          {truncateMiddle(artifact.signer_did, 32)}
        </span>
      </div>
      <time
        dateTime={artifact.published_at}
        className="shrink-0 text-xs text-muted"
        title={new Date(artifact.published_at).toISOString()}
      >
        {formatRelativeTime(artifact.published_at)}
      </time>
    </motion.button>
  );
}

/**
 * A single row in the recent identities list.
 *
 * @param identity - The recent identity entry from the API.
 * @param index    - Position in the list, used for staggered animation delay.
 * @param onSearch - Callback invoked when the user clicks the identity.
 *
 * @example
 * <IdentityRow identity={entry} index={0} onSearch={(q) => search(q)} />
 */
function IdentityRow({
  identity,
  index,
  onSearch,
}: {
  identity: RecentIdentity;
  index: number;
  onSearch: (query: string) => void;
}) {
  const displayName = identity.namespace
    ? `@${identity.namespace}`
    : truncateMiddle(identity.did_prefix, 32);

  const platformLabel = identity.platform ?? 'Anonymous';

  return (
    <motion.button
      type="button"
      onClick={() => onSearch(identity.namespace ? `@${identity.namespace}` : identity.did_prefix)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-muted-bg px-4 py-3 text-left transition-colors hover:border-zinc-500"
    >
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm text-white">
          {displayName}
        </span>
        <span className="block text-xs text-zinc-500">
          {platformLabel}
        </span>
      </div>
      <time
        dateTime={identity.created_at}
        className="shrink-0 text-xs text-muted"
        title={new Date(identity.created_at).toISOString()}
      >
        {formatRelativeTime(identity.created_at)}
      </time>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface RecentActivityFeedProps {
  activity: RecentActivity;
  onSearch: (query: string) => void;
}

export function RecentActivityFeed({ activity, onSearch }: RecentActivityFeedProps) {
  const artifacts = activity.recent_artifacts ?? [];
  const identities = activity.recent_identities ?? [];
  const hasArtifacts = artifacts.length > 0;
  const hasIdentities = identities.length > 0;

  if (!hasArtifacts && !hasIdentities) return null;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {hasArtifacts && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Recent Artifacts
          </h2>
          <div className="space-y-2">
            {artifacts.map((artifact, i) => (
              <ArtifactRow
                key={`${artifact.package_name}-${artifact.published_at}`}
                artifact={artifact}
                index={i}
                onSearch={onSearch}
              />
            ))}
          </div>
        </section>
      )}

      {hasIdentities && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Recent Identities
          </h2>
          <div className="space-y-2">
            {identities.map((identity, i) => (
              <IdentityRow
                key={`${identity.did_prefix}-${identity.created_at}`}
                identity={identity}
                index={i}
                onSearch={onSearch}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
