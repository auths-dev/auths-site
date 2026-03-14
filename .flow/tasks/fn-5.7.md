# fn-5.7 Add Cache-Control headers to backend responses

## Description
## Add Cache-Control headers to backend responses

**Repo:** auths-cloud

### Problem

Most endpoints lack `Cache-Control` headers. Log tiles and entries are immutable but not marked as such, missing CDN caching opportunities.

### Changes Required

Add Cache-Control headers based on data mutability:

| Endpoint | Header |
|----------|--------|
| `GET /v1/identities/{did}` | `public, max-age=60, stale-while-revalidate=300` |
| `GET /v1/log/checkpoint` | `public, max-age=30` |
| `GET /v1/log/tile/{level}/{index}` | `public, max-age=86400, immutable` |
| `GET /v1/log/entry/{index}` | `public, max-age=86400, immutable` |
| `GET /v1/activity/feed` | `public, max-age=5` |
| `GET /v1/namespaces/{eco}/{pkg}` | `public, max-age=300` |
| `GET /v1/trust-root` | `public, max-age=3600` |
| `GET /v1/artifacts` | `public, max-age=30` |

### Implementation Options
1. **Option A**: `axum::middleware::from_fn` — Create a middleware that matches on path prefix and sets headers. No new dependencies.
2. **Option B**: Add `set-header` feature to `tower-http` in Cargo.toml and use `SetResponseHeaderLayer`. Requires feature flag change.
3. **Option C**: Set headers directly in each handler function. Most explicit, no middleware complexity.

**Recommended**: Option C for handler-specific values (identity, checkpoint), Option A for immutable resources (tiles, entries) that share the same cache policy.

### Notes
- `identity.rs:389` already sets `Cache-Control: public, max-age=60, s-maxage=300` for active identities — keep or align with new values
- `tower-http` features currently: `["trace", "cors"]` — add `"set-header"` only if using Option B
## Acceptance
- [ ] Log tile and entry endpoints return `Cache-Control: public, max-age=86400, immutable`
- [ ] Activity feed returns short-lived cache headers
- [ ] Checkpoint, trust-root, namespace endpoints have appropriate max-age
- [ ] No caching applied to authenticated/mutating endpoints
- [ ] Existing identity cache header is consistent with the new policy
- [ ] `cargo clippy --workspace` passes
- [ ] `cargo nextest run --workspace` passes
## Done summary
- Created cache_control middleware with path-based cache policies
- Applied to router before TraceLayer
- Log tiles/entries immutable, checkpoint 30s, feed 5s
## Evidence
- Commits: 513c4dc440546f91a244475d1cd2e5194484ebe1
- Tests:
- PRs: