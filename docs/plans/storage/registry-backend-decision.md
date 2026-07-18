# Decision plan — registry storage backend: git single-writer vs Postgres

**Status:** PROPOSED — needs a product/architecture decision · 2026-07-18
**Trigger:** max-throughput study finding #6 (see `tests/performance/FINDINGS.md`)
**Scope:** the `auths` registry storage backend (`crates/auths-storage`), **not** the
`auths-mcp-gateway` per-call path.

---

## Context

The throughput study found that provisioning agents **concurrently** under one shared root
serializes and times out (3 of 4 agents blocked past the 120 s init timeout; 256 agents only
provisioned by giving each its **own** registry). The mechanism is a *deliberate*
single-writer design in `auths-storage`'s `GitRegistryBackend`
(`crates/auths-storage/src/git/adapter.rs`):

- every write takes an **exclusive `registry.lock`** (`fs2::lock_exclusive`, blocking), held
  **across** the git2 commit + a CAS on a **single** ref `refs/auths/registry`;
- the backend doc states it outright: *"This backend assumes a single-writer model … if you
  need retry/rebase semantics, you're drifting into multi-writer complexity that requires a
  different design."*

This is fine for a steady fleet; it only bites when **many agents are provisioned at once**
(an HFT-style fleet, or a hosted multi-tenant onboarding service). The question this plan
decides: **do we adopt the `backend-postgres` registry backend for that case, and where?**

## Current state of the code (facts, not aspirations)

| Piece | State |
|---|---|
| `RegistryBackend` **port** (`crates/auths-id/src/storage/registry/backend.rs:512`) | Exists — ~17 methods (`append_signed_event`, `get_key_state`, `store_attestation`, `visit_*`, `init_if_needed`, …). The pluggable seam is real. |
| `GitRegistryBackend` (`auths-storage/src/git/adapter.rs`) | **Complete**, single-writer (`registry.lock` + single-ref CAS + SQLite read index). |
| `PostgresAdapter` (`auths-storage/src/postgres/adapter.rs`) | **Stub** — `new(_pool: ())`, all ~17 methods unimplemented (170 lines). `backend-postgres` feature wires `sqlx` but nothing works yet. |
| Consumers of the port | `auths-cli` (init/auth/kel/org/register/migrate) and **`auths-api`** (hosted). **The gateway is not a consumer.** |

**Adopting postgres is real implementation work** (stub → full impl), not a config flip.

## Does this pipe into `auths-mcp-gateway`? — No.

Short answer: **the gateway is not where a postgres backend plugs in**, and it should not be.

- The gateway **never constructs a `RegistryBackend`.** For writes/signing it shells out to
  the `auths` CLI (`Command::new(auths_bin) --repo <path> …`), and its per-call gate
  **reads the agent + delegator KELs directly from a local registry path**
  (`AUTHS_MCP_LIVE_DIR` / `--registry`), resolved **once per session** into in-memory
  `Vec<Event>`.
- Those per-call reads are **local and offline by design** — that is a feature (no network
  on the metered hot path). Pointing the gateway at a network Postgres for per-call KEL
  resolution would add a round-trip to the exact path we are trying to make faster. **Don't.**
- Where the gateway *does* touch the registry is **onboarding** (the `wrap` init delegation,
  via the CLI). That write goes through whatever backend the CLI/registry service uses. So
  the gateway benefits from a concurrent backend **only indirectly** — concurrent onboarding
  stops serializing on the git lock — without the gateway itself gaining a postgres
  dependency.

**Rule of thumb:** Postgres belongs at the **registry-write / registry-service** layer
(`auths-cli`, `auths-api`), behind the `RegistryBackend` port. The gateway keeps reading a
**local materialized KEL view** on the hot path. If the source of truth becomes Postgres, we
need a defined "materialize to a local KEL view" step for edge/gateway (see open questions),
not a gateway→Postgres coupling.

## Options

| Option | What | Pros | Cons |
|---|---|---|---|
| **A. Status quo (git single-writer everywhere)** | Keep `GitRegistryBackend` only | Sovereign, offline-first, content-addressed, tamper-evident history, radicle-syncable, CAS safety, zero new infra | Serial onboarding; cannot provision a large fleet concurrently |
| **B. Postgres for hosted registry services, git as default (recommended)** | Implement `PostgresAdapter`; select backend **per deployment** behind the port. Git stays default for CLI/edge/sovereign; Postgres for the hosted multi-tenant onboarding service (`auths-api`) | Concurrent, transactional multi-writer onboarding where it's actually needed; keeps git's sovereignty guarantees as the default | Real impl work (stub → complete); operate a DB; must define the edge/gateway KEL read-view; must preserve append-only + signed + monotonic invariants |
| **C. Replace git with Postgres globally** | Postgres everywhere | One concurrent backend | **Rejected** — loses offline/sovereign/radicle/tamper-evident history; over-centralizes; contradicts the Auths thesis (the verifiable log *is* the product) |

## Recommendation

**Option B**, gated on three checks before committing engineering:

1. **Confirm the requirement.** Is concurrent high-fanout onboarding an actual goal (hosted
   multi-tenant, HFT fleets), or is steady/serial provisioning acceptable? If the latter,
   choose **A** and stop.
2. **Measure it.** Add the `storage-bench` scenario (see `FINDINGS.md` TODO) to quantify git
   single-writer onboarding throughput vs a real Postgres impl — decide on numbers, not
   intuition.
3. **Define the edge read-view.** Specify how a Postgres-backed registry materializes a
   **local KEL view** so the gateway's per-call reads stay offline. Without this, "B" leaks
   Postgres into the hot path.

## Security / verifiability guardrails (non-negotiable if we do B)

- **KERI events are self-verifying regardless of backend** — the security is in the *signed,
  hash-chained events*, not the storage engine. Postgres storing the same signed events is
  still verifiable by re-derivation. So this is **not** a security regression *if* the
  invariants below hold.
- **Preserve:** append-only writes, per-identity **monotonic key-state**, CAS-equivalent
  ordering (no lost-update), and an **export path** that reproduces the signed events for
  offline `verify` / `verify-spend`. Postgres must never become a *mutable* source of truth
  that can silently rewrite KEL history — writes stay append-only + signed.
- **What we knowingly give up at the storage layer:** git's content-addressing +
  tamper-evident history + radicle sync as *defense-in-depth*. Acceptable for a hosted
  service; **keep git as the sovereign/offline default.**

## Open questions

- Deployment topology: which surfaces need concurrent onboarding (`auths-api`? a future
  onboarding service?) vs stay git (CLI, edge, self-hosted)?
- Who operates the DB, and what's the multi-tenant isolation model? (`ValidatedTenantId`
  already exists in `auths-storage`.)
- Migration path for existing git registries → Postgres (and back out).
- Radicle / offline requirements for any hosted deployment.

## Next steps

- [ ] **Decide the requirement** (product): is concurrent high-fanout onboarding a goal?
- [ ] **Build `storage-bench`** (`tests/performance`): git single-writer onboarding
      throughput, single vs concurrent; SQLite index single-writer serialization; and Postgres
      once implemented.
- [ ] If B: **implement `PostgresAdapter`** — all ~17 `RegistryBackend` methods, append-only +
      signed + monotonic; not the current stub.
- [ ] If B: **define + implement the edge/gateway KEL read-view** (Postgres → local
      materialized KELs) so the per-call hot path stays offline.
- [ ] Keep `GitRegistryBackend` the **default**; Postgres opt-in per deployment behind the
      `RegistryBackend` port.

---

_This plan is downstream of `tests/performance/FINDINGS.md` §6. The gateway per-call walls
(#1 stdio transport, #2 durable spend-log/counter) are unaffected by this decision — they
live in `auths-mcp-core` + transport, not the identity registry._
