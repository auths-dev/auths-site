# fn-5.8 Add batch identity endpoint (backend)

## Description
## Add batch identity endpoint (backend)

**Repo:** auths-cloud

### Problem

Frontend `fetchPackageDetail()` does N+1 identity lookups — fetches all artifacts, extracts unique signer DIDs, then makes individual `fetchIdentity()` calls per signer (batched client-side in groups of 5). A server-side batch endpoint eliminates this overhead.

### Changes Required

1. **`paths.rs`** — Add `identities_batch()` returning `/v1/identities/batch` in both `routes` and `test_paths` modules
2. **`routes/identity.rs`** — Add `POST /v1/identities/batch` handler accepting `{ "dids": ["did:keri:...", ...] }` body
3. **`routes/mod.rs`** — Register new route with `aide::axum::ApiRouter` using `post_with` for OpenAPI documentation
4. **`error.rs`** — Add `BatchLimitExceeded` variant if needed

### API Design
- **Method**: `POST` (URL length limits make GET impractical for 50+ DIDs)
- **Request**: `{ "dids": ["did:keri:...", ...] }` — max 100 DIDs per request
- **Response**: `{ "identities": { "did:keri:...": { status: "active", ... } | { status: "unclaimed" } } }` — keyed by DID for easy lookup, preserving the existing `IdentityResponse` discriminated union shape
- **Error**: 400 if > 100 DIDs, 400 if any DID has invalid format
- **SQL**: `SELECT ... WHERE did = ANY($1)` — single query, not N queries

### Notes
- Use existing `IdentityResponse` types (Active/Unclaimed) for each DID in the response
- Follow aide `post_with` pattern for OpenAPI docs
- Add path to `paths.rs` per project convention
- No `unwrap()` per CLAUDE.md
## Acceptance
- [ ] `POST /v1/identities/batch` endpoint exists and accepts `{ "dids": [...] }`
- [ ] Returns map of DID -> IdentityResponse (active or unclaimed)
- [ ] Rejects requests with > 100 DIDs (400 error)
- [ ] Rejects invalid DID formats (400 error)
- [ ] Uses single SQL query (not N individual queries)
- [ ] Path defined in `paths.rs` (both `routes` and `test_paths`)
- [ ] Route registered with `post_with` for aide OpenAPI docs
- [ ] `cargo clippy --workspace` passes
- [ ] `cargo nextest run --workspace` passes
- [ ] Integration test covers batch lookup with mix of active and unclaimed DIDs
## Done summary
- Added POST /v1/identities/batch endpoint
- Max 100 DIDs per request, returns HashMap<DID, IdentityResponse>
- Paths added to routes and test_paths
- Route registered with aide OpenAPI docs
## Evidence
- Commits: a6e8c21237a42c1dc408791ec8a387d102d24bc0
- Tests:
- PRs: