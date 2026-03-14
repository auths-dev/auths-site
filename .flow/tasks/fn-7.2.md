# fn-7.2 Switch useRegistrySearch to fetchIdentitySearch for @user queries

## Description
## Switch useRegistrySearch to fetchIdentitySearch for @user queries

Currently `useRegistrySearch` routes `identity` type queries (e.g. `@torvalds`) to `fetchPubkeys` which only returns keys for an exact platform+namespace match. Switch to `fetchIdentitySearch` which supports prefix search across all identities.

### Changes
1. In `queries/registry.ts` `useRegistrySearch`, replace the `identity` case (lines ~183-196) to use `fetchIdentitySearch(parsedQuery.namespace)` instead of `fetchPubkeys(parsedQuery.platform, parsedQuery.namespace)`
2. Add `identitySearch` to the `RegistrySearchResult` union type: `| { type: 'identitySearch'; data: IdentitySearchResponse }`
3. In `registry-client.tsx`, add a result handler for `identitySearch` type that renders a list of matching identities with DID links
4. Remove the `pubkeys` result type if no longer used (or keep for backwards compat)

### Notes
- `IdentitySearchResponse` already has `results: IdentitySearchResult[]` with `did`, `platform`, `namespace`
- Link each result to `/registry/identity/{did}`
## Acceptance
- [ ] Searching `@torv` returns matching identities from server-side search
- [ ] Results show DID, platform, namespace with links to identity pages
- [ ] `RegistrySearchResult` includes `identitySearch` variant
- [ ] `pnpm typecheck` passes
## Done summary
- All 7 frontend tasks implemented in single commit
- Stats widget, identity search, namespace browse, server trust tier, badge embed, org policy, fixtures
## Evidence
- Commits: 1f5827c5af7b5007332b95e86895a8021cacee07
- Tests: pnpm typecheck
- PRs: