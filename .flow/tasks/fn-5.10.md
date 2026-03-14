# fn-5.10 Migrate dashboard from /activity/recent to /activity/feed

## Description
## Replace /activity/recent with /activity/feed and remove legacy endpoint

**Repo:** auths-cloud + auths-site

### Problem

`/v1/activity/recent` is a legacy endpoint superseded by `/v1/activity/feed`. The dashboard currently depends on it. Since we're pre-launch with zero users, we can remove it outright in one shot — no migration period needed.

### Changes Required

**Frontend (auths-site):**
1. **Analyze** what `RecentActivity` provides that `FeedEntry[]` does not — likely separate `recent_artifacts` and `recent_identities` arrays plus ecosystem counts
2. **Add client-side derivation** from `FeedEntry[]`:
   - Recent artifacts: filter entries where `entry_type` is `attest` or `artifact_publish`
   - Recent identities: filter entries where `entry_type` is `identity_inception` or `claim_add`
   - Ecosystem counts: group artifact entries by ecosystem from `metadata`
3. **Update `RegistryDashboard`** to consume `fetchActivityFeed()` instead of `fetchRecentActivity()`
4. **Delete** `fetchRecentActivity()`, `RecentActivity` type, `resolveRecentActivityFixture()`, and `registryKeys.recentActivity`
5. **Update fixtures** — ensure `resolveActivityFeedFixture()` returns enough data to populate dashboard sections

**Backend (auths-cloud):**
6. **`paths.rs`** — Remove `activity_recent()` from both `routes` and `test_paths`
7. **`routes/activity.rs`** — Remove the handler function
8. **`routes/mod.rs`** — Remove the route registration
9. **Verify** no remaining references to `activity/recent` across all repos

### Notes
- No backwards compat concern — zero users, pre-launch
- Just delete everything in one pass
## Migrate dashboard from /activity/recent to /activity/feed

**Repo:** auths-site

### Problem

`RegistryDashboard` uses `fetchRecentActivity()` which calls `/v1/activity/recent` — a legacy endpoint. The replacement `/v1/activity/feed` has a different response shape (`FeedEntry[]` vs `RecentActivity` with separate `recent_artifacts` and `recent_identities` arrays). The dashboard needs to derive its data from the unified feed.

### Changes Required

1. **Analyze `fetchRecentActivity()` response shape** — Understand what `RecentActivity` provides that `FeedEntry[]` does not
2. **Add client-side derivation** — From `FeedEntry[]`, derive:
   - Recent artifacts: filter entries where `entry_type` is `attest` or `artifact_publish`
   - Recent identities: filter entries where `entry_type` is `identity_inception` or `claim_add`
   - Ecosystem counts: group artifact entries by ecosystem from `metadata`
3. **Update `RegistryDashboard`** — Consume `fetchActivityFeed()` (which already exists) instead of `fetchRecentActivity()`
4. **Update `registryKeys`** — Remove `recentActivity` key if no longer used
5. **Update fixtures** — Ensure `resolveActivityFeedFixture()` returns enough data to populate dashboard sections

### Caution
- Do NOT remove the `/v1/activity/recent` backend endpoint in this task — that's fn-5.11
- Ensure the dashboard still renders correctly in fixture mode
## Acceptance
- [ ] Dashboard uses `/v1/activity/feed` instead of `/v1/activity/recent`
- [ ] Recent artifacts section correctly derived from feed entries
- [ ] Recent identities section correctly derived from feed entries
- [ ] Ecosystem counts correctly derived from feed entries
- [ ] Backend `/v1/activity/recent` route, handler, and path function removed
- [ ] Frontend `fetchRecentActivity()`, `RecentActivity` type, fixture, and query key removed
- [ ] No remaining references to `activity/recent` in any repo
- [ ] Dashboard renders correctly in fixture mode
- [ ] `cargo clippy --workspace` and `cargo nextest run --workspace` pass
- [ ] `pnpm typecheck` and `pnpm build` pass
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
