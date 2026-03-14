# fn-6.7 Add activity feed filters: target_did, package

## Description
## Add activity feed filters: target_did, package

**Repos:** auths-cloud

### Problem
Activity feed only supports `actor` and `entry_type` filters. Missing `target_did` (the DID that was acted upon) and `package` (events related to a specific package). The `metadata` JSONB column contains these values under varying keys.

### Changes Required
1. **`routes/activity.rs` `FeedQueryParams`** — Add `target_did: Option<String>` and `package: Option<String>` params
2. **Dynamic SQL builder** — Add JSONB containment queries:
   - `target_did`: `metadata @> '{"member_did": "..."}'::jsonb OR metadata @> '{"delegate_did": "..."}'::jsonb OR metadata @> '{"subject_did": "..."}'::jsonb`
   - `package`: `metadata @> '{"package_name": "..."}'::jsonb`
3. **Migration** — Add GIN index on `metadata` column: `CREATE INDEX idx_log_entries_metadata ON log_entries USING GIN (metadata)`

### Notes
- The dynamic SQL builder is at `activity.rs:96-141` — follow existing pattern
- GIN index required for JSONB containment queries to be performant
## Acceptance
- [ ] `?target_did=` filter works on activity feed
- [ ] `?package=` filter works on activity feed
- [ ] GIN index added on `metadata` column
- [ ] Existing `actor` and `entry_type` filters still work
- [ ] `cargo build -p auths-registry-server --all-features` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
