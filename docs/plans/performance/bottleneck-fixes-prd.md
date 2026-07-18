# PRD — Payment-path performance fixes (7 bottlenecks)

**Source:** `tests/performance/FINDINGS.md` (measured on `auths@7c08f225`, 10-core/64 GB).
**Target repos:** `auths` (branch `performance`), and any sibling touched (same branch name).
**Conventions:** all Rust adheres to `auths/CLAUDE.md` — strict layering (core/id implement,
sdk orchestrates, cli/api are thin), clock injection (`now: DateTime<Utc>` params; no
`Utc::now()` in core/id), `thiserror` in core/sdk (no `anyhow`), no `unwrap`/`expect` in
non-test code (annotate provably-safe with `INVARIANT:`), rustdoc (Description/Args/Usage) on
public items, small composable functions, collapsible `if` with `&&`. Pre-launch: no
backwards-compat constraints — refactor freely.

Each item: **measured problem → current mechanism → design → invariants → tests → acceptance.**

---

## #5 — Cold-start signing: build the commit template in-process

- **Measured:** first call per agent ≈ **6.0 s** vs ~1 ms warm (3,000×), paid once per agent;
  256-agent provisioning spent ~130 s dominated by this.
- **Mechanism:** `chain.rs::sign_call`/`sign_settlement` run a git subprocess ceremony
  (`git init`+`config`+`add`+`commit`+`auths sign HEAD`+`cat-file`) on the **first** call of
  each capability to produce a raw commit, which `inproc_sign.rs::learn_call/learn_settlement`
  harvests into a `CommitTemplate`. Subsequent calls are pure-Rust (`sign_commit_object`). The
  6 s is that one-time subprocess + an Argon2id keychain unlock inside `auths sign`.
- **Design:** construct the `CommitTemplate` **in-process** from data already known at session
  setup — the delegation's static trailers (`Auths-Id`, `Auths-Device`, `Auths-Anchor-Seq`,
  `Auths-Scope`) and the git identity line (`<alias> <alias@auths.local>`) — so the FIRST call
  signs via `sign_commit_object` too, with **no** subprocess. Add a
  `CommitTemplate::build(identity_line, static_trailers, slots)` constructor beside `harvest`.
  `Chain` already holds the agent alias, scope, and anchor context needed. Keep `harvest` as a
  fallback only if the delegation metadata is unavailable. The Argon2id unlock stays (one
  decrypt per session via `SessionKey`/`OnceLock`) — that is unavoidable and already one-time.
- **Invariants:** the in-process-built template must be **byte-identical** to the harvested one
  (same trailer order, same identity line, same slot prefixes) — verified by
  `verify-spend`/`verify_commit_against_kel_scoped` re-deriving every record; any divergence
  fails closed as `tampered-proof`. No key material moves; signing stays SSHSIG over the same
  payload.
- **Tests:** unit test asserting `build(...)` produces a template whose rendered first commit
  round-trips through the native verifier identically to the harvested path; a gateway test
  that the first `paid_call` no longer spawns `git` (e.g. no work-repo created) yet verifies
  `consistent`.
- **Acceptance:** cold first-call p50 drops from seconds to low-ms; `verify-spend` stays
  `consistent`; no `git` subprocess on the signing hot path.

## #2 — Durable spend counter/log: group-commit off the hot path

- **Measured:** a single durable counter caps at ~6,038 `rename`/s; per-call `fs::read` +
  temp-write+`rename` + spend-log append sit under the budget mutex.
- **Mechanism:** `auths-mcp-core/budget.rs` `SettledCounter::read_high_water` (`fs::read` on
  every reserve) and `settle` (read + temp-write + `rename` on every settle);
  `spend_log.rs::append` (open+write per call).
- **Design:** make the in-memory counter authoritative and monotonic; flush durably on a
  **group-commit** cadence (every N settles or every T ms, whichever first) and always on clean
  shutdown. Batch spend-log appends behind a buffered writer flushed on the same cadence.
  Introduce a `DurableCheckpoint` policy type (injected cadence + injected `now`) so it is unit
  testable without wall-clock. Keep the existing on-disk format so `verify-spend` is unchanged.
