# fn-8.11 Navigation + final verification

## Description
## What
Add "Get Started" to site navigation and run final verification.

## Files
- Modify: `apps/web/src/components/site-nav.tsx:17-21` — add to NAV_LINKS

## Navigation
- Add `{ label: 'Get Started', href: '/try' }` to `NAV_LINKS` array
- Active state follows existing pattern: `pathname === '/try' || pathname.startsWith('/try/')`

## Final verification
- `pnpm exec tsc --noEmit -p apps/web/tsconfig.json` — no errors
- `pnpm --filter web build` — build succeeds
- All new files exist in correct locations
- Smoke test: dev server renders `/try` with "Onboarding" text
## Acceptance
- [ ] "Get Started" link appears in site nav
- [ ] Active state works on `/try` and `/try?flow=...`
- [ ] TypeScript compiles with zero errors
- [ ] Production build succeeds
- [ ] Dev server renders `/try` correctly
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
