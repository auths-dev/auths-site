# fn-3.3 Create isolated TanStack Query functions for registry search

## Description
## Create isolated TanStack Query functions for registry search

### What
Create `apps/web/src/lib/queries/registry.ts` with query hooks that map directly to the backend API routes at `public.auths.dev`. No stubs. Package/artifact queries use `useInfiniteQuery` for cursor-based pagination. AbortSignal must propagate all the way down to the underlying `fetch()` call.

### How
1. **Create** `apps/web/src/lib/queries/registry.ts`:

   **Query key factory:**
   ```typescript
   export const registryKeys = {
     all: ['registry'] as const,
     searches: () => [...registryKeys.all, 'search'] as const,
     search: (query: string) => [...registryKeys.searches(), query] as const,
     artifacts: () => [...registryKeys.all, 'artifacts'] as const,
     artifact: (query: string) => [...registryKeys.artifacts(), query] as const,
   }
   ```

   **Search routing by type — all mapped to backend endpoints:**

   - `type === 'package'`: `GET /v1/artifacts?package={query}` via `useInfiniteQuery`
   - `type === 'repo'`: Registry API first (`GET /v1/artifacts?package={repo_url}`), fall back to `resolveFromRepo()` only if registry returns nothing
   - `type === 'identity'`: `GET /v1/pubkeys?platform={platform}&namespace={namespace}`
   - `type === 'did'`: `GET /v1/identities/{did}`

   **AbortSignal propagation (critical for performance):**
   The signal must pass through every layer — from TanStack Query's `queryFn: ({ signal })` through the query hook, into the API client function (`fetchArtifacts`, `fetchPubkeys`, `fetchIdentity`), and all the way into the underlying `fetch(url, { signal })` call. This ensures that rapid typing in the omni-search bar actively cancels in-flight network requests, freeing up browser connection pools. Do not let the signal stop at an intermediate layer.

   **Custom hooks:**

   `useRegistrySearch(query: string)` — main orchestrator:
   - Debounce the query string (300ms)
   - Parse with `parseSearchQuery`
   - Route to appropriate query hook based on parsed type
   - Forward `AbortSignal` through all layers
   - `enabled: debouncedQuery.length >= 2`
   - `placeholderData: keepPreviousData` (for `useQuery`-based types)
   - `staleTime: 120_000`

   `useArtifactSearch(query: string)` — infinite query for artifact/package results:
   - `useInfiniteQuery` with cursor-based pagination
   - `queryFn: ({ pageParam, signal }) => fetchArtifacts(query, pageParam, signal)`
   - `getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined`

   **URL encoding**: Proper encode/decode for `@`, `/`, `:` characters.

   All fetch calls use the API client from fn-3.7.

### Key references
- TanStack Query provider: `apps/web/src/app/providers.tsx`
- Explorer query pattern: `apps/web/src/app/explorer/explorer-client.tsx:26-31`
- Resolver (fallback): `apps/web/src/lib/resolver.ts`
- Registry types: `apps/web/src/lib/registry.ts` (fn-3.2)
- API client: `apps/web/src/lib/api/registry.ts` (fn-3.7)
## Create isolated TanStack Query functions for registry search

### What
Create `apps/web/src/lib/queries/registry.ts` with query hooks that map directly to the backend API routes at `public.auths.dev`. No stubs — all search types hit real endpoints. Package/artifact queries use `useInfiniteQuery` for cursor-based pagination.

### How
1. **Create** `apps/web/src/lib/queries/registry.ts`:

   **Query key factory:**
   ```typescript
   export const registryKeys = {
     all: ['registry'] as const,
     searches: () => [...registryKeys.all, 'search'] as const,
     search: (query: string) => [...registryKeys.searches(), query] as const,
     artifacts: () => [...registryKeys.all, 'artifacts'] as const,
     artifact: (query: string) => [...registryKeys.artifacts(), query] as const,
   }
   ```

   **Search routing by type — all mapped to backend endpoints:**

   - `type === 'package'`: **`GET /v1/artifacts?package={query}`**
     - Use `useInfiniteQuery` (NOT `useQuery`) to support cursor-based pagination from the backend
     - `getNextPageParam` extracts the cursor from the API response
     - Returns `ArtifactQueryResponse` (paginated list of `ArtifactEntry` records)

   - `type === 'repo'`: **`GET /v1/artifacts?package={repo_url}`** first, then fall back to client-side `resolveFromRepo()` only if the registry API returns nothing
     - Two-phase resolution: registry API first, git resolver fallback
     - Returns `ArtifactQueryResponse` or `ResolveResult`

   - `type === 'identity'`: **`GET /v1/pubkeys?platform={platform}&namespace={namespace}`**
     - Returns `PubkeysResponse` with the identity's public keys and platform claims
     - If response indicates unclaimed status, return data needed for `ClaimIdentityCTA`

   - `type === 'did'`: **`GET /v1/identities/{did}`**
     - Returns parsed KERI identity state from the backend
     - Handle discriminated union response: `status: "active"` vs `status: "unclaimed"`

   **Custom hooks:**

   `useRegistrySearch(query: string)` — main orchestrator:
   - Debounce the query string (300ms)
   - Use `parseSearchQuery` to classify the input
   - Route to the appropriate query hook based on `parsedQuery.type`
   - Forward `AbortSignal` to all fetch calls via `queryFn: ({ signal }) => ...`
   - `enabled: debouncedQuery.length >= 2`
   - `placeholderData: keepPreviousData` (for `useQuery`-based types)
   - `staleTime: 120_000`
   - Return `{ data, isLoading, isFetching, isPlaceholderData, isError, error, parsedQuery, fetchNextPage?, hasNextPage?, isFetchingNextPage? }`

   `useArtifactSearch(query: string)` — dedicated infinite query hook for artifact/package results:
   - Uses `useInfiniteQuery` with cursor-based pagination
   - `queryKey: registryKeys.artifact(query)`
   - `queryFn: ({ pageParam, signal }) => fetchArtifacts(query, pageParam, signal)`
   - `getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined`
   - `initialPageParam: undefined`

   **URL encoding**: Ensure queries with `@`, `/`, `:` characters are properly encoded in API calls and decoded for cache keys.

   **All fetch calls** use the API client from fn-3.7 (`@/lib/api/registry`).

### Key references
- TanStack Query provider: `apps/web/src/app/providers.tsx`
- TanStack Query useInfiniteQuery: for cursor-based pagination
- Explorer query pattern: `apps/web/src/app/explorer/explorer-client.tsx:26-31`
- Resolver (fallback): `apps/web/src/lib/resolver.ts`
- Registry types: `apps/web/src/lib/registry.ts` (from fn-3.2)
- API client: `apps/web/src/lib/api/registry.ts` (from fn-3.7)
## Create isolated TanStack Query functions for registry search

### What
Create `apps/web/src/lib/queries/registry.ts` with a query key factory and search query hooks, isolated from UI components per the spec requirement. Wire AbortSignal for cancellation and handle URL encoding for special characters.

### How
1. **Create** `apps/web/src/lib/queries/registry.ts`:

   **Query key factory:**
   ```typescript
   export const registryKeys = {
     all: ['registry'] as const,
     searches: () => [...registryKeys.all, 'search'] as const,
     search: (query: string) => [...registryKeys.searches(), query] as const,
   }
   ```

   **Search function** `searchRegistry(parsed: ParsedSearchQuery, signal?: AbortSignal): Promise<RegistrySearchResult>`:
   - **Accept and forward `AbortSignal`** to all underlying fetch calls. Even though current implementations use local stubs, wiring the signal now prevents race conditions when the real API is integrated. Use the TanStack Query pattern: `queryFn: ({ signal }) => searchRegistry(parsedQuery, signal)`
   - `type === 'repo'`: call `resolveFromRepo(normalized)` from `@/lib/resolver`, forwarding signal if the resolver supports it
   - `type === 'identity'`: return unclaimed stub result (with `ClaimIdentityProps` data using `platform` and `namespace`)
   - `type === 'package'`: return "coming soon" stub
   - `type === 'did'`: return "coming soon" stub
   - `type === 'unknown'`: return no-results state

   **Custom hook** `useRegistrySearch(query: string)`:
   - Debounce the query string (300ms)
   - Use `parseSearchQuery` to classify the input
   - **URL encoding**: Ensure the debounced query is properly encoded/decoded for URL state. Search queries contain `@`, `/`, `:` characters (e.g., `did:keri:E...`, `@username`, `github/org/repo`). The query key must use the decoded form for cache hits, while URL params use encoded form.
   - Call `useQuery` with:
     - `queryKey: registryKeys.search(debouncedQuery)`
     - `queryFn: ({ signal }) => searchRegistry(parsedQuery, signal)` — **must destructure and forward signal**
     - `enabled: debouncedQuery.length >= 2`
     - `placeholderData: keepPreviousData`
     - `staleTime: 120_000` (2 min — identity data changes rarely)
   - Return `{ data, isLoading, isFetching, isPlaceholderData, isError, error, parsedQuery }`

   **Result types** (must mirror backend OpenAPI schemas from fn-15):
   - `RegistrySearchResult`: discriminated union by search type (imported from `@/lib/registry`)
   - Repo results: `{ type: 'repo'; data: ResolveResult }`
   - Identity results: `{ type: 'identity'; claimed: boolean; claimProps?: ClaimIdentityProps; data?: IdentityBundle }`
   - Stub results: `{ type: 'stub'; message: string }`

