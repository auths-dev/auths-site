# fn-6.9 Add network stats endpoint (GET /v1/stats)

## Description
## Add network stats endpoint (GET /v1/stats)

**Repos:** auths-cloud

### Problem
No public network-wide stats. Org analytics exist but are scoped. The registry homepage needs "proof of life" numbers.

### Changes Required
1. **`paths.rs`** — Add `stats()` returning `/v1/stats`
2. **`routes/`** — Create `stats.rs` handler querying:
   - `SELECT COUNT(*) FROM public_registrations` → total identities
   - `SELECT COUNT(*) FROM artifact_attestations` → total attestations
   - `SELECT COUNT(*) FROM namespace_claims` → total namespaces
   - `SELECT COUNT(*) FROM log_entries` → total log entries
3. **`routes/mod.rs`** — Register with `get_with`, tag "Public"
4. Cache aggressively: `Cache-Control: public, max-age=60`
## Acceptance
- [ ] `GET /v1/stats` returns total identities, attestations, namespaces, log entries
- [ ] Response cached with 60s max-age
- [ ] Route documented in aide
- [ ] `cargo build -p auths-registry-server --all-features` passes
## Done summary
- Implemented backend endpoints for all Phase 2b and Phase 3 tasks
- Log proofs, revocation, search, stats, policy, badges, trust tier
- All backend routes registered with aide OpenAPI docs
## Evidence
- Commits: 58985b9c0afccd843480bf19648bf4ade702058b
- Tests:
- PRs: