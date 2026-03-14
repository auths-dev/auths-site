# fn-6.16 Integrate global search in frontend

## Description
## Integrate global search in frontend

**Repos:** auths-site
**Depends on:** fn-6.10 (identity search), fn-6.11 (namespace browse)

### Problem
Frontend `useRegistrySearch` at `queries/registry.ts:162-326` does client-side search routing to different endpoints. With new server-side search (fn-6.10) and namespace browse (fn-6.11), the frontend can offer richer search.

### Changes Required
1. **`registry.ts`** — Add `fetchIdentitySearch()` and `fetchNamespaceList()` functions
2. **`queries/registry.ts`** — Add query keys and integrate into `useRegistrySearch`:
   - Identity queries (`@username` prefix) → use `GET /v1/identities/search` instead of pubkeys endpoint
   - Package queries → also search namespaces via `GET /v1/namespaces?ecosystem=...`
3. **`registry-client.tsx`** — Update search results to show identity search results and namespace browse results
4. **`fixtures.ts`** — Add fixtures for new search/browse endpoints
5. Add search placeholder: `Search by package (npm:react), identity (@username), or DID (did:keri:...)`

### Notes
- Use `registryFetch()` for all new fetch functions
- Add keys to `registryKeys` factory
- Check `USE_FIXTURES` before API calls
## Acceptance
- [ ] Identity search uses server-side endpoint instead of pubkeys
- [ ] Namespace browse results appear in search
- [ ] Fixtures exist for new endpoints
- [ ] Search placeholder shows example queries
- [ ] `pnpm typecheck` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
