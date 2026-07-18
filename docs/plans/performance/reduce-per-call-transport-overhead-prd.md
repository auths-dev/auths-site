# PRD — #1 Reduce stdio / orchestration per-call overhead

**Status:** PROPOSED · 2026-07-19
**Trigger:** max-throughput study — `tests/performance/FINDINGS.md` §1 (the single largest
per-call cost, and the reason solo peak throughput did **not** move after #5/#2/#4).
**Target:** `auths-mcp-gateway` (`crates/auths-mcp-gateway`) + the MCP transport model; the
per-call gate in `auths-mcp-core` is reused, not reimplemented.
**Conventions:** all Rust adheres to `auths/CLAUDE.md` (strict layering, `thiserror` in
core/sdk, no `unwrap`/`expect` in non-test code, rustdoc, clock injection). Pre-launch: no
backwards-compat constraint — the transport may change shape.

Related repos:
- /Users/bordumb/workspace/repositories/auths-base/auths/crates/auths-mcp-*
- /Users/bordumb/workspace/repositories/auths-base/auths-mcp
- /Users/bordumb/workspace/repositories/auths-base/auths-site/tests/performance

---

## 1. Problem (measured)

A warm metered `paid_call` costs **~2.0–2.2 ms**. The measured per-call *primitives* —
crypto (2 signs + 1 verify), the durable counter write, the spend-log append, and
canonicalization — sum to only **~0.35 ms**. The remaining **~84% (~1.85 ms) is transport +
gate orchestration**, and it is why the solo throughput ceiling barely moved (3,964 → 4,084
calls/s) even after cold-start signing (#5), the in-memory counter (#2), and treasury
keepalive (#4) landed. **#1 is now the binding constraint on single-node throughput.**

The overhead also drives the *shape* of the whole study: the gateway is one-agent-per-process
over stdio, so "more throughput" means "more processes" — which is why the harness spawns 256
gateway + 256 adapter processes and collapses a 10-core box.

## 2. Current architecture (what generates the overhead)

`auths-mcp-gateway wrap` is an **rmcp stdio proxy** (`proxy.rs`, `rmcp` features
`transport-io` + `transport-child-process`). Each `tools/call` crosses **two process
boundaries**:

```
agent ──JSON-RPC / stdio──▶ gateway  ──(gate: canonicalize → sign → verify → reserve)
                            gateway  ──JSON-RPC / stdio──▶ downstream MCP child (settle)
                            gateway  ◀──JSON-RPC / stdio──  downstream (rail response)
                            gateway  ──(extract cost → settle → sign settlement → spend-log)
agent ◀──JSON-RPC / stdio── gateway
```

Per-call overhead sources, in rough order:

| Source | Where | Notes |
|---|---|---|
| Two IPC hops (pipe write+read) | agent↔gateway, gateway↔downstream | kernel copy + scheduling on each |
| JSON encode/decode ×2 hops | `serde_json` on request + response, both hops | `CallToolRequestParam` / `CallToolResult` |
| Downstream child round-trip | `downstream.call_tool()` (`proxy.rs:533`) | a second process, its own stdio loop |
| Per-call allocations/clones | `args_value = request.arguments.clone()`, canonical bytes, verdict clones | `proxy.rs` `call_tool` |
| Gate orchestration | lock acquisition, `Instant`/`Utc::now`, string formatting for the verdict line | mostly cheap; the `eprintln!` per call is not free at rate |
| One-process-per-agent | stdio model | forces N OS processes for N-way concurrency (context-switch + memory) |

**Instrumentation now exists** (#7): `auths_mcp_call_latency_seconds` (per-call histogram)
and `auths_mcp_calls_total{verdict}` are emitted on this exact path and scrapeable at
`/metrics`, so every phase below is measurable from inside the gateway, not only externally.

## 3. Why this is an architecture decision, not a micro-opt

Removing the boundaries changes four things at once, so the design must choose a posture:

1. **Trust boundary.** The separate gateway *process* is a security boundary: an untrusted
   agent can only send JSON-RPC and receive a **signed** receipt; it cannot reach the budget
   counter, the signing key, or forge a verdict, because those live in another address space.
   Collapsing the gate into the agent's process (in-proc library) removes that isolation — so
   in-proc is safe only for **trusted** embedders (a first-party server), not arbitrary agents.
2. **Integration model.** Today: "point your MCP client at `auths-mcp-gateway wrap -- <cmd>`"
   — language-agnostic, any MCP client. Embedded: "link the Rust gate crate / FFI it." Different
   distribution and bindings story.
3. **Concurrency model.** stdio = one-agent-per-process. Hosting many agents in one process
   makes the per-session budget mutex hot and, critically, requires reworking the spend-log
   hash chain (`prev_binding: Mutex<String>` + `next_call: AtomicUsize`), which today assumes
   **sequential single-agent** flow.
4. **Audit model.** Batching amortizes the round-trip, but each call today emits one signed
   proof + settlement + spend-log record that `verify-spend` re-derives one-by-one; a batch
   must carry a proof that re-derives per-call.

## 4. Design — phased, lowest-risk first

Each phase is independently shippable and measured against the #7 latency histogram + the
harness. **Invariant across all phases:** identical verdicts, identical signed spend-log
records, and `verify-spend` stays `consistent`. Nothing here changes what is enforced — only
how the bytes move.

### Phase 0 — decompose the per-call budget — **IMPLEMENTED**
The gateway emits `auths_mcp_stage_seconds{stage}` histograms around `sign`, `gate` (verify +
reserve), the `downstream` round-trip, `settle`, and the `spend_log` append. The perf
harness's `metrics` scenario scrapes them and computes the mean per-call budget, the
`orchestration` residual (handler time not inside an instrumented stage), and the `transport`
gap (caller-observed round-trip − handler time = the agent↔gateway pipe/JSON the handler
cannot see from inside `call_tool`).

**Measured (4 agents, mean ms/call):**

| sign | gate | downstream | settle | spend_log | orchestration | transport | ≈ external |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 0.07 | 0.15 | 0.38 | 0.08 | 0.17 | 0.57 | 0.19 | ~1.6 |

Stages + orchestration sum **exactly** to the handler time (acceptance met). The two largest
slices are **`downstream`** (gateway↔adapter pipe + JSON + the adapter's per-call fixture read —
Phase 3's target) and **`orchestration`** (in-handler clones, lock acquisitions, and the
per-call `eprintln!` — Phase 1's target): ~0.57 ms/call is spent outside crypto/fs/downstream,
in avoidable handler overhead. That is why Phase 1 (low-risk) is worth doing before the
architecture commitments.

### Phase 1 — in-place hot-path hygiene (low risk, keeps every boundary)
- Remove avoidable per-call allocation/serialization in `call_tool` (reuse buffers; avoid the
  `arguments.clone()` + re-`Object` round-trip; compute canonical bytes once; drop verdict
  clones where a borrow suffices).
- Demote the per-call `eprintln!` verdict line to a `tracing` event gated by level (at rate,
  synchronous stderr writes are a real cost).
- Larger/reused stdio buffers on both rmcp legs.
**Acceptance:** measurable warm-latency drop with **zero** behavioural change; verdicts +
`verify-spend` identical. Target: shave the orchestration slice without touching the two hops.

### Phase 2 — batched `tools/call` (amortize the round-trips)
Add a batch entrypoint (`auths/batch_call` custom method, or MCP array batch) that carries N
calls in one request. The gateway gates + signs + settles each independently and returns N
results, but pays the transport round-trip **once**. The spend-log stays one signed record
per call (so `verify-spend` is unchanged); only the wire framing amortizes.
**Risk:** requires an agent programming-model change (agents typically call one-at-a-time) and
a small protocol extension. **Acceptance:** throughput per round-trip rises ~linearly with
batch size up to the primitive floor; per-call records unchanged; `verify-spend` consistent.

### Phase 3 — streamable-HTTP transport (the likely sweet spot)
Replace/augment stdio with rmcp's **streamable-HTTP** transport. One long-lived multiplexed
connection per agent (or many agents multiplexed) removes per-call process/pipe overhead and
the one-process-per-agent explosion **while keeping the process boundary** — isolation is
preserved. This is the middle ground between "stdio child per agent" and "in-proc library": a
single gateway process can host many agents over HTTP without collapsing the trust boundary.
**Requires:** confirming rmcp streamable-HTTP maturity; reworking the spend-log serialization
for concurrent agents in one process (per-agent chain state, sign+append serialized per agent,
not globally). **Acceptance:** N agents served by one gateway process at materially higher
aggregate throughput than N stdio processes on the same cores; per-agent `verify-spend`
consistent under concurrency.

### Phase 4 — in-process gate embedding (trusted downstreams only)
Expose `PerCallGate` (`auths-mcp-core`, already a library) as an embeddable API and an
**in-process rail hook**, so a *trusted first-party* server calls the gate directly — no
stdio, no second process, crypto becomes the bind. **Explicitly opt-in and documented** as an
isolation tradeoff: untrusted agents/downstreams keep the process boundary (Phases 1–3). This
is the path to the "per-node crypto ceiling" in the FINDINGS projection.
**Acceptance:** an embedded harness reaches the crypto/durability ceiling (≫ 4k/s single node)
with identical verdicts + `verify-spend`; the isolation tradeoff is documented and gated.

## 5. Security / invariants (non-negotiable)

- **Same enforcement.** Every phase produces byte-identical signed proofs + spend-log records;
  `verify-spend` re-derives `consistent`. The verifier is untouched.
- **Isolation is a posture, not a default.** Any path that collapses the gateway↔agent or
  gateway↔downstream process boundary (Phase 4 in-proc rail) is opt-in, documented, and used
  only for trusted embedders. The default (untrusted agent) keeps the boundary.
- **Concurrent chain integrity.** If one process hosts multiple agents (Phases 3–4), the
  spend-log hash chain must be per-agent and its sign+append serialized per agent — never a
  global assumption of sequential flow. A concurrency test must show no interleaved/dropped
  records under load (extend the harness's `verify-spend` assertion to the multi-agent process).
- **No new PII.** Metrics/labels never carry raw DIDs (hash or omit), consistent with #7.

## 6. Test & verification plan

- **Per-call cost:** the #7 `/metrics` latency histogram (`auths_mcp_call_latency_seconds`)
  and the Phase-0 stage histogram, before/after each phase — dogfooded by the harness's
  `metrics` scenario (external drives N, gateway self-reports N, cross-checked).
- **Behaviour unchanged:** verdict counts (`auths_mcp_calls_total{verdict}`) identical for the
  same workload; `verify-spend` `consistent` on every run (already asserted by the harness).
- **Throughput:** `tests/performance` `soak` (warm latency) and `ramp-solo` (solo peak) show
  the win — the target metric is **solo peak throughput**, which #1 currently caps.
- **Concurrency (Phases 3–4):** a new harness variant that runs M agents in **one** gateway
  process and asserts M-way `verify-spend` consistency + no chain interleaving.

## 7. Acceptance criteria

1. Solo peak throughput rises materially above the current ~4,084 calls/s (the whole point:
   #1 is the ceiling), trending toward the primitive floor as later phases land.
2. Warm per-call latency drops toward the ~0.35 ms primitive floor.
3. Verdicts and `verify-spend` are unchanged across every phase.
4. Any isolation tradeoff (Phase 4) is opt-in + documented; the default posture keeps the
   process boundary.

## 8. Sequencing & open questions

**Sequence:** Phase 0 (measure) → Phase 1 (hygiene, safe) → Phase 3 (streamable-HTTP — likely
best throughput-for-risk, keeps isolation) → Phase 2 (batching, if the agent model allows) →
Phase 4 (in-proc, trusted only). Phases 1 and 0 are low-risk and can land immediately; 3 and 4
are architecture commitments that want their own review.

**Open questions (product/architecture):**
- Which downstreams/agents are **trusted** enough for in-proc (Phase 4), and which must keep
  the boundary?
- Does the target agent programming model tolerate **batched** calls (Phase 2), or is
  one-call-at-a-time a hard constraint?
- Is the desired deployment **one-process-many-agents** (streamable-HTTP, Phase 3) or an
  **embedded library** (Phase 4)? They imply different concurrency + distribution stories.
- rmcp streamable-HTTP transport maturity for the server + child legs.

---

_Downstream of `tests/performance/FINDINGS.md` §1 and the parent PRD
`docs/plans/performance/bottleneck-fixes-prd.md`. Observability for measuring every phase
already exists (#7). This is deliberately staged so the low-risk wins ship before the
architecture commitments (trust boundary, concurrency, audit) are made._
