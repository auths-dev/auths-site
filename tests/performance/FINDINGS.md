# Findings — can the Auths MCP path scale to internet scale?

**Run:** `auths@bcf995cd` · release gateway · darwin/arm64 · 10 cores · 64 GB · node v25.9.0
· local + hermetic (`--test-mode`, no chain/network). Every number below is measured on a
**quiet machine** with the harness's test-adapter artifact removed (see §Budget); the
100,000-**tx/s** line at the end is a labeled projection, but the 100,000-**record** chain
result is measured. Charts: `report.html`. Raw data: `results/`.

---

## Verdict

**The cryptographic identity core is *not* the barrier to internet scale, and audit
integrity holds under extreme concurrency. The per-call CPU + durable-append architecture is
the ceiling — and it's fixable.**

- **Correctness is unconditional, and now proven at scale.** A concurrency bug that could
  *fork the signed spend-log hash chain* was found by an adversarial test and fixed (see the
  headline finding below). Post-fix, an adversarial **100,000-record** run — 40 agents each
  pipelining 2,500 concurrent calls — re-derived **40/40 chains `consistent`, exactly
  100,040/100,040 records, no forks or drops**. Across every throughput scenario, **100% of
  signed spend logs re-derived `consistent`** offline, even while the system thrashed.
- **Sustained throughput is ~5,200 calls/s on one node** (45 s soak, 10-wide, p50 1.54 ms,
  p99 9.65 ms, flat) — the machine's 10 cores saturated at ~1.9 ms mean CPU/call. Throughput
  does **not** scale past the core count: the ramp climbs to a knee near 16–32-wide, then
  **loses** throughput under oversubscription (256-way → 1,407 calls/s, p99 823 ms).
- **The enforcement primitives are cheap.** ed25519 clears **89,695 verify/s** and
  **216,169 sign/s** across 10 cores; the crypto ceiling for a full call (2 signs + 1 verify)
  is **49,017/s** — ~10× above the measured system and half-way to 100k on a *single node*.
- **What eats the difference is CPU, not the wire.** Direct per-stage measurement of a
  0.93 ms warm call: **transport is a ~10% minority** (agent↔gateway wire 0.09 ms; ~20% if
  the gateway↔adapter hop is also counted). The other ~80% is **in-handler orchestration
  (0.39 ms, 41%)** + the **auths enforcement stages** (sign/gate/settle/spend-log, 0.36 ms,
  39%). *(The earlier "~84% transport" was a subtraction estimate, polluted by a test-adapter
  artifact; it is retracted — see §Budget.)*

**Gap to 100k tx/s: ~19× on one node.** Reachable by shaving per-call CPU + amortizing the
durable append, then sharding ~2 nodes at the per-node crypto ceiling. See the projection at
the end.

---

## Headline finding — a spend-log chain fork under concurrency (found, fixed, proven at 100k)

The spend log is a signed hash chain: each record's `Auths-Prev` links to the prior, and the
offline `verify-spend` auditor re-derives the entire spend — and every refusal — by replaying
it, trusting neither the gateway nor its operator (D8). **That chain *is* the audit
integrity.**

**The bug.** `call_tool` read the chain head, *released the lock*, did the whole call
(sign → gate → downstream → settle → append), then wrote the new head at the very end. Two
concurrent calls both read the *same* head and both linked to it — the chain **forked**, and
`verify-spend` could no longer re-derive the spend. An adversarial reproducer made it fail
loudly:

```
40 pipelined concurrent calls to ONE agent → 40 granted
verify-spend: 0/1 consistent, 0 records re-derived     ← chain BROKEN
```

This is security-critical, not cosmetic: a forked chain means the audit cannot prove the
spend or the refusals, so the guarantee the product is sold on collapses. A single pipelining
(or malicious) agent could break its own audit trail today.

**The fix.** Make the chain critical section **atomic per agent** — hold the head lock across
`read head → sign(head) → downstream → settle → append → advance head`, so concurrent calls
on one chain **serialize** (a hash chain is inherently sequential; serializing per chain is
the *correct* semantics). Calls on **different** chains (different agents) still run fully
concurrently, each on its own lock. Lock order is always `chain → budget`, so no deadlock;
verdicts and signed records are byte-identical to the sequential path — only ordering
discipline changed. (`auths@bcf995cd`, `crates/auths-mcp-gateway/src/proxy.rs`.)

**Proven at internet scale.** The reproducer is now a committed regression scenario
(`scenarios/chain.mjs`), run at increasing scale:

