# fn-7.4 Read server trust tier in useIdentityProfile

## Description
## Read server trust tier in useIdentityProfile

The backend now returns `trust_tier` and `trust_score` in the identity response. Update `useIdentityProfile` to prefer the server value when present, falling back to client-side computation.

### Changes
1. In `queries/registry.ts` `useIdentityProfile` (line ~124): after `fetchIdentity(did)`, check if `data.trust_tier` and `data.trust_score` exist
2. If server provides them, use those values directly instead of calling `computeTrustTier()`
3. Still call `computeTrustTier()` as fallback when server fields are absent
4. This is a graceful migration — no visual changes, just data source change

### Notes
- The raw API response comes through `fetchIdentity` which transforms `key_state`. The `trust_tier` and `trust_score` fields are at the top level of the backend `IdentityResponse::Active` variant.
- May need to preserve them through the `fetchIdentity` transformation.
## Acceptance
- [ ] `useIdentityProfile` reads `trust_tier` from server when present
- [ ] Falls back to `computeTrustTier()` when server field absent
- [ ] No visual changes to identity/org pages
- [ ] `pnpm typecheck` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
