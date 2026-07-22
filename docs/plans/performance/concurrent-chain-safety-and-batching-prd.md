# PRD — Concurrency-safe spend-log chain (Phase 3 core) + batched calls (Phase 2)

**Status:** PROPOSED · 2026-07-19
**Parent:** `reduce-per-call-transport-overhead-prd.md` (#1), Phases 2 & 3.
**Target:** `auths-mcp-gateway` (`crates/auths-mcp-gateway/src/proxy.rs`, `chain.rs`,
`spend_log.rs`); the per-call gate + verifier in `auths-mcp-core`/`auths-verifier` are reused,
not reimplemented. Adversarial tests in the gateway crate + `auths-site/tests/performance`.
**Conventions:** `auths/CLAUDE.md` (no `unwrap`/`expect` outside tests, `thiserror`, rustdoc,
clock injection). No workflow tags in code comments.

---

## 1. The finding that motivates this — measured, not hypothetical

Firing **40 pipelined concurrent `tools/call`s at one agent** (send all, then await) and then
running the offline auditor:

```
40 concurrent (pipelined) calls to ONE agent: 40 granted
verify-spend: 0/1 consistent, 0 calls re-derived   ← the hash chain is BROKEN
```

**Root cause.** `call_tool` reads the chain head, *releases the lock*, does the whole call,
then writes the new head at the very end:

```
let prev_binding = self.prev_binding.lock().await.clone();   // read + UNLOCK
… sign(prev) → gate → downstream → settle → append …          // (no lock held)
*self.prev_binding.lock().await = new_binding;               // write at the end
```

Two concurrent calls both read the *same* `prev_binding` and both sign records that link to it,
so the spend log stops being a single linear chain — it **forks**, and `verify-spend` can no
longer re-derive the spend. The struct comment already flags this: *"Correct for the sequential
single-agent flow; concurrent persists from multiple agents on one gateway would need this
serialized across sign+append (a follow-on)."* Phase 3's whole point (one process, many agents,
concurrent calls) triggers it — and, as measured, a single **pipelining** agent triggers it
today.

**Why it is security-critical, not cosmetic.** The signed, hash-chained spend log *is* the audit
integrity: `verify-spend` re-derives the spend — and the refusals — by replaying the chain,
trusting neither the gateway nor its operator (D8). A forked/broken chain means the audit cannot
prove the spend, so the guarantee the product is sold on collapses. A pipelining or malicious
agent can break its own audit trail today; under the multi-agent transport it could interleave
records. This must be closed before Phase 3's transport, and is worth closing regardless.

## 2. Phase 3 core — concurrency-safe per-agent chain

### Design
Make the **chain critical section atomic per agent**: hold the chain head lock across
`read head → sign(head) → downstream → settle → append → advance head`, so concurrent calls on
the same chain **serialize**. A hash chain is inherently sequential — you cannot parallelize a
linear chain — so serializing per chain is the *correct* semantics, not a compromise. Calls on
**different** chains (different agents) run concurrently, each on its own lock.

- **Lock ordering:** the chain head is acquired first, the per-session budget mutex nested inside
  it (as `call_tool` already does), so the order is always `chain → budget`. No path acquires
  `budget → chain`, so no deadlock. The async `Mutex` may be held across `.await` (downstream,
  append).
- **No regression for well-behaved agents:** a sequential agent (send, await, send) already
  serialized; holding the lock across the call changes nothing for it. Only pipelined/concurrent
  calls are now serialized instead of forking.
- **Multi-agent prerequisite:** for one process to host N agents (the Phase 3 transport), the
  chain state (`prev_binding`, `next_call`, and the per-agent budget/chain) must be **per
  session**, not per process. This PRD makes the *single* chain concurrency-safe (the security
  core + the prerequisite); the per-session fan-out is delivered with the transport (§4).

### Invariants (must hold under ANY concurrency)
- The spend log is always **one linear unbroken chain**: every record's `Auths-Prev` equals the
  immediately prior record's binding — **no forks, no duplicates, no dropped or reordered
  records**.
- `verify-spend` re-derives `consistent` for every agent, regardless of call concurrency.
- Verdicts, signed proofs, and per-call records are byte-identical to the sequential path — this
  changes *ordering discipline*, never *what is enforced or recorded*.

### Adversarial tests (the rigorous core the reviewer asked for)
1. **End-to-end pipeline (the reproducer):** a `tests/performance` scenario that pipelines N
   concurrent calls at one agent and asserts `verify-spend` `consistent` (single linear chain,
   `rederivedCalls == N`). **Demonstrated to fail pre-fix** (0/1) and **pass post-fix**.
2. **Deterministic chain test:** a gateway-crate test that drives the chain critical section from
   many concurrent tasks against a shared head and asserts the resulting record set is a single
   linear chain (each links to the prior; no fork/dup/drop) — deterministic, no external
   dependencies where feasible.
3. **Refused under concurrency:** pipelined calls that mix granted + cap-refused still produce a
   linear chain where each refused record links correctly (refusals are signed + chained too).
4. **(With the transport) multi-agent:** M agents in one process issuing concurrent calls → each
   agent's chain is independent and `consistent`; no cross-agent interleaving.

## 3. Phase 2 — batched `tools/call`

### Design
A batch entrypoint carries **N sub-calls in one request**; the gateway gates + signs + settles
each **independently**, appends **one signed spend-log record per sub-call**, and returns N
results — paying the agent↔gateway round-trip **once**. The batch is *wire framing only*: the
audit sees exactly the same per-call records a non-batched run would produce, so `verify-spend`
is unchanged.

- **Interaction with the chain:** sub-calls run **sequentially through the chain** inside the
  atomic critical section (each links to the prior) — batching and the Phase 3 fix compose:
  the batch holds the chain lock across its sub-calls.
- **Refusal semantics:** a refused sub-call still yields a signed *refused* record (chained), and
  the batch continues to the next sub-call — identical to the non-batched refusal path.
- **Expected win (bounded by the corrected budget):** transport is only ~20% of a call and the
  agent↔gateway hop ~0.10 ms, so batching saves ≈ `0.10·(1−1/N)` ms/call — a modest amortization,
  not a step change. It is included for completeness and because it composes cleanly with the
  chain fix.

### Tests
- N sub-calls → N per-call records, `verify-spend` identical to N separate calls.
- **Adversarial:** a batch with a cap-refused sub-call in the middle → the chain still linear,
  the refused record present + linked, later sub-calls unaffected.

## 4. Streamable-HTTP transport (Phase 3 transport — scoped honestly)

rmcp 0.9.1 provides `transport-streamable-http-server`, so a gateway process *can* serve many
agents over one multiplexed HTTP endpoint (removing the one-process-per-agent explosion) **while
keeping the process boundary** (agents stay separate clients; isolation preserved — no security
change, per the phase analysis). But it requires two things beyond the wire swap:

1. **Per-session state** — each connected agent needs its own chain head, `next_call`, budget,
   and delegation. The §2 concurrency-safe chain is the prerequisite; here it is instantiated
   per session rather than per process.
2. **Per-session downstream lifecycle** — each agent wraps a downstream; the server must spawn/
   route a downstream per session (or share a pool), with clean teardown.

This is a real re-architecture of the single-agent `wrap` command into a multi-agent server.
**This PRD delivers the security prerequisite (concurrency-safe chain + adversarial tests) and
Phase 2; the full multi-agent HTTP server is the follow-on that builds directly on it.** Marking
this boundary honestly rather than shipping a half-working server is deliberate — and, given the
Phase 0 correction (transport is ~20%, not 84%), the transport rewrite is a *lower-priority*
throughput lever than the CPU work, so the chain-safety (which is a correctness/security fix,
independent of throughput) is the right thing to land now.

## 5. Acceptance

1. The pipelined-concurrency adversarial test **fails before** the fix (chain broken) and
   **passes after** (`verify-spend` consistent, single linear chain) — committed as a regression
   test.
2. Batched calls produce byte-identical per-sub-call records; `verify-spend` unchanged; a
   mid-batch refusal keeps the chain linear.
3. No verdict/enforcement change; no deadlock; sequential agents see no regression.
4. Streamable-HTTP: the transport prerequisite (per-session-ready concurrency-safe chain) is in
   place; the multi-agent server is documented as the scoped follow-on.

## 6. Open questions / follow-on

- **Intra-agent concurrency:** strict per-chain serialization is simplest + correct. Allowing
  bounded concurrency (reserve a chain slot, run downstreams in parallel, append in slot order)
  is a *throughput* follow-on — only worth it if a single agent needs concurrent in-flight calls,
  which the sequential MCP client model rarely does.
- **Downstream fan-out** for the multi-agent server (per-session child vs shared pool).
- **Batch size bound** + partial-failure reporting shape for Phase 2.
