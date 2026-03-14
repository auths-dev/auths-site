# fn-6.11 Add namespace browse endpoint (GET /v1/namespaces)

## Description
## Add namespace browse endpoint (GET /v1/namespaces)

**Repos:** auths-cloud

### Problem
No way to browse all namespaces or list by ecosystem. Only per-ecosystem/package lookup and by-owner listing exist.

### Changes Required
1. **`paths.rs`** — Add `namespaces_list()` returning `/v1/namespaces`
2. **`routes/namespace.rs`** — Add `list_namespaces()` handler with:
   - `?ecosystem=npm` — filter by ecosystem
   - `?limit=50&after=<log_sequence>` — keyset pagination
   - `ORDER BY claimed_at DESC` for most-recent-first
3. SQL query on `namespace_claims` table
4. **`routes/mod.rs`** — Register with aide, tag "Public"
## Acceptance
- [ ] `GET /v1/namespaces` returns paginated namespace list
- [ ] `?ecosystem=npm` filter works
- [ ] Keyset pagination with limit/after
- [ ] `cargo build -p auths-registry-server --all-features` passes
## Done summary
- Implemented backend endpoints for all Phase 2b and Phase 3 tasks
- Log proofs, revocation, search, stats, policy, badges, trust tier
- All backend routes registered with aide OpenAPI docs
## Evidence
- Commits: 58985b9c0afccd843480bf19648bf4ade702058b
- Tests:
- PRs: