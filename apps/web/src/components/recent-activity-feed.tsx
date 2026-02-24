/**
 * Renders recent packages and identities from the registry as two
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
import type { RecentActivity, RecentPackage, RecentIdentity } from '@/lib/api/registry';
import { formatRelativeTime, truncateMiddle } from '@/lib/format';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * A single row in the recent packages list.
 *
 * @param pkg     - The recent package entry from the API.
 * @param index   - Position in the list, used for staggered animation delay.
 * @param onSearch - Callback invoked when the user clicks the package name.
 *
 * @example
 * <PackageRow pkg={entry} index={0} onSearch={(q) => search(q)} />
 */
function PackageRow({
  pkg,
  index,
  onSearch,
}: {
  pkg: RecentPackage;
  index: number;
  onSearch: (query: string) => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => onSearch(`npm:${pkg.package_name}`)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-muted-bg px-4 py-3 text-left transition-colors hover:border-zinc-500"
    >
      <div className="min-w-0 flex-1">
        <span className="block truncate font-mono text-sm text-white">
          {pkg.package_name}
        </span>
        <span
          className="block truncate font-mono text-xs text-zinc-500"
          title={pkg.signer_did}
        >
          {truncateMiddle(pkg.signer_did, 32)}
        </span>
      </div>
      <time
        dateTime={pkg.published_at}
        className="shrink-0 text-xs text-muted"
        title={new Date(pkg.published_at).toISOString()}
      >
        {formatRelativeTime(pkg.published_at)}
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
  return (
    <motion.button
      type="button"
      onClick={() => onSearch(`@${identity.namespace}`)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.2 }}
      className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-muted-bg px-4 py-3 text-left transition-colors hover:border-zinc-500"
    >
      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm text-white">
          @{identity.namespace}
        </span>
        <span className="block text-xs text-zinc-500">
          {identity.platform}
        </span>
      </div>
      <time
        dateTime={identity.registered_at}
        className="shrink-0 text-xs text-muted"
        title={new Date(identity.registered_at).toISOString()}
      >
        {formatRelativeTime(identity.registered_at)}
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
  const packages = activity.recent_packages ?? [];
  const identities = activity.recent_identities ?? [];
  const hasPackages = packages.length > 0;
  const hasIdentities = identities.length > 0;

  if (!hasPackages && !hasIdentities) return null;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {hasPackages && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-zinc-500">
            Recent Packages
          </h2>
          <div className="space-y-2">
            {packages.map((pkg, i) => (
              <PackageRow
                key={`${pkg.package_name}-${pkg.published_at}`}
                pkg={pkg}
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
                key={`${identity.did}-${identity.registered_at}`}
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
