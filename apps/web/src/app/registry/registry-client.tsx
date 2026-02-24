'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRegistrySearch } from '@/lib/queries/registry';
import { RegistryHero } from '@/components/registry-hero';
import { RegistryDashboard } from '@/components/registry-dashboard';
import { ArtifactResults } from '@/components/artifact-results';
import { ClaimIdentityCTA } from '@/components/claim-identity-cta';
import { TrustGraph } from '@/components/trust-graph';
import { PubkeysDisplay } from '@/components/pubkeys-display';
import { ActiveIdentityDisplay } from '@/components/active-identity-display';
import type { RecentActivity } from '@/lib/api/registry';

// ---------------------------------------------------------------------------
// Search results renderer
// ---------------------------------------------------------------------------

/**
 * Renders the appropriate result view based on the search result type.
 *
 * Separated from the main component to keep the rendering logic isolated
 * and each branch independently readable.
 *
 * @param result         - The current search result from `useRegistrySearch`.
 * @param parsedQuery    - The parsed search query for context (e.g. normalised DID).
 * @param isFetching     - Whether a background refetch is in progress.
 * @param onSignerClick  - Callback when a signer DID is clicked in artifact results.
 * @param fetchNextPage  - Pagination callback for infinite artifact queries.
 * @param hasNextPage    - Whether more pages are available.
 * @param isFetchingNext - Whether the next page is currently loading.
 *
 * @example
 * <SearchResults result={data} parsedQuery={parsedQuery} ... />
 */
function SearchResults({
  result,
  parsedQuery,
  isFetching,
  onSignerClick,
  fetchNextPage,
  hasNextPage,
  isFetchingNext,
}: {
  result: NonNullable<ReturnType<typeof useRegistrySearch>['data']>;
  parsedQuery: ReturnType<typeof useRegistrySearch>['parsedQuery'];
  isFetching: boolean;
  onSignerClick: (did: string) => void;
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNext?: boolean;
}) {
  return (
    <div className={isFetching ? 'opacity-60 transition-opacity' : ''}>
      {result.type === 'artifacts' && (
        <div>
          <ArtifactResults
            entries={result.data.entries}
            onSignerClick={onSignerClick}
            fromQuery={parsedQuery.raw}
          />
          {hasNextPage && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={fetchNextPage}
                disabled={!!isFetchingNext}
                className="rounded-lg border border-border bg-muted-bg px-6 py-2 text-sm text-zinc-400 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-50"
              >
                {isFetchingNext ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      )}

      {result.type === 'pubkeys' && <PubkeysDisplay data={result.data} fromQuery={parsedQuery.raw} />}

      {result.type === 'identity' && result.data.status === 'active' && (
        <ActiveIdentityDisplay data={result.data} fromQuery={parsedQuery.raw} />
      )}

      {result.type === 'identity' && result.data.status === 'unclaimed' && (
        <ClaimIdentityCTA did={parsedQuery.normalized} />
      )}

      {result.type === 'repo' && <TrustGraph result={result.data} />}

      {result.type === 'empty' && <EmptyResults query={parsedQuery.raw} />}
    </div>
  );
}

/**
 * Shown when a search query produces no matches.
 *
 * @param query - The raw query string the user entered.
 *
 * @example
 * <EmptyResults query="npm:nonexistent-pkg" />
 */
function EmptyResults({ query }: { query: string }) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 text-sm text-zinc-600">
      <p>No results found for &ldquo;{query}&rdquo;</p>
      <p className="text-xs text-zinc-700">
        Try searching for a package (npm:name), repository (owner/repo), or
        identity (@username)
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface RegistryClientProps {
  initialQuery?: string;
  initialActivity: RecentActivity | null;
}

export function RegistryClient({
  initialQuery,
  initialActivity,
}: RegistryClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [input, setInput] = useState(initialQuery ?? '');

  const query = searchParams.get('q') ?? '';

  useEffect(() => {
    setInput(query);
  }, [query]);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    parsedQuery,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRegistrySearch(query);

  function submitSearch(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    router.replace(`/registry?q=${encodeURIComponent(trimmed)}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitSearch(input);
  }

  function handleSignerClick(did: string) {
    setInput(did);
    submitSearch(did);
  }

  return (
    <div className="p-6">
      <RegistryHero value={input} onChange={setInput} onSubmit={handleSubmit} />

      <div className="mt-8">
        {!query && (
          <RegistryDashboard
            activity={initialActivity}
            onSearch={(q) => {
              setInput(q);
              submitSearch(q);
            }}
          />
        )}

        {query && isLoading && (
          <div className="space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-lg bg-muted-bg" />
            ))}
          </div>
        )}

        {query && isError && (
          <div className="rounded-lg border border-red-900 bg-red-950/30 p-4 font-mono text-sm text-red-400">
            <p className="font-semibold">Search failed</p>
            <p className="mt-1 text-red-500/70">
              {error instanceof Error ? error.message : String(error)}
            </p>
          </div>
        )}

        {query && !isLoading && !isError && data && (
          <SearchResults
            result={data}
            parsedQuery={parsedQuery}
            isFetching={isFetching}
            onSignerClick={handleSignerClick}
            fetchNextPage={fetchNextPage ? () => fetchNextPage() : undefined}
            hasNextPage={hasNextPage}
            isFetchingNext={isFetchingNextPage}
          />
        )}
      </div>
    </div>
  );
}
