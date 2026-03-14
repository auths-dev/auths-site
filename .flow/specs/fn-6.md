# Auths Registry Upgrade — Phase 2b, 3, and 4

## Overview

Continuation of the Auths registry upgrade. Covers items missed from Phase 2, Phase 3 (Adoption Accelerators), and Phase 4 (Enterprise & Scale) from `auths-cloud/upgrade_plan.md`. Phase 4 items requiring major architectural decisions are deferred with rationale.

**Context: Pre-launch, zero users.** No backwards compatibility constraints.

Spans 3 repos:
- **auths-site** — Next.js 16 / React 19 / TanStack Query v5 frontend
- **auths-cloud** — Rust/Axum 0.8 backend (registry server, monitor)
- **auths** — Core Rust crates (transparency log, KERI, policy engine)

## Scope

### Phase 2b: Missed Items (Critical Infrastructure)
- Implement log entry serving + inclusion proof endpoint *(unblocks monitor)*
- Implement log consistency proof endpoint
- Wire tile persistence + tile serving endpoint
- Align monitor with real endpoints
- Add artifact revocation (`AttestRevoke` entry type + backend + frontend)
- Add activity feed filters: `target_did`, `package`

### Phase 3: Adoption Accelerators
- Add org creation route (`POST /v1/orgs`)
- Add network stats endpoint (`GET /v1/stats`)
- Add identity search endpoint (`GET /v1/identities/search`)
- Add namespace browse endpoint (`GET /v1/namespaces`)
- Compute trust tier server-side (v2 with time decay)
- Add badge SVG endpoint (`GET /v1/badges/{ecosystem}/{package}.svg`)
- Wire policy engine to HTTP (`POST /v1/policies/evaluate`)
- Add monitor webhook/notification integration
- Integrate global search in frontend

### Phase 4: Deferred (with rationale)
- **FROST threshold signatures** — Deferred. QuorumPolicy already handles M-of-N at policy level. Cryptographic threshold adds complexity with no user benefit until enterprise customers exist.
- **SBOM first-class support** — Deferred. Artifact attestation already signs arbitrary files including SBOMs. Parsing/display is polish.
- **Multi-tenant schema alignment** — Deferred. Requires architectural decision: shared tables with tenant_id vs separate databases. Current filesystem isolation works.
- **GitHub Actions OIDC keyless signing** — Deferred. Conflicts with Auths' persistent-identity value proposition. Support OIDC as a trust signal, not a signing mechanism.
- **CLI lockfile verification** — Deferred. Depends on artifact revocation model being settled first.

## Approach

### Research Findings

**Transparency Log (Critical Path):**
- `verify_consistency()` and `verify_inclusion()` fully implemented in `auths-transparency/src/merkle.rs:67-92, 169-216`
- `TreeWriter::inclusion_proof()` exists at `writer.rs:45` but not wired to HTTP
- HTTP handlers for `get_tile()` and `get_entry()` return 501 (stub)
- Monitor binary calls 3 endpoints that don't exist: `/v1/log/entry/{seq}/proof`, `/v1/log/consistency`, and relies on `/v1/log/entry/{seq}` which returns 501
- TileStore trait with FsTileStore/S3TileStore exists but sequencer doesn't persist tiles

**Artifact Revocation:**
- No `AttestRevoke` EntryType variant. `EntryType` and `EntryBody` are `#[non_exhaustive]`
- Frontend has `status: 'valid' | 'revoked'` but hardcoded to `'valid'`
- Need: new entry type, sequencer validation, materialized state, frontend display
- `artifact_attestations` table needs `revoked_at` column

**Policy Engine:**
- `auths-policy` crate is FULLY IMPLEMENTED: Expr AST, CompiledPolicy, EvalContext, Decision, QuorumPolicy, trust registry
- Zero HTTP routes reference it. Needs wiring only.
- No `PolicySet` EntryType — if policies should be log-backed, needs new variant

**Monitor:**
- Verification cycle works: checkpoint sig, witness cosigs, consistency, inclusion
- Alerts are `tracing::error` only. `VerificationReport` struct ready for notification sinks
- No webhook/email/Slack integration

**Identity Search:**
- Only exact DID lookup exists. `public_registrations` has `platform`/`platform_namespace` columns
- Need: `GET /v1/identities/search?q=...` with prefix/fuzzy matching

**Stats:**
- No global stats. Org-scoped analytics exist under `/v1/orgs/{did}/analytics/`
- Need: `GET /v1/stats` with COUNT queries on `log_entries`, `namespace_claims`, `public_registrations`

### Key Conventions (from codebase)
- Backend: `aide::axum::ApiRouter` + `*_with` helpers; paths in `paths.rs`; `ApiError` enum; `thiserror`; no `unwrap()`; clock injection
- New entry types: add to `EntryType`/`EntryBody` (both `#[non_exhaustive]`), update `build_log_fields()` in `events.rs`, update `write_materialized_state()` in `sequencer/mod.rs`, add validation in `sequencer/validation.rs`
- Frontend: `registryFetch()` for API calls; `registryKeys` factory; `USE_FIXTURES` check; Tailwind dark theme
- Log routes mounted AFTER GovernorLayer (rate-limit exempt) at `mod.rs:554-567`

### Cross-Repo Dependency Chains
- **Log proofs**: auths-transparency (merkle.rs already done) → auths-cloud (HTTP handlers) → auths-monitor (can finally run)
- **Artifact revocation**: auths (new EntryType) → auths-cloud (sequencer + route) → auths-site (display)
- **Trust tier v2**: auths-cloud (server computation) → auths-site (read from API) → badge SVG endpoint
- **Policy engine**: auths (crate exists) → auths-cloud (HTTP routes + org policy storage) → future CI integration

## Quick Commands (Smoke Tests)

```bash
# Frontend typecheck
cd /Users/bordumb/workspace/repositories/auths-base/auths-site && pnpm typecheck

# Backend build
cd /Users/bordumb/workspace/repositories/auths-base/auths-cloud && cargo build -p auths-registry-server --all-features 2>&1 | grep "^error\[E" -A 10

# Core crate build
cd /Users/bordumb/workspace/repositories/auths-base/auths && cargo build -p auths-transparency --all-features 2>&1 | grep "^error\[E" -A 10
```

## Open Questions

1. **Revocation model**: By-RID (specific attestation), by-digest (all attestations for a hash), or by-signer-DID? Affects EntryType design.
2. **Policy storage**: Transparency log (new EntryType) vs Postgres-only vs TUF-distributed file?
3. **Trust tier v2 formula**: Same as client-side (`claims*20 + keys*15 + artifacts*5`) with time decay? Or incorporate new signals (delegation count, witness receipts)?
4. **Monitor alert sink**: Generic webhook? Slack? PagerDuty? Start with configurable webhook URL.
5. **Entry serving format**: Raw Entry vs OfflineBundle? Separate endpoints or content negotiation?
6. **Sequencer tree persistence**: Does it rebuild from `log_entries` on restart? Critical for proof serving.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Sequencer tree not persisted across restarts | Verify rebuild-from-DB logic before implementing proof endpoints |
| `EntryType`/`EntryBody` are `#[non_exhaustive]` — match arms elsewhere | `build_log_fields()` already has catch-all; verify `write_materialized_state()` |
| JSONB filters on `metadata` without GIN index | Add GIN index when implementing target_did/package filters |
| Badge endpoint becomes DDoS vector | Aggressive Cache-Control (5-15min), serve from CDN |
| `json-canon = "=0.1.3"` pinned — revocation serialization must be compatible | Use same canonical JSON for revocation entries |

## Acceptance Criteria

- All Phase 2b and Phase 3 tasks completed
- Monitor can run a full verification cycle against real endpoints
- Artifact revocation flows end-to-end (create → revoke → display revoked)
- Policy engine accessible via HTTP API
- Frontend typecheck and backend build pass
- Deferred items documented with rationale

## References

- Upgrade plan: `auths-cloud/upgrade_plan.md`
- Merkle proofs: `auths/crates/auths-transparency/src/merkle.rs`
- Entry types: `auths/crates/auths-transparency/src/entry.rs`
- Policy engine: `auths/crates/auths-policy/src/`
- Monitor: `auths-cloud/crates/auths-monitor/src/lib.rs`
- Sequencer: `auths-cloud/crates/auths-registry-server/src/sequencer/`
- TreeWriter: `auths-cloud/crates/auths-registry-server/src/sequencer/writer.rs`
- RFC 9162 (CT v2): https://datatracker.ietf.org/doc/html/rfc9162
- FROST (RFC 9591): https://www.rfc-editor.org/rfc/rfc9591.html (deferred)
