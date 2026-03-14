# fn-5.13 Add keyset pagination to unpaginated list endpoints

## Description
## Add keyset pagination to unpaginated list endpoints

**Repo:** auths-cloud

### Problem

Several list endpoints return unbounded results:
- `GET /v1/orgs/{did}/members` — no pagination
- `GET /v1/namespaces/by-owner/{did}` — no pagination
- `GET /v1/identities/{did}/kel` — KEL can grow large

### Changes Required

For each endpoint, add keyset pagination following the existing pattern in `routes/activity.rs:108-235`:
- Accept `?limit=` (default 50, max 200) and `?after=` cursor
- Fetch `limit + 1` rows to detect `has_more`
- Return consistent envelope: `{ "data": [...], "next_cursor": "..." | null, "has_more": bool }`

**Note on envelope naming**: The existing activity feed uses `entries` and artifact query uses `artifacts` instead of `data`. Decide whether to standardize to `data` or keep domain-specific names. (See open question #6 in epic spec.)

### Endpoints to update:

1. **`/v1/orgs/{did}/members`** — Paginate by member join date or DID
2. **`/v1/namespaces/by-owner/{did}`** — Paginate by namespace name (alphabetical) or claim date
3. **`/v1/identities/{did}/kel`** — Paginate by sequence number (`?after_sn=&limit=`)

### Database Indexes
```sql
CREATE INDEX idx_org_members_active ON org_members (org_did) WHERE revoked_at IS NULL;
CREATE INDEX idx_ns_owner ON namespace_claims (owner_did);
```

### Notes
- Follow the `fetch_limit = limit + 1` pattern from `activity.rs`
- Use dynamic SQL bind indices like existing pagination code
- Add paths to `paths.rs` for any new query parameter variants
## Acceptance
- [ ] `GET /v1/orgs/{did}/members` supports `?limit=&after=` pagination
- [ ] `GET /v1/namespaces/by-owner/{did}` supports `?limit=&after=` pagination
- [ ] `GET /v1/identities/{did}/kel` supports `?after_sn=&limit=` pagination
- [ ] All return consistent envelope with `next_cursor` and `has_more`
- [ ] Default limit is 50, max is 200
- [ ] Database indexes added for pagination queries
- [ ] `cargo clippy --workspace` passes
- [ ] `cargo nextest run --workspace` passes
- [ ] Integration tests cover pagination with more items than limit
## Done summary
- Added limit/after pagination to org list_members
- Added limit/after pagination to namespaces/by-owner with SQL keyset
- Both return next_cursor and has_more fields
## Evidence
- Commits: b15dea707a882b504a197c2d6b76d9eb49d0645d
- Tests:
- PRs: