# fn-5.18 Improve aide OpenAPI coverage

## Description
## Improve aide OpenAPI coverage

**Repo:** auths-cloud

### Problem

The upgrade plan said "No OpenAPI spec endpoint" but this is incorrect — `aide 0.14` with Scalar UI is already integrated. However, OpenAPI coverage may be incomplete. Some routes may use plain `.route()` instead of `api_route()`, and some request/response types may lack `schemars` derives.

### Changes Required

1. **Audit `routes/mod.rs`** — Identify routes using `.route()` instead of `.api_route()` and convert where appropriate
2. **Audit response types** — Ensure all public response types derive `schemars::JsonSchema` and implement `aide::operation::OperationOutput`
3. **Audit request types** — Ensure all query parameter structs derive `schemars::JsonSchema` and implement `aide::operation::OperationInput`
4. **Add operation descriptions** — Use `|op| op.tag("...").summary("...").description("...")` on all `*_with` routes
5. **Verify Scalar UI** — Ensure `/docs` renders correctly with all documented endpoints
6. **Add tag organization** — Group endpoints by domain: "Identities", "Artifacts", "Namespaces", "Activity", "Organizations", "Transparency Log"

### Notes
- Use `aide::axum::ApiRouter` (already in use) — do NOT add utoipa
- Use `schemars` for JSON Schema derivation (already a dependency)
- Routes intentionally using plain `.route()` (WebSocket upgrade) should stay as-is
- Follow existing `OperationOutput` impl pattern from `error.rs:106-108`
## Acceptance
- [ ] All public REST endpoints registered via `api_route()` with aide documentation
- [ ] All response types derive `JsonSchema` and implement `OperationOutput`
- [ ] All query parameter types derive `JsonSchema` and implement `OperationInput`
- [ ] All routes have tag, summary, and description
- [ ] Endpoints organized by domain tags
- [ ] Scalar UI at `/docs` renders correctly with complete endpoint listing
- [ ] `cargo clippy --workspace` passes
- [ ] `cargo nextest run --workspace` passes
## Done summary
- Added descriptions to all OpenAPI tags
- Added Transparency Log tag
- Consistent descriptions for Scalar UI
## Evidence
- Commits: bd5e84bd9aec6c1f706f82b0660733c1295d42b6
- Tests:
- PRs: