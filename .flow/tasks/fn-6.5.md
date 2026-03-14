# fn-6.5 Add artifact revocation (AttestRevoke entry type + backend)

## Description
## Add artifact revocation (AttestRevoke entry type + backend)

**Repos:** auths (transparency crate), auths-cloud

### Problem
No way to revoke an artifact attestation. `EntryType` has no `AttestRevoke` variant. `artifact_attestations` table has no `revoked_at` column. Critical for supply chain security (compromised signing key scenario).

### Changes Required

**Core (auths):**
1. **`entry.rs`** — Add `AttestRevoke` to `EntryType` enum and `AttestRevoke { attestation_rid: String, reason: String }` to `EntryBody`

**Backend (auths-cloud):**
2. **`sequencer/validation.rs`** — Add validation for `AttestRevoke`: verify actor is the original signer
3. **`sequencer/mod.rs` `write_materialized_state()`** — Add match arm: `UPDATE artifact_attestations SET revoked_at = NOW(), revoked_by = $actor WHERE rid = $attestation_rid`
4. **`events.rs` `build_log_fields()`** — Add match arm for `AttestRevoke` → summary + metadata
5. **Migration** — Add `revoked_at TIMESTAMPTZ` and `revoked_by TEXT` columns to `artifact_attestations`
6. **`paths.rs`** — Add `artifact_revoke(id_param)` returning `/v1/artifacts/{id}/revoke`
7. **`routes/artifacts.rs`** — Add `POST /v1/artifacts/{id}/revoke` handler that routes through sequencer
8. **`routes/mod.rs`** — Register route with aide

### Notes
- `EntryType` and `EntryBody` are `#[non_exhaustive]` — safe to add variants
- Must update `build_log_fields()` catch-all or add explicit arm
- `json-canon = "=0.1.3"` pinned — canonical JSON for revocation entries must be compatible
## Acceptance
- [ ] `AttestRevoke` variant added to `EntryType` and `EntryBody`
- [ ] Sequencer validates revocation (actor must be original signer)
- [ ] Materialized state updates `artifact_attestations.revoked_at`
- [ ] `events.rs` handles new entry type
- [ ] `POST /v1/artifacts/{id}/revoke` endpoint works
- [ ] Migration adds `revoked_at`/`revoked_by` columns
- [ ] `cargo build -p auths-transparency --all-features` passes
- [ ] `cargo build -p auths-registry-server --all-features` passes
## Done summary
- Implemented backend endpoints for all Phase 2b and Phase 3 tasks
- Log proofs, revocation, search, stats, policy, badges, trust tier
- All backend routes registered with aide OpenAPI docs
## Evidence
- Commits: 58985b9c0afccd843480bf19648bf4ade702058b
- Tests:
- PRs: