'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  useQuery,
  useInfiniteQuery,
  keepPreviousData,
} from '@tanstack/react-query';
import { parseSearchQuery } from '@/lib/registry';
import type { ParsedSearchQuery } from '@/lib/registry';
import {
  fetchArtifacts,
  fetchPubkeys,
  fetchIdentity,
  fetchPackageDetail,
  computeTrustTier,
} from '@/lib/api/registry';
import type {
  ArtifactQueryResponse,
  PubkeysResponse,
  IdentityResponse,
  IdentityProfile,
  PackageDetail,
} from '@/lib/api/registry';
import { resolveFromRepo } from '@/lib/resolver';
import type { ResolveResult } from '@/lib/resolver';

// ---------------------------------------------------------------------------
// Query key factory
// ---------------------------------------------------------------------------

export const registryKeys = {
  all: ['registry'] as const,
  searches: () => [...registryKeys.all, 'search'] as const,
  search: (query: string) => [...registryKeys.searches(), query] as const,
  artifacts: () => [...registryKeys.all, 'artifacts'] as const,
  artifact: (query: string) => [...registryKeys.artifacts(), query] as const,
  pubkeys: () => [...registryKeys.all, 'pubkeys'] as const,
  pubkey: (platform: string, namespace: string) =>
    [...registryKeys.pubkeys(), platform, namespace] as const,
  identities: () => [...registryKeys.all, 'identities'] as const,
  identity: (did: string) => [...registryKeys.identities(), did] as const,
  identityProfiles: () => [...registryKeys.all, 'identity-profile'] as const,
  identityProfile: (did: string) =>
    [...registryKeys.identityProfiles(), did] as const,
  packages: () => [...registryKeys.all, 'package'] as const,
  packageDetail: (ecosystem: string, name: string) =>
    [...registryKeys.packages(), ecosystem, name] as const,
};

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export type RegistrySearchResult =
  | { type: 'artifacts'; data: ArtifactQueryResponse }
  | { type: 'pubkeys'; data: PubkeysResponse }
  | { type: 'identity'; data: IdentityResponse }
  | { type: 'repo'; data: ResolveResult }
  | { type: 'empty' };

// ---------------------------------------------------------------------------
// useDebounce
// ---------------------------------------------------------------------------

function useDebounce(value: string, delay: number): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// useArtifactSearch — infinite query for package/artifact results
// ---------------------------------------------------------------------------

export function useArtifactSearch(query: string, enabled: boolean) {
  return useInfiniteQuery({
    queryKey: registryKeys.artifact(query),
    queryFn: ({ pageParam, signal }) => fetchArtifacts(query, pageParam, signal),
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled,
    staleTime: 120_000,
  });
}

// ---------------------------------------------------------------------------
// useIdentityProfile — enriched identity for the profile page
// ---------------------------------------------------------------------------

/**
 * Fetches an identity by DID and enriches it with a computed trust tier,
 * trust score, total signature count, and extracted GitHub username.
 *
 * Returns `undefined` while loading, or the enriched `IdentityProfile` /
 * unclaimed `IdentityResponse` once resolved.
 */
export function useIdentityProfile(did: string) {
  return useQuery({
    queryKey: registryKeys.identityProfile(did),
    queryFn: async ({ signal }): Promise<IdentityProfile | { status: 'unclaimed'; did: string }> => {
      const identity = await fetchIdentity(did, signal);

      if (identity.status === 'unclaimed') {
        return identity;
      }

      const { tier, score } = computeTrustTier(identity);
      const ghClaim = identity.platform_claims.find(
        (c) => c.platform === 'github' && c.verified,
      );

      return {
        ...identity,
        trust_tier: tier,
        trust_score: score,
        total_signatures: identity.artifacts.length,
        github_username: ghClaim?.namespace,
      };
    },
    enabled: did.length > 0,
    staleTime: 120_000,
  });
}

// ---------------------------------------------------------------------------
// usePackageDetail — composed package detail for the package page
// ---------------------------------------------------------------------------

/**
 * Fetches and composes a full package detail by ecosystem and name.
 *
 * Internally calls `fetchPackageDetail` which handles N+1 mitigation:
 * caps signer enrichment to top 10 most recent unique signers, batches
 * identity lookups in groups of 5 via `Promise.allSettled`.
 */
export function usePackageDetail(ecosystem: string, name: string) {
  return useQuery<PackageDetail>({
    queryKey: registryKeys.packageDetail(ecosystem, name),
    queryFn: ({ signal }) => fetchPackageDetail(ecosystem, name, signal),
    enabled: ecosystem.length > 0 && name.length > 0,
    staleTime: 120_000,
  });
}

// ---------------------------------------------------------------------------
// useRegistrySearch — main orchestrator
// ---------------------------------------------------------------------------

export function useRegistrySearch(query: string) {
  const debouncedQuery = useDebounce(query, 300);
  const parsedQuery = useMemo(
    () => parseSearchQuery(debouncedQuery),
    [debouncedQuery],
  );

  const isEnabled = debouncedQuery.length >= 2;
  const queryType = parsedQuery.type;

  // Artifact/package search (infinite query) — handled separately
  const artifactQuery = useArtifactSearch(
    parsedQuery.type === 'package' ? parsedQuery.normalized : '',
    isEnabled && queryType === 'package',
  );

  // Identity search (pubkeys by platform + namespace)
  const pubkeysQuery = useQuery({
    queryKey:
      queryType === 'identity' && parsedQuery.type === 'identity'
        ? registryKeys.pubkey(parsedQuery.platform, parsedQuery.namespace)
        : registryKeys.pubkey('', ''),
    queryFn: ({ signal }) => {
      if (parsedQuery.type !== 'identity') throw new Error('unreachable');
      return fetchPubkeys(parsedQuery.platform, parsedQuery.namespace, signal);
    },
    enabled: isEnabled && queryType === 'identity',
    placeholderData: keepPreviousData,
    staleTime: 120_000,
  });

  // DID search (identity by DID)
  const identityQuery = useQuery({
    queryKey:
      queryType === 'did'
        ? registryKeys.identity(parsedQuery.normalized)
        : registryKeys.identity(''),
    queryFn: ({ signal }) =>
      fetchIdentity(parsedQuery.normalized, signal),
    enabled: isEnabled && queryType === 'did',
    placeholderData: keepPreviousData,
    staleTime: 120_000,
  });

  // Repo search — try registry artifacts first, fall back to resolveFromRepo
  const repoQuery = useQuery({
    queryKey:
      queryType === 'repo'
        ? registryKeys.search(parsedQuery.normalized)
        : registryKeys.search(''),
    queryFn: async ({ signal }): Promise<RegistrySearchResult> => {
      // Try registry API first
      try {
        const artifacts = await fetchArtifacts(parsedQuery.normalized, undefined, signal);
        if (artifacts.entries.length > 0) {
          return { type: 'artifacts', data: artifacts };
        }
      } catch {
        // Registry returned nothing or errored — fall back
      }
      // Fall back to git resolver
      const resolved = await resolveFromRepo(parsedQuery.normalized);
      return { type: 'repo', data: resolved };
    },
    enabled: isEnabled && queryType === 'repo',
    placeholderData: keepPreviousData,
    staleTime: 120_000,
  });

  // Unified result
  const result = useMemo((): {
    data: RegistrySearchResult | undefined;
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: Error | null;
  } => {
    switch (queryType) {
      case 'package':
        return {
          data: artifactQuery.data
            ? {
                type: 'artifacts',
                data: {
                  entries: artifactQuery.data.pages.flatMap((p) => p.entries),
                  next_cursor: artifactQuery.data.pages.at(-1)?.next_cursor,
                },
              }
            : undefined,
          isLoading: artifactQuery.isLoading,
          isFetching: artifactQuery.isFetching,
          isError: artifactQuery.isError,
          error: artifactQuery.error,
        };
      case 'identity':
        return {
          data: pubkeysQuery.data
            ? { type: 'pubkeys', data: pubkeysQuery.data }
            : undefined,
          isLoading: pubkeysQuery.isLoading,
          isFetching: pubkeysQuery.isFetching,
          isError: pubkeysQuery.isError,
          error: pubkeysQuery.error,
        };
      case 'did':
        return {
          data: identityQuery.data
            ? { type: 'identity', data: identityQuery.data }
            : undefined,
          isLoading: identityQuery.isLoading,
          isFetching: identityQuery.isFetching,
          isError: identityQuery.isError,
          error: identityQuery.error,
        };
      case 'repo':
        return {
          data: repoQuery.data,
          isLoading: repoQuery.isLoading,
          isFetching: repoQuery.isFetching,
          isError: repoQuery.isError,
          error: repoQuery.error,
        };
      default:
        return {
          data: isEnabled ? { type: 'empty' } : undefined,
          isLoading: false,
          isFetching: false,
          isError: false,
          error: null,
        };
    }
  }, [
    queryType,
    isEnabled,
    artifactQuery.data,
    artifactQuery.isLoading,
    artifactQuery.isFetching,
    artifactQuery.isError,
    artifactQuery.error,
    pubkeysQuery.data,
    pubkeysQuery.isLoading,
    pubkeysQuery.isFetching,
    pubkeysQuery.isError,
    pubkeysQuery.error,
    identityQuery.data,
    identityQuery.isLoading,
    identityQuery.isFetching,
    identityQuery.isError,
    identityQuery.error,
    repoQuery.data,
    repoQuery.isLoading,
    repoQuery.isFetching,
    repoQuery.isError,
    repoQuery.error,
  ]);

  return {
    ...result,
    parsedQuery,
    // Expose infinite query pagination controls for package results
    fetchNextPage: queryType === 'package' ? artifactQuery.fetchNextPage : undefined,
    hasNextPage: queryType === 'package' ? artifactQuery.hasNextPage : undefined,
    isFetchingNextPage: queryType === 'package' ? artifactQuery.isFetchingNextPage : undefined,
  };
}
