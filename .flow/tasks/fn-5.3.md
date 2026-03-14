# fn-5.3 Extract shared UI constants (TIER_STYLES, entryDetail)

## Description
## Extract shared UI constants (TIER_STYLES, entryDetail)

**Repo:** auths-site

### Problem

Two pieces of code are duplicated:
1. `TIER_STYLES` — identical mapping in `identity-client.tsx:20-25` and `org-client.tsx:20-25`
2. `entryDetail()` — extracts DID/package links from `FeedEntry.metadata`, duplicated between `live-network-activity.tsx:27-72` and `org-client.tsx:240-285`

### Changes Required

1. **Create `apps/web/src/lib/tier-styles.ts`** — Export `TIER_STYLES` mapping (both files are `'use client'` so this can be a plain TS module)
2. **Create `apps/web/src/lib/entry-detail.ts`** — Export `entryDetail()` function
3. **Update `identity-client.tsx`** — Import from shared module, remove local definition
4. **Update `org-client.tsx`** — Import both from shared modules, remove local definitions
5. **Update `live-network-activity.tsx`** — Import `entryDetail()` from shared module, remove local definition

### Conventions
- Follow existing file organization: utility modules go in `lib/`
- Both modules are client-safe (no server-only imports)
- Keep exact same function signatures to avoid cascading changes
## Acceptance
- [ ] `TIER_STYLES` defined in one place (`lib/tier-styles.ts`) and imported by identity-client and org-client
- [ ] `entryDetail()` defined in one place (`lib/entry-detail.ts`) and imported by live-network-activity and org-client
- [ ] No duplicate definitions remain in the codebase
- [ ] All existing behavior preserved (no visual or functional changes)
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
