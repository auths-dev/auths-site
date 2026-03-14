# fn-5.16 Rename verb-in-URL endpoints with 301 redirects

## Description
## Rename verb-in-URL endpoints

**Repo:** auths-cloud

### Problem

Several endpoints use verbs in URLs, violating REST conventions:
- `POST /v1/artifacts/publish` → `POST /v1/artifacts`
- `POST /v1/namespaces/claim` → `POST /v1/namespaces`
- `POST /v1/namespaces/delegate` → `POST /v1/namespaces/{eco}/{pkg}/delegations`
- `POST /v1/namespaces/transfer` → `PUT /v1/namespaces/{eco}/{pkg}/owner`
- `POST /v1/verify` → `POST /v1/attestations/verify`
- `POST /v1/verify/commit` → `POST /v1/commits/verify`

### Changes Required

1. **`paths.rs`** — Rename path functions to new canonical URLs. Delete old path functions entirely.
2. **`routes/mod.rs`** — Update route registrations to use new paths. No redirects — just rename.
3. **Handler functions** — Update any internal references or OpenAPI tags/summaries.
4. **Verify** `POST /v1/artifacts` doesn't conflict with `GET /v1/artifacts` — aide routes by method, so this should be fine. Confirm in `routes/mod.rs`.

### Notes
- Zero users, pre-launch — no backwards compat needed, no 301 redirects, no deprecation headers
- Just rename and delete the old paths
- Update aide OpenAPI docs with new paths (use `*_with` helpers)
- CLI (`auths-cli`) is internal only — update references there in a follow-up if needed
## Rename verb-in-URL endpoints with 301 redirects

**Repo:** auths-cloud

### Problem

Several endpoints use verbs in URLs, violating REST conventions:
- `POST /v1/artifacts/publish` → `POST /v1/artifacts`
- `POST /v1/namespaces/claim` → `POST /v1/namespaces`
- `POST /v1/namespaces/delegate` → `POST /v1/namespaces/{eco}/{pkg}/delegations`
- `POST /v1/namespaces/transfer` → `PUT /v1/namespaces/{eco}/{pkg}/owner`
- `POST /v1/verify` → `POST /v1/attestations/verify`
- `POST /v1/verify/commit` → `POST /v1/commits/verify`

### Changes Required

1. **`paths.rs`** — Add new path functions for the renamed endpoints. Keep old path functions (renamed with `_legacy` suffix) for redirect routes.
2. **`routes/mod.rs`** — Register new canonical routes with handlers. Add 301 Redirect routes for old paths pointing to new ones.
3. **Handler functions** — Move handler registrations to new paths; old paths return `301 Moved Permanently` with `Location` header pointing to the new canonical URL.

### Migration Strategy
- Add new paths first (additive change)
- Old paths return 301 redirect (not 302 — this is permanent)
- Add `Deprecation: true` and `Sunset: {date}` headers on old paths
- Keep old paths for at least one CLI release cycle
- CLI callers (`auths-cli`) will need updating in a separate PR

### Notes
- `POST /v1/artifacts` already exists as a query/search endpoint? Verify. If so, the publish endpoint may need `POST /v1/artifacts` with a different content type or a `?action=publish` discriminator. **Check `paths.rs:69-72` and `routes/mod.rs` first.**
- For aide documentation, old routes don't need OpenAPI docs (they're deprecated redirects)
## Acceptance
- [ ] All verb-in-URL endpoints renamed to resource-based URLs
- [ ] Old path functions removed from `paths.rs` entirely
- [ ] No 301 redirects or legacy routes remain
- [ ] New paths documented in aide OpenAPI spec
- [ ] `POST /v1/artifacts` doesn't conflict with `GET /v1/artifacts`
- [ ] No `unwrap()` in new code
- [ ] `cargo clippy --workspace` passes
- [ ] `cargo nextest run --workspace` passes
## Done summary
- Renamed 6 verb-in-URL endpoints to resource-based URLs
- Old paths removed entirely (pre-launch)
- Updated both routes and test_paths modules
## Evidence
- Commits: 7821bf0039a8e9734f5c9158fd2143b1fc602f1b
- Tests:
- PRs: