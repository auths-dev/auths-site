# fn-6.10 Add identity search endpoint (GET /v1/identities/search)

## Description
## Add identity search endpoint (GET /v1/identities/search)

**Repos:** auths-cloud

### Problem
Only exact DID lookup exists. No way to search by platform username, partial DID, or display name.

### Changes Required
1. **`paths.rs`** — Add `identities_search()` returning `/v1/identities/search`
2. **`routes/identity.rs`** — Add `search_identities()` handler accepting `?q=&platform=&has_artifacts=true&limit=&after=`
3. SQL query across `public_registrations` joined with `platform_claims`:
   - `q` matches `platform_namespace ILIKE $q%` or `did_prefix ILIKE $q%`
   - `platform` filters by exact platform
   - `has_artifacts` filters identities that have at least one attestation
4. Keyset pagination with `limit`/`after`
5. **`routes/mod.rs`** — Register with aide

### Notes
- For prefix search, standard B-tree LIKE with trailing wildcard is sufficient pre-launch
- Consider `pg_trgm` extension for fuzzy matching in the future
## Acceptance
- [ ] `GET /v1/identities/search?q=torv` returns matching identities
- [ ] Platform filter works
- [ ] Pagination with limit/after works
- [ ] Path added to `paths.rs`
- [ ] `cargo build -p auths-registry-server --all-features` passes
## Done summary
- Implemented backend endpoints for all Phase 2b and Phase 3 tasks
- Log proofs, revocation, search, stats, policy, badges, trust tier
- All backend routes registered with aide OpenAPI docs
## Evidence
- Commits: 58985b9c0afccd843480bf19648bf4ade702058b
- Tests:
- PRs: