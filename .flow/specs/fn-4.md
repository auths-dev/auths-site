# fn-4: Identity Profile + Package Detail Pages

## Overview

Build two new detail pages for the Public Registry:

1. **User Profile Page** (`/registry/identity/[did]`) — A "Developer Passport" proving who someone is across the decentralized web and what they have secured.
2. **Package Page** (`/registry/package/[ecosystem]/[...name]`) — Supply chain transparency page making cryptographic verification visual and undeniable.

Both pages serve a dual purpose: prove undeniable cryptographic trust (zero-trust verification) and drive viral network effects (gamification, ghost cards, invite loops).

## Scope

### In Scope
- Identity profile page with four zones: Header, Platform Passport, Key Display, Artifact Portfolio
- Package detail page with four zones: Header, Chain of Trust Timeline, Authorized Signers, Provenance Ledger
- Shared infrastructure: centralized icon system, extracted utilities, new libraries (boring-avatars, qrcode.react)
- API type extensions for new data shapes (frontend types — backend work is out of scope)
- Nav active state fix for sub-routes
- generateMetadata for SEO on both pages
- Cross-linking between pages and from existing search results
- Scroll-triggered animations on chain of trust timeline

### Out of Scope
- Backend API changes (we design frontend types and mock/derive data from existing endpoints)
- OG image generation (opengraph-image.tsx) — deferred
- JSON-LD structured data — deferred
- Virtual scrolling for provenance ledger — only if needed (start with simple pagination)
- Direct calls to npm/PyPI APIs for maintainer lists — derive from existing Auths API data
- Email/notification-based invite system for ghost maintainers — use shareable URL only

## Approach

### Architecture Decisions

**Routing**:
- Identity: `/registry/identity/[did]` — single segment; colons are valid URL path chars per RFC 3986; `did:keri:Eabc...` works natively. Use `decodeURIComponent()` defensively.
- Package: `/registry/package/[ecosystem]/[...name]` — catch-all `[...name]` handles scoped npm packages like `@scope/pkg` (path becomes `/registry/package/npm/@scope/pkg`).

**Data Strategy** (work with existing API, design for future):
- Trust score/tier: Compute client-side from available data (platform claim count, key count, artifact count, key age). Define tiers: Seedling (0-1 attestations), Verified (2-3), Trusted (4-5), Sovereign (6+).
- Device labels: Derive from `algorithm` + truncated `key_id` (e.g., "Ed25519 · 0x8f7a…").
- Key threshold: Show if API provides it in future; gracefully omit for now.
- Package detail: Compose from `fetchArtifacts(packageName)` grouped by package + signer identity lookups.
- Authorized signers: Derive from unique `signer_did` values in artifact results.
- Revocation status: Show "Valid" for all entries (no revocation data yet); design UI for future "Revoked" state.
- Ghost maintainers: Defer (requires npm API integration). Show only registered signers for MVP.

**Page Pattern** (matches existing convention):
```
page.tsx (Server Component) — metadata, async params, prefetch, Suspense
  → [page]-client.tsx (Client Component) — URL state, TanStack Query, rendering
    → Zone components (Client Components) — individual UI sections
```

**New Libraries**:
- `boring-avatars` — deterministic identicon from DID string (~2KB, zero network)
- `qrcode.react` — QR code SVG from DID string (~12KB gzipped)
- `@icons-pack/react-simple-icons` — tree-shakable ecosystem brand logos (npm, PyPI, Docker, GitHub, GitLab)

**Shared Utilities to Extract**:
- `formatRelativeTime()` → `src/lib/format.ts` (currently duplicated in artifact-results.tsx:11 and recent-activity-feed.tsx:24)
- `truncateMiddle()` → `src/lib/format.ts` (duplicated in trust-graph.tsx:43 and recent-activity-feed.tsx:41)
- `TerminalBlock` → `src/components/terminal-block.tsx` (currently private in claim-identity-cta.tsx:12)

**Icon Centralization**:
- Create `src/components/icons/` directory with:
  - `ecosystem-icon.tsx` — maps ecosystem name to Simple Icons component
  - `platform-icon.tsx` — maps platform name to SVG (reuse existing inline SVGs from lib/verification/)
  - `radicle.tsx` — custom Radicle SVG (not in Simple Icons)

