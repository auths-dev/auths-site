# fn-5.1 Fix frontend error response parsing bug

## Description
## Implement RFC 9457 error responses (backend + frontend)

**Repo:** auths-cloud + auths-site
**Priority:** P0 (prerequisite for all other error-related work)

### Problem

Two issues in one:
1. Frontend `registryFetch()` at `registry.ts:237` reads `body.message` but backend `ErrorResponse` sends `{ error, code, details }` — error messages never display correctly
2. Error format is ad-hoc. Jump straight to RFC 9457 (Problem Details for HTTP APIs) now since we're pre-launch with zero users.

### Changes Required

**Backend (auths-cloud):**
1. **`error.rs`** — Refactor `ErrorResponse` struct to RFC 9457 shape. Set `Content-Type: application/problem+json` on all error responses:
   ```json
   {
     "type": "urn:auths:error:namespace-already-claimed",
     "title": "Namespace Already Claimed",
     "status": 409,
     "detail": "The namespace npm:react is already claimed by did:keri:E8j...",
     "code": "NAMESPACE_ALREADY_CLAIMED",
     "trace_id": "req_abc123"
   }
   ```
2. **`error.rs` `IntoResponse` impl** — Map each `ApiError` variant to RFC 9457 fields. `code` is an extension field (allowed by spec) for programmatic handling.
3. **No handler changes needed** if `ApiError::IntoResponse` is updated correctly — all routes already return `ApiResult<T>`.

**Frontend (auths-site):**
4. **`registry.ts:178-188`** — Update `RegistryApiError` class: add `code?: string`, `errorType?: string` (the RFC 9457 `type` URI)
5. **`registry.ts:233-243`** — Update `registryFetch` error parsing to read `body.detail` for message, `body.code` for error code, `body.type` for error type URI

### Conventions
- Backend: `thiserror` for error enum, `IntoResponse` for HTTP mapping, `OperationOutput` for aide
- Frontend: use `registryFetch` — do not create alternative wrappers
- No backwards compat needed — zero users, pre-launch
## Fix frontend error response parsing bug

**Repo:** auths-site
**Priority:** P0 (prerequisite for all other frontend error work)

### Problem

`registryFetch()` at `apps/web/src/lib/api/registry.ts:237` reads `body.message` for error details, but the backend `ErrorResponse` (at `auths-cloud/.../error.rs`) sends `{ error: string, code: string, details: object }`. The frontend never reads the `code` field either. This means all API errors show generic `res.statusText` instead of the backend's descriptive error string.

### Changes Required

1. **`apps/web/src/lib/api/registry.ts:233-243`** — Update the error parsing in `registryFetch` to read `body.error` instead of `body.message`, and pass `body.code` to `RegistryApiError`
2. **`apps/web/src/lib/api/registry.ts:178-188`** — Add optional `code` field to `RegistryApiError` class for programmatic error handling
3. **`apps/web/src/lib/api/registry.ts:190-206`** — Update `RegistryApiError` type definition if needed

### Conventions
- Use `registryFetch` — do not create alternative fetch wrappers
- Maintain backward compat: if `body.error` is missing, fall back to `body.message` then `res.statusText`
## Acceptance
- [ ] Backend error responses use `Content-Type: application/problem+json`
- [ ] Response body includes RFC 9457 fields: `type`, `title`, `status`, `detail`
- [ ] Response body includes extension fields: `code`, `trace_id`
- [ ] All `ApiError` variants produce valid RFC 9457 responses
- [ ] Frontend `RegistryApiError` has `code` and `errorType` fields
- [ ] Frontend `registryFetch` reads `body.detail` for message, `body.code` for code
- [ ] Error messages from backend display correctly in UI error states
- [ ] `cargo clippy --workspace` and `cargo nextest run --workspace` pass
- [ ] `pnpm typecheck` and `pnpm build` pass
- [ ] Fixture mode (`USE_FIXTURES=true`) still works correctly
## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