### Key references
- TanStack Query provider: `apps/web/src/app/providers.tsx` (staleTime: 60_000 default)
- Explorer query pattern: `apps/web/src/app/explorer/explorer-client.tsx:26-31`
- Resolver: `apps/web/src/lib/resolver.ts`
- Registry types: `apps/web/src/lib/registry.ts` (from fn-3.2)
- TanStack Query AbortSignal docs: queryFn receives `{ signal }` from QueryFunctionContext
## Create isolated TanStack Query functions for registry search

### What
Create `apps/web/src/lib/queries/registry.ts` with a query key factory and search query hooks, isolated from UI components per the spec requirement.

### How
1. **Create** `apps/web/src/lib/queries/registry.ts`:

   **Query key factory:**
   ```typescript
   export const registryKeys = {
     all: ['registry'] as const,
     searches: () => [...registryKeys.all, 'search'] as const,
     search: (query: string) => [...registryKeys.searches(), query] as const,
   }
   ```

   **Search function** `searchRegistry(parsed: ParsedSearchQuery)`:
   - `type === 'repo'`: call `resolveFromRepo(normalized)` from `@/lib/resolver`
   - `type === 'identity'`: return unclaimed stub result (with `ClaimIdentityProps` data)
   - `type === 'package'`: return "coming soon" stub
   - `type === 'did'`: return "coming soon" stub
   - `type === 'unknown'`: return no-results state

   **Custom hook** `useRegistrySearch(query: string)`:
   - Debounce the query string (300ms)
   - Use `parseSearchQuery` to classify the input
   - Call `useQuery` with:
     - `queryKey: registryKeys.search(debouncedQuery)`
     - `queryFn: () => searchRegistry(parsedQuery)`
     - `enabled: debouncedQuery.length >= 2`
     - `placeholderData: keepPreviousData`
     - `staleTime: 120_000` (2 min — identity data changes rarely)
   - Return `{ data, isLoading, isFetching, isPlaceholderData, isError, error, parsedQuery }`

   **Result types:**
   - `RegistrySearchResult`: discriminated union by search type
   - Repo results: `{ type: 'repo'; data: ResolveResult }`
   - Identity results: `{ type: 'identity'; claimed: boolean; claimProps?: ClaimIdentityProps; data?: IdentityBundle }`
   - Stub results: `{ type: 'stub'; message: string }`

### Key references
- TanStack Query provider: `apps/web/src/app/providers.tsx` (staleTime: 60_000 default)
- Explorer query pattern: `apps/web/src/app/explorer/explorer-client.tsx:26-31`
- Resolver: `apps/web/src/lib/resolver.ts`
- Registry types: `apps/web/src/lib/registry.ts` (from fn-3.2)
## Acceptance
- [ ] Package search calls `GET /v1/artifacts?package=auths-cli` via `useInfiniteQuery`
- [ ] `useArtifactSearch` supports cursor-based pagination with `getNextPageParam`
- [ ] Repo search queries registry API first, falls back to `resolveFromRepo()` only if registry returns nothing
- [ ] Identity search calls `GET /v1/pubkeys?platform=github&namespace=username`
- [ ] DID search calls `GET /v1/identities/{did}`
- [ ] DID discriminated union (`status: "active"` vs `status: "unclaimed"`) handled without throwing
- [ ] AbortSignal propagates from TanStack Query `queryFn` → API client function → `fetch(url, { signal })` (verified end-to-end)
- [ ] Rapid typing cancels in-flight requests (signal reaches the fetch layer)
- [ ] `useRegistrySearch` debounces input (300ms)
- [ ] Empty or short queries (<2 chars) do not trigger a fetch
- [ ] `placeholderData: keepPreviousData` used for non-paginated types
- [ ] Queries with special characters (`@`, `/`, `:`) do not break URL encoding or cache keys
- [ ] All hooks and functions importable from `@/lib/queries/registry`
- [ ] `pnpm build` succeeds
## Done summary
- Created apps/web/src/lib/queries/registry.ts with query key factory and hooks
- registryKeys factory: all, searches, search, artifacts, artifact, pubkeys, pubkey, identities, identity
- useArtifactSearch: useInfiniteQuery with cursor-based pagination, AbortSignal forwarded
- useRegistrySearch: main orchestrator that debounces (300ms), parses via parseSearchQuery, routes to correct hook
- Package type → useInfiniteQuery (fetchArtifacts), flattens pages for unified result
- Identity type → useQuery (fetchPubkeys) with keepPreviousData
- DID type → useQuery (fetchIdentity) with keepPreviousData
- Repo type → tries registry API first, falls back to resolveFromRepo
- AbortSignal propagates from TanStack queryFn → API client → fetch()
- RegistrySearchResult discriminated union: artifacts | pubkeys | identity | repo | empty
- Exposes fetchNextPage/hasNextPage/isFetchingNextPage for package pagination
- Verification: `pnpm build` succeeds
## Evidence
- Commits: a36bd8a
- Tests: pnpm build
- PRs: