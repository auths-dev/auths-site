# fn-5.11 Remove /v1/activity/recent endpoint

## Description
## Remove /v1/activity/recent endpoint

**Repo:** auths-cloud + auths-site
**Depends on:** fn-5.10 (dashboard migration)

### Problem

`/v1/activity/recent` is a legacy endpoint superseded by `/v1/activity/feed`. After fn-5.10 migrates the dashboard, no frontend consumers remain.

### Changes Required

**Backend (auths-cloud):**
1. **`paths.rs`** — Remove `activity_recent()` path function from both `routes` and `test_paths`
2. **`routes/activity.rs`** — Remove the handler function for `/v1/activity/recent`
3. **`routes/mod.rs`** — Remove the route registration

**Frontend (auths-site):**
1. **`apps/web/src/lib/api/registry.ts`** — Remove `fetchRecentActivity()` function and `RecentActivity` type
2. **`apps/web/src/lib/queries/registry.ts`** — Remove `recentActivity` key from `registryKeys` factory and any associated hook
3. **`apps/web/src/lib/api/fixtures.ts`** — Remove `resolveRecentActivityFixture()`
4. **Verify** no remaining references to `activity/recent` in codebase

### Notes
- Search all repos for references to `activity/recent` before deleting
- Check that no CLI commands reference this endpoint
## Acceptance
- [ ] Backend `/v1/activity/recent` route removed
- [ ] Path function removed from `paths.rs`
- [ ] Handler function removed from `routes/activity.rs`
- [ ] Frontend `fetchRecentActivity()` and `RecentActivity` type removed
- [ ] `registryKeys.recentActivity` removed
- [ ] Fixture for recent activity removed
- [ ] No remaining references to `activity/recent` in any repo
- [ ] `cargo clippy --workspace` and `cargo nextest run --workspace` pass
- [ ] `pnpm typecheck` and `pnpm build` pass
## Done summary
Merged into another task. Pre-launch decision: no backwards compatibility needed.
## Evidence
- Commits:
- Tests:
- PRs: