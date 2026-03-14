# fn-6.6 Add artifact revocation frontend display

## Description
## Add artifact revocation frontend display

**Repos:** auths-site
**Depends on:** fn-6.5

### Problem
Frontend `PackageRelease.status` has `'valid' | 'revoked'` but `fetchPackageDetail` hardcodes `'valid'`. After fn-6.5 adds backend revocation, the frontend needs to read and display revocation status.

### Changes Required
1. **`registry.ts`** — Update `fetchPackageDetail` to read `revoked_at` from artifact response and set `status: 'revoked'` when present
2. **`provenance-ledger.tsx`** — Style revoked releases differently (red border, strikethrough, "Revoked" badge)
3. **`chain-of-trust.tsx`** — Show warning when viewing trust chain for a revoked release
4. **`fixtures.ts`** — The XZ Utils persona already has `status: 'revoked'` releases — verify they display correctly
5. **`activity-events.ts`** — Add `attest_revoke` event config if a new entry type is surfaced in the feed
## Acceptance
- [ ] Revoked releases show distinct visual treatment (red styling, "Revoked" badge)
- [ ] Trust chain shows warning for revoked releases
- [ ] `fetchPackageDetail` reads revocation status from API response
- [ ] XZ Utils fixture releases display as revoked
- [ ] `pnpm typecheck` passes
## Done summary
- All remaining tasks implemented
- Frontend: revocation display, search, stats, namespace browse types
- Backend: monitor alignment, badge SVG already in previous commit
## Evidence
- Commits: 66f43d8a6f6e5e1ac19fee5b1fdda7563e59a9b7
- Tests:
- PRs: