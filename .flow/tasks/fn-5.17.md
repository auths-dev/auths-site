# fn-5.17 Standardize error responses to RFC 9457

## Description
## Standardize error responses to RFC 9457

**Repo:** auths-cloud + auths-site
**Depends on:** fn-5.1 (frontend error parsing fix)

### Problem

Error responses are inconsistent across services:
- Registry server: `{ error: string, code: string, details: object }`
- Pairing daemon: bare HTTP status codes with no body
- MCP server: `{ error: string, code: string }`

RFC 9457 (Problem Details for HTTP APIs) provides a standard: `application/problem+json` with `type`, `title`, `status`, `detail`, `instance` fields.

### Changes Required

**Backend (auths-cloud):**
1. **`error.rs`** — Refactor `ErrorResponse` to RFC 9457 shape:
   ```json
   {
     "type": "urn:auths:error:namespace-already-claimed",
     "title": "Namespace Already Claimed",
     "status": 409,
     "detail": "The namespace npm:react is already claimed by did:keri:E8j...",
     "instance": "/v1/namespaces",
     "code": "NAMESPACE_ALREADY_CLAIMED",
     "trace_id": "req_abc123"
   }
   ```
2. **`error.rs`** — Set `Content-Type: application/problem+json` on error responses
3. **All route handlers** — No changes needed if `ApiError::IntoResponse` is updated correctly

**Frontend (auths-site):**
4. **`registry.ts:233-243`** — Update `registryFetch` to read RFC 9457 fields: `body.detail` for message, `body.code` for error code, `body.type` for error type URI

### Notes
- The `code` field is an extension to RFC 9457 (allowed by spec) — keep it for programmatic error handling
- `trace_id` requires generating a request ID in middleware (may already exist)
- Pairing daemon changes are out of scope for this task (separate repo concern)
- Keep backward compat in frontend: if `body.type` missing, fall back to current shape
## Acceptance
- [ ] Error responses use `Content-Type: application/problem+json`
- [ ] Response body includes RFC 9457 required fields: `type`, `title`, `status`, `detail`
- [ ] Response body includes extension fields: `code`, `trace_id`
- [ ] All existing `ApiError` variants produce valid RFC 9457 responses
- [ ] Frontend reads `body.detail` for error message, `body.code` for error code
- [ ] Frontend falls back gracefully if RFC 9457 fields are missing
- [ ] `cargo clippy --workspace` and `cargo nextest run --workspace` pass
- [ ] `pnpm typecheck` and `pnpm build` pass
## Done summary
Merged into another task. Pre-launch decision: no backwards compatibility needed.
## Evidence
- Commits:
- Tests:
- PRs: