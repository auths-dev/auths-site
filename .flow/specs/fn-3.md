# Public Registry: Unified Discovery Engine

## Overview

Build the presentation layer for the Public Registry at `/registry` in auths-site, fully integrated with the backend API at `public.auths.dev` from day one. This is a unified discovery interface that allows users to search for software artifacts (packages, repositories) and cryptographic identities (@usernames, DIDs) — bridging the gap between what was built and who built it.

The registry page serves as the primary onboarding funnel: when a searched identity has no associated keys, it renders a `ClaimIdentityCTA` with tailored CLI commands to establish their cryptographic identity.

## Scope

**In scope:**
- Add "Public Registry" navigation tab to the global header
- Create `/registry` route following existing `/explorer` architecture (Server Component page → Client Component)
- Omni-search input supporting prefixed queries (`npm:package`, `github/org/repo`, `gitlab:username`, `radicle:did:key:...`, `@username`) AND raw input detection (full URLs, raw DIDs without prefixes)
- Search input parser composed of small DRY utility functions with platform/namespace abstraction
- Registry API client (`lib/api/registry.ts`) with typed fetch wrappers for all backend endpoints
- All search types hit live backend endpoints — no stubs:
  - Packages: `GET /v1/artifacts?package={query}` with cursor-based pagination (`useInfiniteQuery`)
  - Repos: Registry API first, client-side `resolveFromRepo()` fallback
  - Identities: `GET /v1/pubkeys?platform={platform}&namespace={namespace}`
  - DIDs: `GET /v1/identities/{did}` with discriminated union response handling
- Artifact results component with digest display, clickable signer DIDs for search pivoting
- Trust graph visualization for git resolver fallback results
- `ClaimIdentityCTA` with two variants: platform+namespace and raw DID
- Isolated TanStack Query functions with AbortSignal forwarding and `useInfiniteQuery` for pagination
- URL-synced search state (`?q=...`) via `router.replace`
- Component documentation in `registry_ui.md` (no stub docs — documents live API integration, schemas, pagination state machine)

**Out of scope (deferred):**
- GitLab adapter for git resolver fallback (existing stub returns error)
- Detail sub-routes (`/registry/[type]/[id]`)
- Server-side rendering of search results
- GitHub API rate limiting strategy beyond existing in-memory caching (only affects git resolver fallback)

## Approach

Follow the established `/explorer` architecture:
- **Server Component page** (`app/registry/page.tsx`): metadata, async `searchParams`, `<Suspense>` with skeleton fallback (disabled search bar + ghost result cards)
- **Client Component** (`app/registry/registry-client.tsx`): `'use client'`, URL-synced search via `router.replace`
- **Search parser** (`lib/registry.ts`): composed of DRY helpers (extractPlatformPrefix, detectUrl, detectDid, detectIdentityShorthand, detectRepoPattern). Platform/namespace abstraction, not just username.
- **API client** (`lib/api/registry.ts`): small focused fetch functions (fetchArtifacts, fetchPubkeys, fetchIdentity) with typed responses matching backend OpenAPI schemas
- **Query hooks** (`lib/queries/registry.ts`): `useInfiniteQuery` for artifact pagination, `useQuery` for identity/DID lookups, AbortSignal forwarding
- **Artifact results** (`components/artifact-results.tsx`): formatted digest_hex, clickable signer_did for search pivot
- **ClaimIdentityCTA** (`components/claim-identity-cta.tsx`): two variants — platform+namespace (with attest step) and raw DID (without attest step)
- **Reuse existing code**: `@/lib/resolver` (fallback for repo search), CSS custom properties, `motion/react`
- **Hand-rolled components**: no shadcn/ui (project convention)

### Key conventions
- `@/*` import alias → `./src/*`
- `kebab-case.tsx` filenames, `PascalCase` exports
- `'use client'` directive at line 1, `pt-28` header offset
- CSS variables: `var(--border)`, `var(--muted-bg)`, `var(--accent-verified)`, etc.
- TanStack Query: `staleTime: 120_000`, `enabled: !!value`, AbortSignal forwarding

### Key files
- **Modify**: `apps/web/src/components/site-nav.tsx`
- **Create**: `apps/web/src/app/registry/page.tsx`, `registry-client.tsx`
- **Create**: `apps/web/src/lib/registry.ts` (types, parser, CLI instructions)
- **Create**: `apps/web/src/lib/api/registry.ts` (API client)
- **Create**: `apps/web/src/lib/queries/registry.ts` (TanStack Query hooks)
- **Create**: `apps/web/src/components/claim-identity-cta.tsx`
- **Create**: `apps/web/src/components/artifact-results.tsx`
- **Create**: `docs/registry_ui.md`

## Quick commands

```bash
cd apps/web && pnpm dev
cd apps/web && pnpm tsc --noEmit
pnpm lint
cd apps/web && pnpm build
```

## Risks & Dependencies

| Risk | Mitigation |
|------|-----------|
| Backend API at `public.auths.dev` unavailable/unstable | API client throws typed `RegistryApiError`; UI shows error state with retry. Base URL configurable via env var. |
| GitHub API rate limiting (git resolver fallback) | Only used as fallback when registry returns nothing. Existing in-memory caching. |
| `NAV_LINKS` overflow on mobile | Mobile nav hidden below `md` breakpoint. Document as known limitation. |
| Cursor-based pagination complexity | `useInfiniteQuery` handles pagination state. "Load More" button pattern is straightforward. |
| Discriminated union response for identities | API client returns parsed response; UI branches on `status` field without throwing. |
| Clipboard API blocked in some browsers | Fallback to text selection + tooltip. Never fail silently. |
| URL encoding of special characters | Proper encode/decode in URL state sync and API calls. |

## Acceptance Criteria

- [ ] "Public Registry" tab in header nav, links to `/registry`
- [ ] `/registry` loads with meaningful skeleton fallback during network request
- [ ] Package search (`npm:auths-cli`) queries `GET /v1/artifacts` and shows paginated artifact results
- [ ] "Load More" button fetches next page of artifacts via cursor-based pagination
- [ ] Artifact entries display digest_hex (truncated), package_name, signer_did (clickable), published_at
- [ ] Clicking signer_did pivots search to that identity
- [ ] Repo search queries registry API first, falls back to git resolver if empty
- [ ] Pasting raw URLs (`https://gitlab.com/org/repo`) and raw DIDs (`did:key:z6Mk...`) work without prefixes
- [ ] Identity search queries `GET /v1/pubkeys` — shows keys if active, `ClaimIdentityCTA` if unclaimed
- [ ] DID search queries `GET /v1/identities/{did}` — shows KERI state if active, `ClaimIdentityCTA` (raw DID variant) if unclaimed
- [ ] `ClaimIdentityCTA` has two variants: platform+namespace (with attest) and raw DID (without attest)
- [ ] Search state in URL via `router.replace` — shareable, no history pollution
- [ ] Copy-to-clipboard with visual feedback and graceful fallback
- [ ] `pnpm build` succeeds with no TypeScript errors
- [ ] All components follow project conventions

## References

- Existing explorer: `apps/web/src/app/explorer/`
- Navigation: `apps/web/src/components/site-nav.tsx`
- Resolver (fallback): `apps/web/src/lib/resolver.ts`
- Types: `packages/widget/src/resolvers/types.ts`
- KelTimeline: `apps/web/src/components/kel-timeline.tsx`
- Providers: `apps/web/src/app/providers.tsx`
- Global styles: `apps/web/src/app/globals.css`
- Backend OpenAPI spec: epic fn-15
