# fn-6.2 Implement log consistency proof endpoint

## Description
## Implement log consistency proof endpoint

**Repos:** auths-cloud
**Depends on:** fn-6.1

### Problem
No `GET /v1/log/consistency` endpoint. Monitor calls it at `lib.rs:284`. `verify_consistency()` at `merkle.rs:169-216` exists but has no HTTP wrapper.

### Changes Required
1. **`paths.rs`** — Add `log_consistency()` returning `/v1/log/consistency`
2. **`routes/log.rs`** — Add `get_consistency_proof()` handler accepting `?old_size=N&new_size=M` query params
3. Build consistency proof from tree state using the existing Merkle functions
4. **`routes/mod.rs`** — Register route (after GovernorLayer)

### API
- `GET /v1/log/consistency?old_size=N&new_size=M` → `{ proof: [hash1, hash2, ...] }`
## Acceptance
- [ ] `GET /v1/log/consistency?old_size=N&new_size=M` returns consistency proof
- [ ] Invalid params return 400
- [ ] Path added to `paths.rs`
- [ ] Route registered after GovernorLayer
- [ ] `cargo build -p auths-registry-server --all-features` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
