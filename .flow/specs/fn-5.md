# Auths Registry Upgrade — Phase 1 & 2

## Overview

Comprehensive upgrade of the Auths decentralized identity registry across API design, frontend UX, data model, security, and performance. Covers Phase 1 (Foundation Fixes) and Phase 2 (API Maturity) from the upgrade plan at `auths-cloud/upgrade_plan.md`.

**Context: Pre-launch with zero users.** No backwards compatibility constraints. Legacy endpoints and paths can be removed outright. Error format can change in one shot.

Spans 3 repos:
- **auths-site** — Next.js 16 / React 19 / TanStack Query v5 frontend
- **auths-cloud** — Rust/Axum 0.8 backend (registry server)
- **auths** — Core Rust crates (transparency log, KERI, MCP server)

## Scope

### Phase 1: Foundation Fixes
- Implement RFC 9457 error responses in one shot (backend + frontend) *(fn-5.1)*
- Surface `is_abandoned` flag in identity UI *(fn-5.2)*
- Extract duplicated shared UI code (TIER_STYLES, entryDetail) *(fn-5.3)*
- Add trust tier breakdown tooltip *(fn-5.4)*
- Improve empty states and error UX *(fn-5.5)*
- Add WebSocket server-initiated ping keepalives (backend) *(fn-5.6)*
- Add Cache-Control headers (backend) *(fn-5.7)*
- Add batch identity endpoint (backend) *(fn-5.8)*
- Update frontend to use batch identity endpoint *(fn-5.9)*
- Replace `/v1/activity/recent` with `/v1/activity/feed` and remove legacy endpoint *(fn-5.10)*

### Phase 2: API Maturity
- Add SSE activity stream endpoint (backend) *(fn-5.12)*
- Add keyset pagination to unpaginated list endpoints *(fn-5.13)*
- Add WebSocket subscription filters *(fn-5.14)*
- Add namespace delegation display (frontend) *(fn-5.15)*
- Rename verb-in-URL endpoints — remove old paths entirely *(fn-5.16)*
- Improve aide OpenAPI coverage *(fn-5.18)*

### Merged/Resolved
- ~~fn-5.11 (Remove /v1/activity/recent)~~ → merged into fn-5.10
- ~~fn-5.17 (Standardize error responses to RFC 9457)~~ → merged into fn-5.1

## Decisions Made

1. **Error format**: Jump straight to RFC 9457 `application/problem+json`. No incremental fix.
2. **URL renames**: Remove old verb-in-URL paths entirely. No 301 redirects. Zero users.
3. **Legacy endpoint removal**: Delete `/v1/activity/recent` in the same task as dashboard migration. No transition period.

## Approach

### Research Corrections (Plan vs Reality)
1. **OpenAPI already exists**: Backend uses `aide 0.14` (NOT utoipa) with `ApiRouter`, `schemars`, Scalar UI at `/docs`. Phase 2 item becomes "improve coverage" not "add from scratch".
2. **Rate limiting exists**: `GovernorLayer` with `TenantOrIpKey` already wraps all documented routes. Genuine gaps: WS connection limits, namespace claim cooldown.
3. **Error shape mismatch**: Frontend reads `body.message` but backend sends `body.error`. Fixed as part of RFC 9457 migration (fn-5.1).
4. **Identity 200-with-status is settled**: The `unclaimed` status pattern with 200 is the convention. Frontend relies on it. Do not change to 404.
5. **Axum auto-pong**: Axum 0.8 automatically responds to Ping with Pong. Missing piece is server-initiated ping for stale connection detection.

### Cross-Repo Dependency Chains
- **RFC 9457 errors**: auths-cloud `error.rs` + auths-site parser in one task (fn-5.1)
- **Batch identity**: auths-cloud endpoint (fn-5.8) → auths-site consumer (fn-5.9)
- **SSE**: auths-cloud endpoint (fn-5.12) → auths-site client component consumer (future task)
- **Cache-Control**: auths-cloud only (fn-5.7)
- **URL renames**: auths-cloud `paths.rs` + routes only (fn-5.16) — no redirects needed

### Key Conventions (from CLAUDE.md & codebase)
- Backend: `aide::axum::ApiRouter` with `*_with` helpers; new paths in `paths.rs`; `ApiError` enum in `error.rs`; `thiserror` for error types; no `unwrap()`; clock injection
- Frontend: `registryFetch()` for all API calls; `registryKeys` factory for all query keys; `USE_FIXTURES` check for new features; Tailwind dark theme (zinc-950 bg, emerald accents)
- Tests: Backend `cargo nextest run`; frontend has zero tests (fixture-based only)

### Reuse Points
- `registryFetch<T>()` at `registry.ts:208-246` — all new fetch functions
- `registryKeys` at `queries/registry.ts:33-52` — all new query keys
- `ApiError` enum at `error.rs:1-148` — all new backend error variants
- `paths.rs` centralized path definitions — all new routes
- `ACTIVITY_EVENT_CONFIG` at `activity-events.ts` — new event types
- `feed_entry_from_sequence_result()` at `events.rs:102-114` — new event builders
- `CopyButton` component — reuse for DID display

## Quick Commands (Smoke Tests)

```bash
# Frontend typecheck
cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm typecheck

# Frontend build
cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm build

# Backend tests
cd /Users/bordumb/workspace/repositories/auths-base/auths-cloud && cargo nextest run --workspace

# Backend clippy
cd /Users/bordumb/workspace/repositories/auths-base/auths-cloud && cargo clippy --workspace
```

## Open Questions (Remaining)

1. **`is_abandoned` + trust tier**: Abandoned identity scores 0? Or keeps historical score with visual indicator?
2. **Batch identity HTTP method**: `GET` with query params (URL length limit ~35 DIDs) or `POST` (non-idempotent semantics for a read)?
3. **Pagination envelope naming**: Standardize to `"data"` or keep domain-specific field names (`entries`, `artifacts`) with consistent cursor/has_more?
4. **Org vs Individual DID discrimination**: Add a `type: "individual" | "org"` field to `IdentityResponse`?
5. **`/v1/activity/recent` replacement**: Dashboard uses `RecentActivity` (separate `recent_artifacts`/`recent_identities`). How to derive this from `/v1/activity/feed` which returns flat `FeedEntry[]`?

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| `json-canon = "=0.1.3"` pinned in core — can't change attestation format | Avoid touching canonical JSON serialization in any task |
| No frontend tests → regressions undetectable | Add `parseSearchQuery` and `computeTrustTier` unit tests as part of first frontend tasks |
| Multi-tenant WS isolation missing | Flag as known gap; address in Phase 3+ |

## Acceptance Criteria

- All 16 active tasks completed and merged
- `pnpm typecheck` and `pnpm build` pass on auths-site
- `cargo nextest run --workspace` and `cargo clippy --workspace` pass on auths-cloud
- No regression in existing functionality
- Open questions resolved and decisions documented

## References

- Upgrade plan: `auths-cloud/upgrade_plan.md`
- Backend routes: `auths-cloud/crates/auths-registry-server/src/routes/mod.rs`
- Backend error types: `auths-cloud/crates/auths-registry-server/src/error.rs`
- Backend paths: `auths-cloud/crates/auths-registry-server/src/paths.rs`
- Frontend API client: `auths-site/apps/web/src/lib/api/registry.ts`
- Frontend query hooks: `auths-site/apps/web/src/lib/queries/registry.ts`
- Frontend WS hook: `auths-site/apps/web/src/hooks/use-activity-websocket.ts`
- CLAUDE.md conventions: `auths/CLAUDE.md`
- aide 0.14 docs: https://docs.rs/aide/0.14.1/aide/
- Axum 0.8 SSE: https://docs.rs/axum/0.8.1/axum/response/sse/index.html
- RFC 9457 Problem Details: https://www.rfc-editor.org/rfc/rfc9457.html
