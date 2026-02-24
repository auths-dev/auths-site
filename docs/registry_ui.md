# Public Registry UI

## Overview

The Public Registry is the discovery engine for the Auths Web of Trust. It enables searching for signed software artifacts (packages, repositories) and cryptographic identities (platform usernames, DIDs) via the `public.auths.dev` backend API. All searches hit live endpoints — there are no stubs.

## Architecture

```
Server Component (page.tsx)
  │  ↓ searchParams
  │  Suspense boundary → RegistrySkeleton fallback
  │
  └─ Client Component (registry-client.tsx)
       │  ↓ useSearchParams + useRouter.replace
       │
       └─ useRegistrySearch(query)         ← TanStack Query orchestrator
            │  ↓ parseSearchQuery(query)   ← classify input type
            │
            ├─ package  → useArtifactSearch  → fetchArtifacts  → GET /v1/artifacts
            ├─ identity → useQuery           → fetchPubkeys    → GET /v1/pubkeys
            ├─ did      → useQuery           → fetchIdentity   → GET /v1/identities/{did}
            └─ repo     → useQuery           → fetchArtifacts (fallback: resolveFromRepo)
```

Data flows from `public.auths.dev` through the API client (`lib/api/registry.ts`), into TanStack Query hooks (`lib/queries/registry.ts`), and finally into React components. URL state (`?q=`) is the single source of truth for the current search.

## API Client

**File:** `apps/web/src/lib/api/registry.ts`

### Base Configuration

- `REGISTRY_BASE_URL`: defaults to `https://public.auths.dev`, configurable via `NEXT_PUBLIC_REGISTRY_URL`
- `registryFetch(path, params?, signal?)`: shared wrapper that constructs URLs, appends query params, sets `Accept: application/json`, and throws `RegistryApiError` on HTTP 4xx/5xx

### Functions

**`fetchArtifacts(query, cursor?, signal?)`**
- `GET /v1/artifacts?package={query}&cursor={cursor}`
- Returns `ArtifactQueryResponse`
- Cursor-based pagination: pass `next_cursor` from previous response

**`fetchPubkeys(platform, namespace, signal?)`**
- `GET /v1/pubkeys?platform={platform}&namespace={namespace}`
- Returns `PubkeysResponse`

**`fetchIdentity(did, signal?)`**
- `GET /v1/identities/{encodeURIComponent(did)}`
- Returns `IdentityResponse` (discriminated union)
- Validates `status` field before casting — unknown values throw `RegistryApiError(502)` instead of producing unsafe casts

### Error Handling

- `RegistryApiError`: typed error with `status: number`, `message: string`, `detail?: string`
- HTTP 4xx/5xx → throws `RegistryApiError`
- Network failures propagated as-is for TanStack Query retry logic

## Data Schemas

### ArtifactEntry

| Field              | Type   | Description                        |
| ------------------ | ------ | ---------------------------------- |
| `package_name`     | string | Full package name                  |
| `digest_algorithm` | string | Hash algorithm (e.g. `sha256`)     |
| `digest_hex`       | string | Full hex digest                    |
| `signer_did`       | string | DID of the signer                  |
| `published_at`     | string | ISO 8601 timestamp                 |

### ArtifactQueryResponse

| Field         | Type             | Description                     |
| ------------- | ---------------- | ------------------------------- |
| `entries`     | ArtifactEntry[]  | Page of results                 |
| `next_cursor` | string?          | Cursor for next page (if any)   |

### PubkeysResponse

| Field             | Type              | Description               |
| ----------------- | ----------------- | ------------------------- |
| `did`             | string            | The identity's DID        |
| `public_keys`     | PublicKey[]        | Registered public keys    |
| `platform_claims` | PlatformClaim[]   | Verified platform claims  |

### IdentityResponse (discriminated union)

**Active:** `{ status: 'active'; did; public_keys; platform_claims; artifacts }`
**Unclaimed:** `{ status: 'unclaimed'; did }`

The client validates `status` against a known set before type narrowing.

## Components

### RegistryClient

**File:** `apps/web/src/app/registry/registry-client.tsx`

Main client component. Manages URL state via `useSearchParams` + `useRouter.replace()` (not `push` — avoids polluting browser history). Delegates search to `useRegistrySearch`, renders results by type.

### RegistrySkeleton

**File:** `apps/web/src/components/registry-skeleton.tsx`

Suspense fallback. Renders skeleton search bar + 4 ghost result cards with staggered `animate-pulse` delays.

### TrustGraph

**File:** `apps/web/src/components/trust-graph.tsx`

Vertical timeline visualization for git resolver fallback results. Accepts `ResolveResult` as prop. Renders nodes: Repository → Signer DID → Public Key → Platform Attestation → Device Key. Staggered `motion.div` animations. Nodes connected by a vertical line using `var(--border)`.

### ArtifactResults

**File:** `apps/web/src/components/artifact-results.tsx`

Renders `ArtifactEntry[]` as a list. Each row shows package name, digest, signer DID, and timestamp.

**Digest display strategy:** The full `digest_hex` is present in the DOM so manual text selection copies the complete hash. Visual truncation uses a hidden middle span (`max-w-0 overflow-hidden`). The display shows `sha256:first8...last8`. A "Copy" button provides one-click full-hash copying. Full hash is also available via `title` attribute.

**Signer DID:** Rendered as a button styled with `var(--accent-verified)` color. Clicking calls `onSignerClick(did)` to pivot the search.

### ClaimIdentityCTA

**File:** `apps/web/src/components/claim-identity-cta.tsx`

Two variants based on props (`ClaimIdentityProps`):

| Variant            | Trigger                              | Heading                                        | CLI includes attest? |
| ------------------ | ------------------------------------ | ---------------------------------------------- | -------------------- |
| Platform+namespace | `platform` and `namespace` provided  | "@{namespace} has not been claimed on {platform}" | Yes                  |
| Raw DID            | Only `did` provided                  | "This identity prefix has not been registered"   | No                   |

### TerminalBlock

Co-located in `claim-identity-cta.tsx`. macOS window chrome (red/yellow/green dots), dark terminal aesthetic. Copy button uses `navigator.clipboard.writeText()` with `DOMException` catch — falls back to text selection + "Press Ctrl+C" tooltip. `aria-live="polite"` announces copy result. `$` prompt has `select-none`. `data-clipboard-text` attribute stores clean command text.

## Utilities

**File:** `apps/web/src/lib/registry.ts`

### parseSearchQuery(input)

Classifies raw omni-search input into a `ParsedSearchQuery` discriminated union. Composed of 5 DRY helper functions:

| Helper                     | Detects                          | Example input                  | Result type  |
| -------------------------- | -------------------------------- | ------------------------------ | ------------ |
| `extractPlatformPrefix`    | `gitlab:`, `radicle:`, `github/` | `gitlab:torvalds`              | identity     |
| `detectUrl`                | Full or bare URLs                | `https://github.com/org/repo`  | repo         |
| `detectDid`                | `did:<method>:<id>` pattern      | `did:key:z6MkTest`             | did          |
| `detectIdentityShorthand`  | `@username` pattern              | `@torvalds`                    | identity     |
| `detectRepoPattern`        | Bare `owner/repo`                | `auths/auths`                  | repo         |

Priority order: `npm:` prefix → platform prefix → URL → DID → `@` shorthand → bare repo → unknown.

### generateCliInstructions(props)

Three variants:

1. **Platform + namespace** (e.g. GitHub): `auths id create` → `auths id attest github --username {namespace}` → `auths id register`
2. **Raw DID** (no platform): `auths id create` → `auths id register` (omits attest)
3. **Radicle DID**: `auths id create` → `auths id attest radicle --did {namespace}` → `auths id register`

## Query Layer

**File:** `apps/web/src/lib/queries/registry.ts`

### registryKeys

Query key factory for cache management:

```
registryKeys.all           → ['registry']
registryKeys.artifact(q)   → ['registry', 'artifacts', q]
registryKeys.pubkey(p, n)  → ['registry', 'pubkeys', p, n]
registryKeys.identity(did) → ['registry', 'identities', did]
```

### useRegistrySearch(query)

Main orchestrator hook. Debounces input (300ms), parses via `parseSearchQuery`, routes to the appropriate query hook. Returns unified `{ data, isLoading, isFetching, isError, error, parsedQuery }` plus pagination controls for package results.

- `enabled: debouncedQuery.length >= 2`
- `staleTime: 120_000` (2 minutes)
- `placeholderData: keepPreviousData` for non-paginated types

### useArtifactSearch(query)

`useInfiniteQuery` hook for cursor-based pagination:

- `queryFn: ({ pageParam, signal }) => fetchArtifacts(query, pageParam, signal)`
- `getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined`

### AbortSignal Propagation

Signal flows end-to-end: TanStack Query `queryFn({ signal })` → hook → API client function → `fetch(url, { signal })`. Rapid typing cancels in-flight requests, freeing browser connection pools.

### Pagination State Machine

```
idle → loading → has_data
                  ├─ has_more (next_cursor present)
                  │   └─ loading_more (fetchNextPage called)
                  │       └─ has_data (repeat)
                  └─ complete (no next_cursor)
```

UI: "Load More" button visible when `hasNextPage`, disabled with "Loading..." during `isFetchingNextPage`, hidden when all pages loaded.

## Known Limitations

- **Mobile nav**: "Public Registry" link hidden below `md` breakpoint (no mobile hamburger menu)
- **GitHub rate limits**: Git resolver fallback (`resolveFromRepo`) hits GitHub API directly without authentication — subject to 60 req/hour anonymous limit
- **Nav active state**: Uses `pathname === link.href` exact match — no partial matching for sub-routes
- **No sub-routes**: `/registry` is a single page; no `/registry/artifact/:id` detail views yet