| Adversarial run | Driven | verify-spend | Records |
|---|---:|---|---:|
| pre-fix, 40 pipelined @ 1 agent | 40 | **0/1 forked ✗** | 0 re-derived |
| post-fix, 6 agents × 80 pipelined | 480 | 6/6 consistent ✓ | 486/486 |
| **post-fix, 40 agents × 2,500 pipelined** | **100,000** | **40/40 consistent ✓** | **100,040/100,040** |

The 100k run stresses both axes at once: 40 chains advancing in parallel **and** 2,500
in-flight calls hammering a *single* chain's atomic section. Every chain stayed one linear
unbroken chain — no fork, no drop, no reorder — in 73 s.

---

## The measured picture (this run, all fixes applied)

| Metric | Value | Where |
|---|---|---|
| **Sustained throughput** (45 s soak, 10-wide) | **5,216 calls/s**, p50 1.54 ms, p99 9.65 ms, flat | `soak` |
| Ramp knee (solo) | ~2,900 calls/s @ 16–32-wide, then declines | `ramp-solo` |
| Throughput at 256-wide | 1,407 calls/s, p99 **823 ms** | `ramp-solo` collapse |
| Fleet coordination tax (vs solo) | **3% @ k16 · 5% @ k32 · 15% @ k64** | `ramp-fleet` |
| Cold first *metered* call | **~3 ms** (was ~6.0 s pre-#5) | `ramp` cold / #5 |
| ed25519 verify / sign (10 cores) | 89,695 / 216,169 per s | `microbench` |
| **Full-call crypto ceiling** (2 sign + 1 verify, 10 cores) | **49,017/s** | `microbench` derived |
| Durable rename / append (1 writer) | 5,736 / 30,607 per s | `microbench` |
| Canonicalize | 1,359,539 per s | `microbench` |
| **Per-call budget** (mean) | 0.84 ms CPU + 0.09 ms wire = **0.93 ms** external | `metrics` dogfood |
| Burst drain (1,024-call spike) | **190 ms**, warm | `burst` |
| **Chain integrity under concurrency** | **100,040/100,040 records · 40/40 chains consistent** | `chain` (100k) |
| Spend-log consistency (all scenarios) | **256/256 · 256/256 · 10/10 · 40/40 consistent** | `verify-spend` |

The ramp curve is the shape headline: throughput rises to a knee near the core count,
plateaus, then **loses** throughput as more processes only add contention (256-way p99 =
823 ms). Classic CPU/transport-bound, not work-bound. The **soak** is the reliable sustained
figure — 10 workers × ~1.9 ms mean/call ≈ 5,200 calls/s, flat over 45 s with flat RSS.

---

## Per-call budget — where a 0.93 ms call actually goes (metrics dogfood)

The gateway now exposes Prometheus `auths_mcp_stage_seconds` (#7); the harness scrapes
`/metrics` and cross-checks it (the gateway's own `auths_mcp_calls_total` = the harness's
driven count, **1,604 = 1,604**). Mean ms/call, measured directly:

| Stage | ms | Share | What it is |
|---|---:|---:|---|
| orchestration | 0.386 | 41% | in-handler glue (canonicalize, binding, record assembly) |
| spend_log | 0.133 | 14% | append one signed line per call |
| gate | 0.110 | 12% | `PerCallGate::judge` — KEL verify + budget reserve |
| downstream | 0.095 | 10% | gateway↔adapter hop |
| settle | 0.059 | 6% | cross-rail settle + counter |
| sign | 0.057 | 6% | in-process SSHSIG |
| **transport gap** | 0.092 | 10% | agent↔gateway wire (external − internal) |
| **external total** | **0.932** | 100% | what the caller sees |

**The correction that matters:** transport is a **~10%** minority (agent↔gateway 0.092 ms),
or ~20% if the gateway↔adapter `downstream` hop is also called transport. Per-call **CPU
dominates** — orchestration (41%) + the auths enforcement stages (sign+gate+settle+spend_log
= 39%). The x402 *test* adapter had been re-reading its fixture from disk every call
(~0.2 ms), a harness artifact now fixed (`auths-mcp` `performance`); that alone dropped
`downstream` from ~0.38 to 0.095 ms. This **re-orders the #1 plan**: shave CPU first,
transport rewrite second.

---

## Measured impact of the `performance`-branch fixes

Fixes #2, #4, #5, #6, #7 + the chain-safety fix, all on the `auths` `performance` branch:

| Fix | Outcome |
|---|---|
| **Chain-safety** (atomic per-agent critical section) | Fork under concurrency → **eliminated**: 0/1 → **40/40 consistent at 100k records**. Committed adversarial regression test. |
| **#5** cold-start signing | ~6.0 s first metered call → **~3 ms** (≈2,000×). The git-subprocess ceremony + Argon2id unlock moved off the metered path into session setup; the hot path never forks git. Confirmed by `/metrics`: `sign{subprocess}` = 4 (only the warm-ups), `sign{inproc}` = 1,604 (every metered call). |
| **#4** treasury keepalive/pool | Fleet coordination tax ~30% → **3–15%** (keepalive connection vs connect-per-reserve). |
| **#2** group-commit durable counter | In-memory authoritative counter, per-settle durability default; cross-rail cap safety unchanged — every log still re-derives `consistent`. |
| **#6** Postgres `RegistryBackend` | Replaced the stub with a full backend (CAS on `(tenant, prefix, seq)`, monotonic key-state, append-only signed events) — **17 integration tests pass on live Postgres**, incl. concurrent onboarding of different identities no longer serializing. Opt-in `backend-postgres`; git stays default; not wired into the gateway. |
| **#7** metrics on the payment path | Prometheus counters/histograms on gate/settle/sign, opt-in `/metrics`; the harness dogfoods it (1,604 = 1,604). This is what made the budget above measurable rather than subtraction-estimated. |
| **#1 Phase 1** hot-path hygiene | Gated the per-call `eprintln`, deduped the proof-hash binding — trimmed in-handler orchestration. Deeper #1 (batching, in-process/streamable-HTTP transport) is scoped as follow-on; per the corrected budget it's a smaller lever than the CPU work. |

**Solo peak barely moved** — as predicted, the single-node ceiling is per-call CPU +
orchestration (#1), not signing/counter/treasury. Spawn time rose (~130 s → ~157 s): the
one-time ceremony now runs at setup, off the metered path — the intended trade.

*(Throughput deltas vs the original `auths@7c08f225` baseline are omitted as precise figures:
the ramp is noise-dominated at short levels and the original baseline was measured under
different machine load. The outcomes above are the ones the mechanism makes robust — cold
start, fleet tax, chain-safety, onboarding, observability.)*

---

## Bottlenecks, ranked by impact — observation → mechanism → fix

### 1. Per-call CPU + transport overhead — the single-node ceiling
- **Observed:** warm call ≈ 0.93 ms, of which per-call **CPU** (orchestration 0.39 ms + auths
  stages 0.36 ms) is ~80% and **transport** ~10–20%. Sustained throughput saturates the core
  count (~5,200 calls/s @ 10-wide) and collapses under oversubscription (256-way → 1,407,
  p99 823 ms).
- **Mechanism:** `wrap` is an rmcp **stdio** proxy — one agent per process
  (`crates/auths-mcp-gateway/src/proxy.rs`) — and each metered call round-trips to a separate
  downstream MCP process. Real parallelism means N processes, so 256 agents oversubscribe 10
  cores and collapse; but the *per-call* cost is mostly CPU, not the hop.
- **Fix (re-prioritized by the measurement):** shave in-handler orchestration + the auths
  stages first (Phase 1 done: gated the per-call log, deduped the proof hash). The in-process
  / streamable-HTTP transport (Phase 3) is a smaller win than the retracted "84%" implied.
  Phased plan: `docs/plans/performance/reduce-per-call-transport-overhead-prd.md`.

### 2. Per-call durable writes — the serial floor (and the shared-counter wall)
- **Observed:** a single durable counter caps at **5,736 rename/s** — right at the sustained
  soak throughput, so any **shared** counter binds here directly (the treasury's fleet tax,
  #4).
- **Mechanism:** `SettledCounter` does an `fs::read` on every `reserve`
  (`auths-mcp-core/src/budget.rs`) and a temp-write + `rename` on every `settle`;
  `spend_log::append` opens+writes a line per call. One rename + one append per transaction.
- **Fix:** **group-commit / WAL** — batch N settles into one fsync; keep the counter in memory
  with periodic durable checkpoints; move the append off the reserve→settle critical section.
  The signed spend log stays the source of truth; only its *flush cadence* changes. (#2 landed
  the in-memory counter; the group-commit fsync batching is the remaining lever.)

### 3. Redundant KEL replay + verify on every call
- **Observed:** not yet the binding constraint (crypto has ~10× headroom), but pure wasted CPU
  that will bind once #1/#2 are fixed. `gate` is 0.110 ms/call today.
- **Mechanism:** `verify_commit_against_kel_scoped` replays **both** the root and device KELs
  from scratch every call with no cached state (`auths-verifier/src/commit_kel.rs`), then one
  SSHSIG verify.
- **Fix (safe form only):** memoize the *pure* KEL-replay derivation (authoritative key state +
  delegation validity) keyed on the **tips of both KELs**. Any appended event moves a tip and
  busts the cache, so the derived state is provably identical to a full replay. The per-call
  SSHSIG verify, the expiry check against `now`, and this call's scope ⊆ grant stay fresh.
- **Security note — do NOT cache the verdict on a TTL.** The full replay is a fail-closed
  primitive: it's what makes revocation and key-rotation take effect on the **very next call**.
  A verdict/TTL cache would keep honoring a revoked/rotated-out delegation for the window — in
  a metered path that's post-revocation budget draining (real money). And revocation may live
  **outside** the KEL (a TEL event / `revoked_at`), which wouldn't move a KEL tip — so
  **revocation + expiry must be re-checked fresh every call regardless.** Because this is not
  the binding constraint today, it's not worth the revocation-latency risk until it binds.

### 4. Treasury coordinator — global lock + persist-per-reserve + (was) connect-per-call
- **Observed:** fleet mode's coordination tax is now **3–15%** (down from ~30%), but it still
  trails solo and both collapse together at 256-way.
- **Mechanism:** one `Arc<Mutex<ServeState>>` serializes all fleet reserves
  (`crates/auths-mcp-gateway/src/treasury.rs`), and the whole ledger is persisted on every
  reserve. #4 fixed the connect-per-reserve (keepalive pool); the global lock + persist-per-
  reserve remain.
- **Fix:** a sharded or lock-free fleet counter; batched/async ledger persistence (same
  group-commit idea as #2). This is the price of "one cap across N processes."

### 5. Cold-start signing ceremony — was 6 s per agent (fixed)
- **Observed:** first call of every agent was **~6.0 s** vs ~2 ms warm; now **~3 ms** with the
  in-process path armed at session setup (#5).
- **Mechanism:** `chain.sign_call` used to shell out to `git init`/`git commit`/`auths sign
  HEAD` on the first call; the fast in-process SSHSIG path (`inproc_sign.rs`) is now armed at
  setup (session key pre-decrypted, templates warmed).
- **Note (git2/wasm is not the blocker):** the fast path is **already pure Rust** — SHA-1 +
  hand-built git object bytes + `create_sshsig`, no `git2`, no subprocess. The deeper win is to
  construct the signing *template* in-process from delegation metadata (all static trailers are
  known at session setup), removing the first-call subprocess entirely.

### 6. Fleet onboarding is serialized by the registry's single-writer model
- **Observed:** provisioning N agents **concurrently** under one shared root serializes and
  times out. The harness works around it by giving each agent its **own** isolated registry
  (256 agents in ~130 s).
- **Mechanism:** `auths-storage`'s `GitRegistryBackend` is a **deliberately single-writer**
  backend — every write takes an exclusive `registry.lock` (`fs2::lock_exclusive`, blocking)
  held across the git2 commit + a CAS on a single ref. Concurrent delegations block on the lock
  while the holder does its slow signed commit.
- **Fix (a design choice, not a bug):** if high-fanout concurrent onboarding is a goal, use the
  **`backend-postgres`** backend (#6, row-level concurrency, no global lock), **batch** N
  delegations into one lock acquisition, or **shard into separate registries**.
- **Decision plan:** `docs/plans/storage/registry-backend-decision.md`.

### 7. Metrics/tracing on the payment path — done (#7)
- **Was:** this study had to instrument entirely from the outside; observability was
  `eprintln!` verdict lines only.
- **Now:** `tracing`/`metrics` on the payment hot path behind an opt-in `/metrics`
  (`AUTHS_MCP_METRICS_ADDR`), dogfooded by the harness. This is what turned the per-call budget
  from a subtraction estimate into a direct measurement — and caught the "84% transport" error.

---

## What already works well — keep these

- **Cryptographic correctness is unconditional, and now proven under adversarial concurrency.**
  256/256, 10/10, and **40/40 (100,040 records)** signed logs re-derived `consistent`. The
  hash-chained spend log + offline `verify-spend` are the right design and they held.
- **In-process SSHSIG signing is fast** (~2 ms warm; `sign` stage 0.057 ms). The machinery
  exists; #5 made it the default on the metered path.
- **No leaks / no decay.** The 45 s soak held a flat ~5,200 calls/s with flat RSS and p99
  9.7 ms — steady-state is clean.
- **Bursts drain gracefully.** A 1,024-call spike drains in 190 ms once warm; only the first
  cold burst is slow.

---

## Not yet measured — identity storage (`auths-id/src/storage`)

This study stresses the **payment path**; it does **not** benchmark identity storage, which
sits on the **onboarding / resolve** path, not the per-call metered path. Reading the code,
that module is already well-shaped for concurrency (git2 **object** writes, per-DID refs, no
working tree, no `.git/index.lock`, plus a SQLite read index). None of the measured walls live
there.

**TODO — add a `storage-bench` scenario** before drawing any storage conclusion: drive
`KeriGitStorage::{store_event, read_kel_history}` and the SQLite `update_index`, single-thread
and concurrent, to measure high-fanout onboarding write throughput, the SQLite single-writer
serialization on concurrent upserts, and `read_kel_history` cost as KELs grow. Only then is a
storage change evidence-based.

---

## Projection to 100,000 tx/s (modeled, not measured)

| Stage | calls/s | What changes |
|---|---:|---|
| Sustained today (one node) | 5,216 | real system, 10 cores saturated |
| + group-commit durability | ~30,607 | amortize per-call rename/append → 1 fsync per batch (#2); append ceiling |
| + per-call CPU + transport (#1) | 49,017 | shave orchestration/stages + drop the stdio hop; **crypto now binds — per-node ceiling** |
| **Internet scale** | **100,000** | **shard ×2–3 nodes** at the per-node ceiling |

Two single-node levers — **group-commit durability** and **per-call CPU/transport** — lift one
node from ~5k toward the ~49k crypto ceiling. Reaching 100k tx/s then needs only ~2–3 sharded
nodes (each carrying independent agents / spend logs, coordinated by a sharded treasury per
#4). The identity/crypto core scales and the audit chain is proven correct under concurrency;
the per-call CPU + durable-append is what has to change first.

---

## Calibration against Stripe — what "internet scale" actually needs

The 100k tx/s target is abstract; a real payments network makes it concrete. The fair comparison
is our metered **call** (sign → gate → settle → spend-log) against a Stripe **payment
transaction**, not a generic API request.

| Layer | Stripe | Auths, one node (this study) | Ratio |
|---|--:|--:|--:|
| **Payment transactions** (the fair comparison) | ~1,600 tx/s (Black Friday peak; ~95k/min) | **5,216 cps** sustained · **~49,017/s** crypto ceiling | **~3×** sustained · **~30×** ceiling |
| Total API requests (all types, incl. reads) | 27,000 req/s peak · ~5,200/s avg (450M/day) | — | our *ceiling* clears even their all-request peak |
| Per-tenant governance | 100 req/s live · 25 req/s per endpoint | **~1,075 calls/s** per single serialized agent chain | **~10×** their per-account live cap |

Three things follow, and they reframe the projection above:

- **The enforcement layer is already past realistic payment peaks.** One node sustains ~3×
  Stripe's Black Friday *payment* peak, and the crypto ceiling is ~30× it. **100k tx/s is ~60×
  Black Friday** — long-horizon future-proofing, not a near-term bar.
- **The real production ceiling is the settlement rail, not auths.** Every number here is
  hermetic (`--test-mode`, no real rail). x402/USDC on-chain settlement is *seconds*, not ms, so
  a production deployment is **rail-bound, not gateway-bound**. The single-node levers above
  (group-commit, per-call CPU/transport) optimize a layer that is *not* the bottleneck once the
  real rail is attached — which is also why the transport rewrite is tracked-and-deprioritized
  (`auths#384`).
- **What to fix first isn't more enforcement throughput.** It's (a) the settlement rail and
  (b) the *shared-coordination* points — the treasury cap coordinator (#4) and the Postgres
  registry (#6) — the only shared state a fleet contends on. The per-agent enforcement path is
  done for any realistic near-term volume.

*(Caveat both ways: Stripe's ~1,600 tx/s moves real money — fraud, ledgering, card networks — a
far heavier operation than a hermetic enforcement call; and their 450M/day ≈ 5,200/s average is
total API incl. reads, not payments. The honest read is directional: **the auths enforcement
layer is not what stands between us and Stripe-class volume — the rail and the coordinators
are.**)*

---

## Reproduce

| Step | Command |
|---|---|
| Build gateway | `cargo build --release -p auths-mcp-gateway` (in `../auths`) |
| Full study | `node run.mjs` |
| One scenario | `node run.mjs microbench` (or `ramp-solo`, `ramp-fleet`, `soak`, `burst`, `metrics`, `chain`) |
| **Big chain stress** | `CHAIN_AGENTS=40 CHAIN_DEPTH=2500 node run.mjs chain` (100k adversarial records) |
| Fast smoke | `node run.mjs --quick` |

All figures are re-derivable from the signed spend logs via `auths-mcp-gateway verify-spend`.
