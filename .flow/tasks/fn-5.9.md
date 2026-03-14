# fn-5.9 Update frontend to use batch identity endpoint

## Description
## Update frontend to use batch identity endpoint

**Repo:** auths-site
**Depends on:** fn-5.8 (backend batch endpoint)

### Problem

`fetchPackageDetail()` at `registry.ts:391-433` fetches all artifacts, extracts unique signer DIDs, then calls `fetchIdentity()` individually per signer (batched client-side in groups of 5). With the new backend batch endpoint, this N+1 pattern can be replaced.

### Changes Required

1. **`apps/web/src/lib/api/registry.ts`** — Add `fetchBatchIdentities(dids: string[])` function using `registryFetch` to call `POST /v1/identities/batch`
2. **`apps/web/src/lib/api/registry.ts:391-433`** — Refactor `fetchPackageDetail` to use `fetchBatchIdentities` instead of the loop with `Promise.all` batches
3. **`apps/web/src/lib/queries/registry.ts:33-52`** — Add `batchIdentities` key to `registryKeys` factory
4. **`apps/web/src/lib/api/fixtures.ts`** — Add `resolveBatchIdentitiesFixture()` that returns fixture data for known persona DIDs

### Notes
- Check `USE_FIXTURES` before calling the real API
- Max 100 DIDs per batch (enforced server-side, but client should also cap)
- Keep the cap of 10 signers in `fetchPackageDetail` — only batch those 10
- Cache invalidation: updating a single identity should also invalidate batch queries that included it
## Acceptance
- [ ] `fetchBatchIdentities()` function calls `POST /v1/identities/batch`
- [ ] `fetchPackageDetail` uses batch endpoint instead of individual identity calls
- [ ] `registryKeys` factory includes batch identity key
- [ ] Fixture for batch identities exists and works with `USE_FIXTURES=true`
- [ ] Package detail page loads correctly with real and fixture data
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
