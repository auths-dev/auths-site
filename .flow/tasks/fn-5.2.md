# fn-5.2 Surface is_abandoned flag in identity UI

## Description
## Surface is_abandoned flag in identity UI

**Repo:** auths-site
**Depends on:** fn-5.1 (error parsing fix)

### Problem

The backend returns `is_abandoned` inside `identity_state.key_state`, but `fetchIdentity()` at `registry.ts:361-383` drops this field during the response transformation. The `ActiveIdentity` TypeScript type has no `is_abandoned` field. Abandoned identities display identically to active ones.

### Changes Required

1. **`apps/web/src/lib/api/registry.ts`** — Add `is_abandoned?: boolean` and `abandoned_at?: string` to `ActiveIdentity` type; extract from `key_state` in `fetchIdentity()` transformation
2. **`apps/web/src/app/registry/identity/[did]/identity-client.tsx`** — Add prominent banner when `is_abandoned === true`: amber/yellow background, "This identity was abandoned on {date}. Artifacts signed before abandonment remain verifiable."
3. **`apps/web/src/lib/api/fixtures.ts`** — Add at least one abandoned identity to fixture personas for testing
4. **`apps/web/src/lib/api/registry.ts:433-475`** — Consider whether `computeTrustTier` should return a special tier for abandoned identities (e.g., score = 0 or a distinct "abandoned" tier)

### Design
- Banner: full-width, amber-500/10 bg, amber-500 border-l-4, amber-200 text
- Position: directly below the identity header, above key display
- Include the abandonment date formatted with `formatRelativeTime()`
## Acceptance
- [ ] `ActiveIdentity` type includes `is_abandoned` and `abandoned_at` fields
- [ ] `fetchIdentity()` extracts `is_abandoned` from backend response
- [ ] Identity page shows amber banner when `is_abandoned === true`
- [ ] Banner includes formatted abandonment date
- [ ] At least one fixture persona is abandoned
- [ ] `computeTrustTier` handles abandoned identities (returns score 0 or "abandoned" tier)
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` passes
## Done summary
- Added is_abandoned/abandoned_at to ActiveIdentity and fetchIdentity
- computeTrustTier returns breakdown scores, handles abandoned identities (score 0)
- Added amber abandoned banner to identity page
- Added abandoned fixture persona
## Evidence
- Commits: 7de17383622a542c0db69154f07afbfcf14ce4a6
- Tests:
- PRs: