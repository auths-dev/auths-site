# fn-3.6 Write registry_ui.md component documentation

## Description
## Write registry_ui.md component documentation

### What
Create `docs/registry_ui.md` as the definitive source of truth for the registry feature — documenting component props, pagination state machine, API contracts, and multi-forge parser logic. This prevents the codebase from becoming cluttered with redundant inline documentation.

### How
1. **Create** `docs/registry_ui.md`:

   **Sections:**
   - **Overview**: Public Registry feature purpose, relationship to `public.auths.dev` backend
   - **Architecture**: Server Component page → Client Component pattern, data flow from backend API through TanStack Query to React components
   - **API Client** (`lib/api/registry.ts`):
     - `registryFetch` base wrapper
     - `fetchArtifacts(query, cursor?, signal?)` → `GET /v1/artifacts?package={query}`
     - `fetchPubkeys(platform, namespace, signal?)` → `GET /v1/pubkeys`
     - `fetchIdentity(did, signal?)` → `GET /v1/identities/{did}`
     - Response types and discriminated union handling
     - `RegistryApiError` typed error
   - **Data Schemas**:
     - `ArtifactEntry`: `package_name`, `digest_algorithm`, `digest_hex`, `signer_did`, `published_at`
     - `ArtifactQueryResponse`: paginated with `entries`, `next_cursor`
     - `PubkeysResponse`, `IdentityResponse` (active vs unclaimed)
   - **Components**:
     - `RegistryClient`: URL state management, search routing
     - `RegistrySkeleton`: Suspense fallback layout
     - `TrustGraph`: vertical timeline visualization, accepts `ResolveResult` prop
     - `ArtifactResults`: entry rendering, digest_hex display (full hash in DOM, visually truncated), clickable signer_did
     - `ClaimIdentityCTA`: two variants (platform+namespace, raw DID)
     - `TerminalBlock`: clipboard behavior with DOMException handling
   - **Utilities**:
     - Parser helpers (extractPlatformPrefix, detectUrl, detectDid, detectIdentityShorthand, detectRepoPattern) with input/output examples
     - `generateCliInstructions()`: three variants
   - **Query Layer**:
     - `registryKeys` factory and cache invalidation
     - `useRegistrySearch()`: orchestrator, debouncing, AbortSignal propagation chain
     - `useArtifactSearch()`: `useInfiniteQuery`, cursor-based pagination
     - Pagination state machine: idle → loading → has_more → loading_more → complete
   - **Known Limitations**: Mobile nav, GitHub rate limits on git resolver fallback, nav exact match

   This file is the centralized reference. Keep inline code comments minimal — clear variable names and this documentation should speak for themselves.

### Key references
- All files created in fn-3.1 through fn-3.8
- Existing docs: `docs/quickstart.md`
- Backend OpenAPI spec: epic fn-15
## Write registry_ui.md component documentation

### What
Create `docs/registry_ui.md` documenting all registry components, the API client, data schemas consumed from the backend, pagination state machine, and the multi-forge parser logic. No stub documentation — all search types are live.

### How
1. **Create** `docs/registry_ui.md`:

   **Sections:**
   - **Overview**: Public Registry feature purpose, relationship to `public.auths.dev` backend
   - **Architecture**: Server Component page → Client Component pattern, data flow from backend API through TanStack Query to React components. Include text diagram of the data flow.
   - **API Client** (`lib/api/registry.ts`):
     - `fetchArtifacts(query, cursor?, signal?)` → `GET /v1/artifacts?package={query}`
     - `fetchPubkeys(platform, namespace, signal?)` → `GET /v1/pubkeys?platform={platform}&namespace={namespace}`
     - `fetchIdentity(did, signal?)` → `GET /v1/identities/{did}`
     - Response types: `ArtifactQueryResponse`, `PubkeysResponse`, `IdentityResponse`
     - Discriminated union handling for identity responses (`status: "active"` vs `status: "unclaimed"`)
   - **Data Schemas**:
     - `ArtifactEntry`: `package_name`, `digest_hex`, `digest_algorithm`, `signer_did`, `published_at`
     - `ArtifactQueryResponse`: paginated response with `entries`, `next_cursor`
     - `PubkeysResponse`: public keys and platform claims for an identity
     - `IdentityResponse`: KERI identity state (active or unclaimed)
   - **Components**:
     - `RegistryClient`: Main client component, URL state management via `router.replace`, search routing
     - `ArtifactResults`: Renders `ArtifactEntry` list with truncated `digest_hex`, clickable `signer_did` for search pivot
     - `ClaimIdentityCTA`: Two variants (platform+namespace vs raw DID), props, usage examples
     - `TerminalBlock`: Copy-to-clipboard with fallback, `data-clipboard-text` pattern
     - Trust graph timeline (git resolver fallback): Repository → Signer DID → Platform Attestation → Device Key
   - **Utilities**:
     - `parseSearchQuery()`: Composed of DRY helper functions (extractPlatformPrefix, detectUrl, detectDid, detectIdentityShorthand, detectRepoPattern). Document each helper with input/output examples.
     - `generateCliInstructions()`: Three variants (platform+namespace, raw DID, radicle DID)
   - **Query Layer**:
     - `registryKeys`: Key factory pattern and cache invalidation
     - `useRegistrySearch()`: Orchestrator hook, debouncing, AbortSignal forwarding
     - `useArtifactSearch()`: `useInfiniteQuery` hook with cursor-based pagination
     - Pagination state machine: idle → loading → has_more → loading_more → complete (document transitions)
   - **Known Limitations**: Mobile nav hidden below `md` breakpoint, GitHub rate limits on git resolver fallback, `pathname === link.href` exact match in nav

   Keep inline code comments minimal — clear variable names and this documentation should be the primary reference.

### Key references
- All files created in fn-3.1 through fn-3.8
- Existing docs pattern: `docs/quickstart.md`
- Backend OpenAPI spec: epic fn-15
## Write registry_ui.md component documentation

### What
Create `docs/registry_ui.md` documenting all new registry components, their props, usage, architecture decisions, and explicit mapping from stubs to future backend endpoints.

### How
1. **Create** `docs/registry_ui.md`:

   **Sections:**
   - **Overview**: Brief description of the Public Registry feature and its purpose
   - **Architecture**: Server Component page → Client Component pattern, data flow diagram (text), trust graph visualization approach
   - **Components**:
     - `RegistryClient`: Main client component, props, URL state management, `router.replace` usage
     - `ClaimIdentityCTA`: Props (ClaimIdentityProps with `platform` + `namespace`), usage example, platform support including Radicle
     - `TerminalBlock`: Copy-to-clipboard behavior, clipboard fallback strategy, accessibility notes, `data-clipboard-text` pattern
     - Trust graph timeline: vertical visualization of Repository → Signer DID → Platform Attestation → Device Key
   - **Utilities**:
     - `parseSearchQuery()`: Input format, return types, examples for each prefix AND for raw input detection (URLs, DIDs without prefixes)
     - `generateCliInstructions()`: Args, output format, platform-specific behavior (username vs DID namespaces)
   - **Query Layer**:
     - `registryKeys`: Key factory pattern and cache invalidation
     - `useRegistrySearch()`: Hook API, debouncing behavior, AbortSignal forwarding, URL encoding handling
     - `searchRegistry()`: Resolution strategies per type, signal parameter
   - **Stub-to-API Mapping** (REQUIRED):
     Explicitly map each stub to the future backend endpoint it will consume when the API is ready:
     - Package search stub → `GET /v1/artifacts?package={name}` (auths-registry-server, epic fn-15)
     - Identity search stub → `GET /v1/identities?platform={platform}&namespace={namespace}` (auths-registry-server, epic fn-15)
     - DID search stub → `GET /v1/identities?did={did}` (auths-registry-server, epic fn-15)
     - Note: when the API is ready, swapping stubs requires ONLY replacing the `queryFn` in TanStack Query — zero changes to React components (because `RegistrySearchResult` types already mirror the backend OpenAPI schemas)
   - **Known Limitations**: Mobile nav, GitHub rate limits, stub search types, no sub-routes, GitLab adapter is a stub

### Key references
- All files created in fn-3.1 through fn-3.5
- Existing docs pattern: `docs/quickstart.md`
- Backend OpenAPI spec: epic fn-15
## Write registry_ui.md component documentation

### What
Create `docs/registry_ui.md` documenting all new registry components, their props, usage, and architecture decisions.

### How
1. **Create** `docs/registry_ui.md`:

   **Sections:**
   - **Overview**: Brief description of the Public Registry feature and its purpose
   - **Architecture**: Server Component page → Client Component pattern, data flow diagram (text)
   - **Components**:
     - `RegistryClient`: Main client component, props, URL state management
     - `ClaimIdentityCTA`: Props (ClaimIdentityProps), usage example, platform support
     - `TerminalBlock`: Copy-to-clipboard behavior, accessibility notes
   - **Utilities**:
     - `parseSearchQuery()`: Input format, return types, examples for each prefix
     - `generateCliInstructions()`: Args, output format
   - **Query Layer**:
     - `registryKeys`: Key factory pattern and cache invalidation
     - `useRegistrySearch()`: Hook API, debouncing behavior, stub types
     - `searchRegistry()`: Resolution strategies per type
   - **Stub Types**: Document which search types are stubbed and what the future integration path is (npm, DID, identity reverse-lookup)
   - **Known Limitations**: Mobile nav, GitHub rate limits, stub search types, no sub-routes

### Key references
- All files created in fn-3.1 through fn-3.5
- Existing docs pattern: `docs/quickstart.md`
## Acceptance
- [ ] `docs/registry_ui.md` exists with all sections listed above
- [ ] No stub documentation — all search types documented as live API integrations
- [ ] API client functions documented with HTTP method, path, query params, response types
- [ ] `ArtifactEntry` and `ArtifactQueryResponse` schemas documented
- [ ] Discriminated union handling for `IdentityResponse` documented
- [ ] `RegistryApiError` typed error documented
- [ ] Pagination state machine documented with transitions
- [ ] Multi-forge parser logic documented with all helper functions and examples
- [ ] `TrustGraph` component documented with prop types
- [ ] `ArtifactResults` digest_hex display strategy documented (full hash in DOM, visually truncated)
- [ ] ClaimIdentityCTA two variants documented
- [ ] AbortSignal propagation chain documented end-to-end
- [ ] Known limitations listed
- [ ] Serves as the definitive source of truth — enables minimal inline comments in code
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
