# Unified Onboarding Wizard (`/try`)

## Overview

Build a single `/try` page with "Onboarding" title and two large selector buttons: **Individuals** and **Organizations**. Clicking one unfolds that wizard below with `motion/react` animation. Both flows share DID challenge-response authentication via a shared `AuthContext`.

- **Individual flow**: 3 sequential steps (install → create identity → publish), registry-verified
- **Org flow**: 3 free-form task cards (create org, invite members, set policy), full backend writes
- **Join page**: `/join/[code]` route for org invite links, bridges to individual flow for new users

## Scope

### In scope
- `/try` page with flow selector and both wizard flows
- `/join/[code]` invite landing page
- Shared `AuthContext` + `ChallengeAuth` components
- Auth and org write API client functions
- Fixture support for development without backend
- Navigation link ("Get Started" in site nav)
- Redirect-aware completion CTAs

### Out of scope
- `auths-cloud` backend endpoints (separate epic)
- `auths` CLI changes (separate epic)
- Individual onboarding tutorial content pages (docs)
- Real-time invite acceptance polling (nice-to-have, deferred)

## Approach

### Architecture
- Single `/try` route, no sub-routes for steps (ephemeral state, no URL state sync)
- `AuthProvider` wraps both flows at `TryClient` level — auth persists across flow switch
- Individual flow: sequential steps gated by completion, `AnimatePresence mode="wait"`
- Org flow: independent task cards, each tracks own status
- API client extends existing `registry.ts` with authenticated fetch wrapper

### Key design decisions
- **Ephemeral auth**: Token in React state only (no cookies/localStorage), gone on tab close
- **`?redirect` param**: Validated to start with `/` to prevent open redirects
- **Existing user path**: "I already have an identity" option in individual flow skips to auth step
- **Existing org path**: Manual org DID input field in CreateOrgCard for users with existing orgs
- **`fetchArtifactsBySigner`**: New function needed — existing `fetchArtifacts` queries by package name, not signer DID
- **Auth expiry**: `isAuthenticated` checks `expiresAt` against current time

### Reuse points
- `apps/web/src/components/copy-button.tsx` — clipboard button (use instead of building new CopyCommand)
- `apps/web/src/components/terminal-block.tsx` — terminal UI for CLI commands
- `apps/web/src/components/auths-verify-widget.tsx` — WASM verify widget for completion
- `apps/web/src/lib/api/registry.ts` — extend with auth + org write functions
- `apps/web/src/lib/queries/registry.ts` — extend `registryKeys` factory
- `apps/web/src/lib/metadata.ts` — `constructMetadata()` for page metadata
- `apps/web/src/lib/config.ts` — `REGISTRY_BASE_URL`, `USE_FIXTURES`

### File structure
```
apps/web/src/lib/auth/auth-context.tsx       — AuthContext provider
apps/web/src/components/challenge-auth.tsx    — DID challenge-response UI
apps/web/src/components/copy-command.tsx      — Command display with copy
apps/web/src/app/try/page.tsx                 — Server component
apps/web/src/app/try/try-client.tsx           — Flow selector + wizard shell
apps/web/src/app/try/individual/             — Individual flow components
apps/web/src/app/try/org/                    — Org flow components
apps/web/src/app/join/[code]/               — Invite landing page
```

## Quick commands

```bash
# Type check
pnpm exec tsc --noEmit -p apps/web/tsconfig.json

# Dev server
pnpm --filter web dev

# Build
pnpm --filter web build

# Smoke test: page renders
curl -s http://localhost:3000/try | grep -q "Onboarding" && echo "PASS" || echo "FAIL"
```

## Acceptance criteria

- [ ] `/try` renders with "Onboarding" title and two selector buttons
- [ ] Clicking "Individuals" unfolds the 3-step sequential wizard with animation
- [ ] Clicking "Organizations" unfolds the 3-card free-form wizard with animation
- [ ] DID challenge-response auth works for both flows
- [ ] Auth token expiry is checked before API calls
- [ ] `?redirect` param is validated (same-origin only) and used in completion CTAs
- [ ] `?flow=individual` and `?flow=org` pre-select the flow
- [ ] `/join/[code]` shows invite details and links to individual wizard for new users
- [ ] "Get Started" link appears in site navigation
- [ ] All ARIA attributes present (aria-current, aria-expanded, aria-live)
- [ ] TypeScript compiles with no errors
- [ ] Build succeeds

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Backend endpoints not ready | Fixture support for all new API functions; wizard works in development mode |
| React Compiler issues with AnimatePresence | Test empirically; add `"use no memo"` directive if needed |
| Auth token expiry mid-wizard | Proactive expiry check in AuthContext; re-auth preserves wizard state |

## References

- Design docs: `docs/plans/2026-03-15-org-onboarding-design.md`, `docs/plans/2026-03-15-individual-onboarding-design.md`
- Implementation plan: `docs/plans/2026-03-15-onboarding-wizard.md`
- Existing patterns: `apps/web/src/app/registry/page.tsx` (server+Suspense+client), `apps/web/src/components/onboarding-terminal.tsx` (tabbed terminal)
- API client: `apps/web/src/lib/api/registry.ts`
- Query hooks: `apps/web/src/lib/queries/registry.ts`