### Reuse Points
- `active-identity-display.tsx` — ancestor of Identity Profile, has platform claims, keys, artifacts rendering
- `pubkeys-display.tsx` — key display with verified badges
- `artifact-results.tsx` — artifact list renderer with digest, copy, relative time
- `trust-graph.tsx` — vertical timeline with staggered motion animations (pattern for Chain of Trust)
- `kel-timeline.tsx` — similar timeline pattern
- `claim-identity-cta.tsx` — TerminalBlock sub-component for copy-paste CLI commands
- `registry-skeleton.tsx` — skeleton pattern for Suspense fallbacks
- `registryFetch<T>()` — generic API fetch wrapper
- `registryKeys` factory — TanStack Query key factory to extend
- `parseSearchQuery()` — search classifier (may need package detail route generation)

### Animation Patterns (match existing)
- Section entry: `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}`
- Staggered list: `delay: i * 0.04, duration: 0.2`
- Timeline nodes: `initial={{ opacity: 0, x: -8 }} delay: i * 0.08, duration: 0.25, ease: 'easeOut'`
- Chain of Trust: use `whileInView` with `viewport={{ once: true, amount: 0.2 }}` + `staggerChildren: 0.15`

## Quick Commands

```bash
# Smoke test: build passes
PATH="/Users/bordumb/.nvm/versions/node/v20.19.6/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" npx next build

# Type check
cd /Users/bordumb/workspace/repositories/auths-base/auths-site/apps/web && PATH="/Users/bordumb/.nvm/versions/node/v20.19.6/bin:/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" npx tsc --noEmit
```

## Acceptance

- [ ] Both routes render without errors: `/registry/identity/did:keri:test` and `/registry/package/npm/test-pkg`
- [ ] Identity page shows all four zones with appropriate empty/loading states
- [ ] Package page shows all four zones with chain of trust animation
- [ ] Nav "Public Registry" link highlights on all sub-routes
- [ ] Icons centralized in `src/components/icons/`
- [ ] Shared utilities extracted (no duplicates of formatRelativeTime, truncateMiddle)
- [ ] TerminalBlock extracted and reusable
- [ ] `boring-avatars` renders identicon for DIDs without GitHub avatar
- [ ] QR code renders in identity header
- [ ] Trust tier badge computes from available data
- [ ] Platform passport shows verified + ghost cards
- [ ] generateMetadata produces correct title/description on both pages
- [ ] Build passes with no TypeScript errors
- [ ] All components follow existing conventions (JSDoc, motion/react, Tailwind tokens, 'use client')

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Package detail API doesn't exist | Design frontend types + compose from existing fetchArtifacts + identity lookups. Add TODO comments for future dedicated endpoint. |
| Trust score algorithm is arbitrary | Keep it simple (count-based), document thresholds, make it configurable. |
| React Compiler breaks motion animations | Test whileInView pattern early in task 7. Use `'use no memo'` directive if needed. |
| Scoped npm packages in URL | Catch-all `[...name]` segment handles slashes. |
| Large provenance tables | Start with cursor pagination (existing pattern). Add virtual scrolling only if needed. |
| GitHub avatar CDN rate limiting | boring-avatars as fallback, next/image optimization with caching. |

## References

- Existing registry components: `src/components/active-identity-display.tsx`, `pubkeys-display.tsx`, `artifact-results.tsx`, `trust-graph.tsx`, `claim-identity-cta.tsx`
- API client: `src/lib/api/registry.ts` (registryFetch, types)
- Query hooks: `src/lib/queries/registry.ts` (registryKeys factory)
- Theme tokens: `src/app/globals.css` (@theme inline block)
- Animation patterns: `motion/react` v12, whileInView, staggerChildren
- Libraries: boring-avatars, qrcode.react, @icons-pack/react-simple-icons
- Next.js 16 params: Promise-based, must await
- fn-3 spec: `.flow/specs/fn-3.md` (registry feature foundation)
