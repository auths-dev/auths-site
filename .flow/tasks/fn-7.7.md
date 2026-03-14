# fn-7.7 Add fixture support for new fetch functions

## Description
## Add fixture support for new fetch functions

`fetchIdentitySearch`, `fetchNamespaceList`, and `fetchNetworkStats` have no `USE_FIXTURES` guard. Add fixture resolvers so the UI works in fixture mode.

### Changes
1. In `fixtures.ts`, add `resolveIdentitySearchFixture(query)` — returns matching personas by namespace prefix
2. Add `resolveNamespaceListFixture(ecosystem)` — returns namespace claims from existing package fixtures
3. Add `resolveNetworkStatsFixture()` — returns counts derived from fixture data
4. Add `USE_FIXTURES` guards to `fetchIdentitySearch`, `fetchNamespaceList`, `fetchNetworkStats` in `registry.ts`

### Notes
- Follow existing fixture pattern: `if (USE_FIXTURES) { const fixture = await resolveXxxFixture(...); if (fixture) return fixture; }`
- Derive fixture data from existing personas and packages (don't create new data)
## Acceptance
- [ ] `fetchIdentitySearch` returns fixture data when `USE_FIXTURES=true`
- [ ] `fetchNamespaceList` returns fixture data when `USE_FIXTURES=true`
- [ ] `fetchNetworkStats` returns fixture data when `USE_FIXTURES=true`
- [ ] All fixtures derive from existing persona/package data
- [ ] `pnpm typecheck` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
