/**
 * Dashboard view shown on `/registry` when no `?q=` search param is present.
 *
 * Composes three sections: a recent activity feed showing the latest packages
 * and identities, clickable example search chips, and the onboarding terminal
 * with tabbed CLI instructions.
 *
 * @param activity - Server-fetched recent activity data (may be `null` if the
 *                   API was unreachable at build/request time).
 * @param onSearch - Callback to trigger a search, syncing the query to the URL.
 *
 * @example
 * <RegistryDashboard activity={activity} onSearch={submitSearch} />
 */

'use client';

import { RecentActivityFeed } from '@/components/recent-activity-feed';
import { OnboardingTerminal } from '@/components/onboarding-terminal';
import type { RecentActivity } from '@/lib/api/registry';

// ---------------------------------------------------------------------------
// Example search chips
// ---------------------------------------------------------------------------

const EXAMPLES = [
  { label: 'npm:auths-cli', description: 'Package search' },
  { label: '@torvalds', description: 'GitHub identity' },
  { label: 'github.com/nickel-org/nickel.rs', description: 'Repository' },
  { label: 'did:keri:EDP1vj', description: 'DID lookup' },
];

/**
 * Clickable search chips for common query patterns.
 *
 * @param onSearch - Callback invoked with the example query string.
 *
 * @example
 * <ExampleSearches onSearch={(q) => submitSearch(q)} />
 */
function ExampleSearches({ onSearch }: { onSearch: (q: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXAMPLES.map((ex) => (
        <button
          key={ex.label}
          type="button"
          onClick={() => onSearch(ex.label)}
          className="rounded-lg border border-border bg-muted-bg px-3 py-1.5 font-mono text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white"
          title={ex.description}
        >
          {ex.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface RegistryDashboardProps {
  activity: RecentActivity | null;
  onSearch: (query: string) => void;
}

export function RegistryDashboard({ activity, onSearch }: RegistryDashboardProps) {
  return (
    <div className="space-y-10">
      <div>
        <p className="mb-4 text-sm text-zinc-600">
          Try searching for a package, repository, or identity:
        </p>
        <ExampleSearches onSearch={onSearch} />
      </div>

      {activity && (
        <RecentActivityFeed activity={activity} onSearch={onSearch} />
      )}

      <OnboardingTerminal />
    </div>
  );
}
