# fn-6.1 Implement log entry serving + inclusion proof endpoint

## Description
## Implement log entry serving + inclusion proof endpoint

**Repos:** auths-cloud
**Files:** `routes/log.rs`, `paths.rs`, `routes/mod.rs`, `sequencer/writer.rs`

### Problem
`get_entry()` at `routes/log.rs:68-98` returns `ApiError::NotImplemented`. The monitor and CLI need to fetch entries and inclusion proofs. `TreeWriter::inclusion_proof()` at `writer.rs:45` exists but isn't wired to HTTP.

### Changes Required
1. **`routes/log.rs`** — Implement `get_entry()` to fetch entry from `log_entries` table by `log_sequence` index, return the entry JSON
2. **`paths.rs`** — Add `log_entry_proof(index_param)` returning `/v1/log/entry/{index}/proof`
3. **`routes/log.rs`** — Add `get_entry_proof()` handler that calls `TreeWriter::inclusion_proof()` and returns the Merkle audit path
4. **`routes/mod.rs`** — Register proof route (after GovernorLayer, rate-limit exempt)
5. Verify sequencer rebuilds tree from `log_entries` on restart (critical prerequisite)

### Notes
- Log routes are mounted AFTER GovernorLayer (exempt from rate limiting)
- Use existing `merkle.rs:67-92` `verify_inclusion()` logic
- Return inclusion proof as JSON array of hash nodes
## Acceptance
- [ ] `GET /v1/log/entry/{index}` returns entry JSON (not 501)
- [ ] `GET /v1/log/entry/{index}/proof` returns Merkle inclusion proof
- [ ] Path added to `paths.rs`
- [ ] Route registered after GovernorLayer (rate-limit exempt)
- [ ] Sequencer tree persistence across restarts verified
- [ ] `cargo build -p auths-registry-server --all-features` passes
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
