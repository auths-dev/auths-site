# fn-3.7 Create Registry API Client

## Description
## Create Registry API Client

### What
Implement the HTTP fetch wrappers that communicate with `public.auths.dev`. Small, DRY functions with strong separation of concerns. Each function must be documented with description, arguments, and sample usage — just like the parser utilities.

### How
1. **Create** `apps/web/src/lib/api/registry.ts`:

   **Base configuration:**
   - `REGISTRY_BASE_URL` configurable via `NEXT_PUBLIC_REGISTRY_URL` env var, defaults to `'https://public.auths.dev'`
   - `registryFetch(path: string, params?: Record<string, string>, signal?: AbortSignal)` — shared base wrapper that constructs URLs, appends query params, sets headers, handles HTTP errors

   **Focused fetch functions (small, DRY, documented with JSDoc):**

   Each function must include a JSDoc block with description, arguments, and sample usage so they are easily consumable by the React hooks:

   `fetchArtifacts(query: string, cursor?: string, signal?: AbortSignal): Promise<ArtifactQueryResponse>`
   - `GET /v1/artifacts?package={query}&cursor={cursor}`
   - Returns `{ entries: ArtifactEntry[]; next_cursor?: string }`

   `fetchPubkeys(platform: Platform, namespace: string, signal?: AbortSignal): Promise<PubkeysResponse>`
   - `GET /v1/pubkeys?platform={platform}&namespace={namespace}`
   - Returns public keys and platform claims

   `fetchIdentity(did: string, signal?: AbortSignal): Promise<IdentityResponse>`
   - `GET /v1/identities/{did}`
   - Returns discriminated union: `{ status: 'active'; ... }` | `{ status: 'unclaimed'; ... }`
   - **Union type safety**: Explicitly validate the `status` field from the parsed JSON before narrowing the type. Do not blindly cast. If the backend introduces a new `status` value in the future, the function should return a safe fallback or throw a typed error rather than producing a runtime crash from an invalid cast.

   **Error handling:**
   - HTTP 4xx/5xx → throw `RegistryApiError` with `status`, `message`, optional `detail`
   - Network failures propagated as-is for TanStack Query
   - Do NOT silently swallow errors

   **Types** (all exported):
   - `ArtifactEntry`, `ArtifactQueryResponse`
   - `PubkeysResponse`
   - `IdentityResponse` (discriminated union)
   - `RegistryApiError`

   All response types must match backend OpenAPI schemas (epic fn-15).

### Key references
- Backend OpenAPI spec: epic fn-15
- Existing API route pattern: `apps/web/src/app/api/github/release-assets/route.ts`
- Registry types: `apps/web/src/lib/registry.ts` (Platform from fn-3.2)
## Create Registry API Client

### What
Implement the HTTP fetch wrappers that communicate with `public.auths.dev`. Small, DRY functions with strong separation of concerns — not a monolithic fetch file.

### How
1. **Create** `apps/web/src/lib/api/registry.ts`:

   **Base configuration:**
   - `REGISTRY_BASE_URL = 'https://public.auths.dev'` (or configurable via env var `NEXT_PUBLIC_REGISTRY_URL`)
   - Shared `registryFetch(path: string, params?: Record<string, string>, signal?: AbortSignal)` helper that constructs the full URL, appends query params, sets headers, and handles HTTP error responses

   **Focused fetch functions (small, DRY, single responsibility):**

   `fetchArtifacts(query: string, cursor?: string, signal?: AbortSignal): Promise<ArtifactQueryResponse>`
   - Calls `GET /v1/artifacts?package={query}&cursor={cursor}`
   - Returns typed `ArtifactQueryResponse`: `{ entries: ArtifactEntry[]; next_cursor?: string }`
   - `ArtifactEntry`: `{ package_name: string; digest_algorithm: string; digest_hex: string; signer_did: string; published_at: string }`

   `fetchPubkeys(platform: Platform, namespace: string, signal?: AbortSignal): Promise<PubkeysResponse>`
   - Calls `GET /v1/pubkeys?platform={platform}&namespace={namespace}`
   - Returns typed `PubkeysResponse` with public keys and platform claims

   `fetchIdentity(did: string, signal?: AbortSignal): Promise<IdentityResponse>`
   - Calls `GET /v1/identities/{did}`
   - Returns typed `IdentityResponse` — a discriminated union:
     - `{ status: 'active'; ... }` — active identity with key state, attestations
     - `{ status: 'unclaimed'; ... }` — unclaimed DID prefix
   - Handle this union safely: the function returns the parsed response, allowing the UI to branch on `status` without throwing network errors

   **Error handling:**
   - HTTP 4xx/5xx responses throw a typed `RegistryApiError` with `status`, `message`, and optional `detail`
   - Network failures (fetch rejects) are propagated as-is for TanStack Query to handle
   - Do NOT silently swallow errors or convert them to empty results

   **Types** (export from this file or from `@/lib/registry`):
   - `ArtifactEntry`, `ArtifactQueryResponse`
   - `PubkeysResponse`
   - `IdentityResponse` (discriminated union)
   - `RegistryApiError`

   All response types must match the OpenAPI schemas defined in the backend (epic fn-15).

### Key references
- Backend OpenAPI spec: epic fn-15
- Existing API route pattern: `apps/web/src/app/api/github/release-assets/route.ts`
- Registry types: `apps/web/src/lib/registry.ts` (Platform type from fn-3.2)
## Acceptance
- [ ] `fetchArtifacts('auths-cli')` calls `GET /v1/artifacts?package=auths-cli`
- [ ] `fetchArtifacts('auths-cli', 'cursor123', signal)` includes cursor and forwards signal to `fetch()`
- [ ] `fetchPubkeys('github', 'torvalds')` calls `GET /v1/pubkeys?platform=github&namespace=torvalds`
- [ ] `fetchIdentity('did:keri:E8jsh...')` calls `GET /v1/identities/{did}`
- [ ] Active identity response (`status: "active"`) returned without throwing
- [ ] Unclaimed identity response (`status: "unclaimed"`) returned without throwing
- [ ] Unknown `status` values from backend do NOT produce runtime crash — safe fallback or typed error
- [ ] HTTP 4xx/5xx throw typed `RegistryApiError`
- [ ] Each function is small, focused, and DRY
- [ ] Each function has JSDoc with description, arguments, and sample usage
- [ ] AbortSignal propagates all the way to the `fetch()` call
- [ ] Base URL configurable via `NEXT_PUBLIC_REGISTRY_URL`
- [ ] All types exported from `@/lib/api/registry`
- [ ] `pnpm build` succeeds
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