- **Invariants (money-critical):** **crash-safety must not permit overspend.** On restart the
  recovered high-water must be `>=` the last durably-flushed value, and any in-flight reserve
  that was granted-but-not-flushed must be treated **as spent** (conservative) — never
  re-granted. Reserve decisions still read the authoritative in-memory value (durability lags,
  authority does not). The counter is still strictly monotonic; a rollback is refused exactly
  as today.
- **Tests:** concurrent reserve/settle never exceeds cap (fork the existing
  `budget.rs` 50-thread stress test); a simulated crash (drop before flush) recovers to a
  high-water that never under-counts settled spend (no double-grant); group-commit flushes on
  cadence and on shutdown.
- **Acceptance:** warm per-call latency and aggregate throughput improve; the cross-rail cap is
  never exceeded under concurrency or simulated crash.

## #3 — KEL-replay memoization (safe form only)

- **Measured:** not yet binding (crypto has headroom) but O(KEL length) CPU per call.
- **Mechanism:** `auths-verifier` `verify_commit_against_kel_scoped` replays root+device KELs
  from genesis every call, then one SSHSIG verify.
- **Design:** memoize the **pure derivation** (current authoritative key-state + delegation
  validity) keyed on `(root_kel_tip, device_kel_tip)`. When both tips are unchanged, reuse the
  derived state; any appended event (rotation, revocation-in-KEL) moves a tip and busts the
  entry. Cache lives at the session resolve boundary (per wrapped agent), not global.
- **Invariants (security-critical):** **never cache the verdict on a TTL.** Every call still
  runs: the SSHSIG verify over *this* call's bytes, the expiry check against injected `now`,
  this call's `scope ⊆ grant`, and a **fresh revocation check** (revocation may live outside the
  KEL — TEL/attestation `revoked_at` — so a KEL-tip key alone is insufficient; revocation +
  expiry are re-checked regardless of cache hit). Fail-closed on any miss/uncertainty.
- **Tests:** a rotation moves the device tip and forces re-derivation (old key rejected after
  rotation); an out-of-KEL revocation is honored on the very next call despite a warm cache;
  identical repeated calls hit the cache and produce identical verdicts.
- **Acceptance:** per-call verify CPU drops for the steady case; revocation/rotation still take
  effect on the next call; no behavioral change to any verdict.

## #4 — Treasury coordinator: pooling + async persistence

- **Measured:** fleet mode ~28% slower than solo at every concurrency; both collapse at 256.
- **Mechanism:** `treasury.rs` one `Arc<Mutex<ServeState>>` serializes all reserves; the whole
  ledger is persisted to disk on **every** reserve; the client opens a **new** `TcpStream`
  per reserve (no pooling; 400 ms timeout).
- **Design:** (a) client-side **connection reuse** — a pooled/keepalive connection per agent
  instead of connect-per-reserve; (b) move ledger persistence **off** the reserve critical
  section — persist on a group-commit cadence + on checkpoint + on shutdown (same policy type
  as #2), so the lock is held only for the in-memory counter update; (c) keep the signed
  checkpoint trail exactly as today.
- **Invariants:** the fleet cap is still authoritative and monotonic in memory; a granted
  reserve is never lost such that the fleet overspends across a crash (persist-before-ack for
  the cap boundary, or conservative recovery as in #2). Signed checkpoints unchanged.
- **Tests:** concurrent fleet reserves never exceed the cap; connection reuse verified (no
  connect-per-call); persistence cadence + crash recovery preserves the cap.
- **Acceptance:** the fleet−solo throughput gap shrinks; cap safety preserved.

## #1 — Cut per-call stdio/orchestration overhead

- **Measured:** of a 2.2 ms warm call, measured primitives are ~0.35 ms; **~84%** is stdio
  round-trips + gate orchestration (agent↔gateway↔downstream, JSON encode/parse per call).
- **Mechanism:** `wrap` is an rmcp **stdio** proxy — one agent per process, one downstream MCP
  process, two IPC hops + JSON per call.
- **Design (bounded, honest):** the full "drop stdio for in-process transport" is a large
  architecture change; do the genuinely-completable correct slice: (a) remove avoidable
  per-call work on the gateway hot path (redundant clones/allocs/serialization in
  `proxy.rs::call_tool`), (b) reuse buffers, (c) where the downstream is trusted, support an
  **in-process rail** hook so a metered call can settle without a second process hop. Explicitly
  document the remaining stdio→in-proc transport as a follow-on with its trust-boundary tradeoff
  (collapsing the process isolation between gateway and downstream).
- **Invariants:** identical verdicts + signed records; the process-isolation tradeoff of any
  in-proc rail is opt-in and documented (untrusted downstreams keep the boundary).
- **Tests:** per-call allocation/serialization reduced (micro-timing); verdicts unchanged;
  `verify-spend` consistent.
- **Acceptance:** measurable warm per-call latency reduction; behavior unchanged.

## #7 — Metrics/tracing on the payment path

- **Measured:** none — this study instrumented from the outside.
- **Mechanism:** `auths_telemetry::init_prometheus()` exists but is never called by the gateway;
  observability is `eprintln!` verdict lines.
- **Design:** add `tracing` spans + `metrics` counters/histograms around
  `PerCallGate::judge`/`settle`, `Chain::sign_call`/`sign_settlement`, `SettledCounter::settle`,
  and treasury `answer()`: per-call latency histogram, verdict counters (granted/refused/error
  by reason), signing cold-vs-warm counter, settle durable-flush counter, treasury reserve
  latency. Call `init_prometheus` in the gateway and expose a `/metrics` scrape endpoint
  (opt-in flag/env so stdio MCP mode is unaffected). Keep instrumentation in the crates that own
  the operations; the gateway wires the exporter.
- **Invariants:** zero behavior change; metrics are additive; no PII in labels (DIDs hashed or
  omitted).
- **Tests:** a metered call increments the expected counters; `/metrics` renders a Prometheus
  exposition; disabled by default in stdio mode.
- **Acceptance:** the same numbers this harness derives externally are available internally.

## #6 — Postgres registry backend (Option B)

- **Measured:** concurrent onboarding under one shared git registry serializes/times out
  (single-writer `registry.lock` + single ref).
- **Mechanism:** `auths-storage` `GitRegistryBackend` is deliberately single-writer.
- **Design:** implement `PostgresAdapter` (currently a stub) against the `RegistryBackend` port
  with row-level concurrency (unique `(tenant, prefix, seq)`, `ON CONFLICT`, transactions) so
  concurrent onboarding does not serialize. Git stays the default/sovereign backend; Postgres is
  opt-in per deployment (`auths-api`/hosted). See
  `docs/plans/storage/registry-backend-decision.md`. **Not wired into `auths-mcp-gateway`** —
  the gateway reads KELs locally on the hot path.
- **Invariants:** append-only, signed events stored verbatim, monotonic key-state (reject
  rollback), CAS-equivalent seq-conflict handling; verifiable by re-derivation from the signed
  events. Never a mutable store that can rewrite KEL history.
- **Tests:** append→get→visit round-trip; monotonic rejects rollback; **concurrent** appends to
  one prefix — exactly one wins each seq, no global-lock serialization; attestations/org/tenant;
  run against the live local Postgres.
- **Acceptance:** compiles under `--features backend-postgres`, tests green against Postgres,
  git backend unaffected.

---

## Sequencing & verification

Implement in impact order: **#5 → #2 → #3 → #4 → #7 → #1**, with **#6** in parallel (isolated
crate). After each: `cargo fmt`, `cargo clippy --all-targets --all-features -- -D warnings`,
`cargo nextest run` for touched crates, commit on `performance`. Then rebuild release tooling
(`auths`, `auths-mcp-gateway`) and **rerun `tests/performance/run.mjs`**, updating
`FINDINGS.md`/`report.html` with before/after deltas. Every claim of "done" requires green
build + tests; anything not fully completable is marked honestly, never faked.
