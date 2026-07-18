# Findings — can the Auths MCP path scale to internet scale?

**Run:** `auths@7c08f225` · release gateway · darwin/arm64 · 10 cores · 64 GB · node v25.9.0
· local + hermetic (`--test-mode`, no chain/network). Every number below is measured;
the 100k line is a labeled projection. Charts: `report.html`. Raw data: `results/`.

---

## Verdict

**The cryptographic identity core is *not* the barrier to internet scale. The durable-append
+ stdio-transport architecture is — and both are fixable.**

- The real signed-settlement path peaks at **3,964 calls/s** (16-wide), then **collapses**
  under oversubscription — at 256-way, throughput falls to 1,064 calls/s and p99 latency
  explodes from 13 ms to **5.2 seconds**.
- Yet the enforcement primitives are cheap: ed25519 clears **90,735 verify/s** and
  **234,493 sign/s** across the 10 cores. The crypto ceiling for a full call (2 signs +
  1 verify) is **51,151/s** — above the measured system by ~13×, and half-way to 100k on a
  *single node*.
- What eats the difference is **not** cryptography. Of a 2.2 ms warm call, the measured
  crypto + durable-fs + canonicalization primitives account for only **~0.35 ms (16%)**;
  the other **~84%** is **stdio round-trips + gate orchestration** (agent→gateway→adapter
  and back, per call).
- Correctness never bent: across every scenario, **100% of signed spend logs re-derived
  `consistent`** offline — 125,267 calls at 256-way concurrency, 155,433 over the soak —
  even while the system was thrashing.

**Gap to 100k: ~25×.** Reachable, but not with a per-call-fsync + stdio architecture. See
the projection at the end.

---

## The measured picture

| Metric | Value | Where |
|---|---|---|
| Peak throughput (real path) | **3,964 calls/s** @ 16 agents | `ramp-solo`, knee |
| Throughput at 256 agents | 1,064 calls/s (p99 **5,231 ms**) | `ramp-solo`, collapse |
| Sustained (45 s soak, 10-wide) | 3,416 calls/s, p50 2.2 ms, p99 12.2 ms, flat | `soak` |
| Cold first call (per agent) | **~6.0 s** (git-subprocess signing) | `ramp` cold |
| Warm call p50 | 2.2 ms | `soak` |
| Treasury (fleet) tax at peak | **−28%** (2,858 vs 3,964 @ 16-wide) | `ramp-fleet` − `ramp-solo` |
| ed25519 verify / sign (10 cores) | 90,735 / 234,493 per s | `microbench` |
| Full-call crypto ceiling (10 cores) | **51,151/s** | `microbench` derived |
| Durable-writer wall (1 counter) | **6,038 rename/s** (append 31,901/s) | `microbench` |
| Per-call cost split | crypto 0.15 ms · durable 0.20 ms · canon 0.0007 ms · **stdio+orch ~1.85 ms** | derived |
| Spend-log consistency under load | **256/256 & 10/10 logs `consistent`** | `verify-spend` |

The ramp curve is the headline: throughput rises to the knee at ~16 agents (1.6× the core
count), plateaus, then **loses** throughput as more processes only add contention. This is
the classic sign that the system is CPU/transport-bound, not work-bound.

---

## Bottlenecks, ranked by impact — observation → mechanism → fix

### 1. stdio transport + per-call orchestration — ~84% of every call
- **Observed:** warm p50 = 2.2 ms, but the measured primitives sum to ~0.35 ms. The
  remainder is two IPC hops per call (agent↔gateway↔adapter), JSON encode/parse on each,
  plus the adapter re-reading its settlement fixture from disk every call.
- **Mechanism:** `wrap` is an rmcp **stdio** proxy — one agent per process
  (`crates/auths-mcp-gateway/src/proxy.rs`), and each metered call round-trips to a separate
  downstream MCP process. Real parallelism therefore means N processes, which is why 256
  agents oversubscribe 10 cores and collapse.
- **Fix (biggest single win):** offer an **in-process / shared-memory transport** for the
  hot path — a library embedding of `PerCallGate` (`auths-mcp-core`) that skips the
  stdio+JSON hop entirely, or a batched call interface (`tools/call` list). Closing this gap
  alone moves the per-node ceiling from ~4k toward the crypto ceiling (~51k).

### 2. Per-call durable writes — the serial floor (and the shared-counter wall)
- **Observed:** a single durable counter caps at **6,038 rename/s**. With per-agent counters
  the aggregate hides behind CPU at this scale, but any **shared** counter hits this wall
  directly — which is exactly the treasury's 28% tax (see #4).
- **Mechanism:** `SettledCounter` does an `fs::read` on every `reserve`
  (`auths-mcp-core/src/budget.rs:352`) and a temp-write + `rename` on every `settle`
  (`budget.rs:160-176`); `spend_log::append` opens+writes a line per call
  (`auths-mcp-core/src/spend_log.rs:34`). One rename + one append per transaction.
- **Fix:** **group-commit / WAL** — batch N settles into one fsync; keep the counter in
  memory with periodic durable checkpoints; move the append off the reserve→settle critical
  section. The signed spend log stays the source of truth; only its *flush cadence* changes.

### 3. Redundant KEL replay + verify on every call
- **Observed:** not yet the binding constraint (crypto has headroom), but pure wasted CPU
  that will bind once #1/#2 are fixed.
- **Mechanism:** `verify_commit_against_kel_scoped` replays **both** the root and device
  KELs from scratch every call with no cached state
  (`auths-verifier/src/commit_kel.rs:717-761`), then one SSHSIG verify.
- **Fix (safe form only):** memoize the *pure* KEL-replay derivation — the current
  authoritative key state + delegation validity — keyed on the **tips of both KELs**
  (`root_kel_head`, `device_kel_head`). Any appended event (rotation, revocation-in-KEL)
  moves a tip and busts the cache, so the derived state is provably identical to a full
  replay. The per-call **SSHSIG verify** (different bytes every call), the **expiry check**
  against `now`, and **this call's scope ⊆ grant** stay fresh every call. Turns the
  *replay* from O(KEL length) into O(1) without weakening the verdict.
- **Security note — do NOT cache the verdict on a TTL.** The full replay is a fail-closed
  security primitive, not just overhead: it is what makes revocation and key-rotation take
  effect on the **very next call**. A verdict/TTL cache would keep honoring a **revoked or
  rotated-out** delegation for the cache window — in a metered path that is post-revocation
  budget draining (real money). And revocation may live **outside** the KEL (a TEL event /
  attestation `revoked_at`), which would not move a KEL tip — so tip-keying the KEL alone is
  insufficient: **revocation + expiry must be re-checked fresh every call regardless.**
  Because this is *not* the binding constraint today (#1/#2 are), it is not worth taking on
  revocation-latency risk until it actually binds.

### 4. Treasury coordinator — global lock + persist-per-reserve + connect-per-call
- **Observed:** fleet mode is **~28% slower** than solo at every concurrency (2,858 vs
  3,964 @ 16-wide), and both collapse together at 256.
- **Mechanism:** one `Arc<Mutex<ServeState>>` serializes all fleet reserves
  (`crates/auths-mcp-gateway/src/treasury.rs:272`), the whole ledger is persisted to disk on
  every reserve (`persist_ledger`), and the client opens a **new** `TcpStream::connect` per
  reserve with no pooling (`treasury.rs:111`, 400 ms timeout at `treasury.rs:33`).
- **Fix:** keepalive/pooled connections; a sharded or lock-free fleet counter; batched/async
  ledger persistence (same group-commit idea as #2). This is the price of "one cap across N
  processes" and it is the main thing standing between fleet and solo throughput.

### 5. Cold-start signing ceremony — 6 s per agent
- **Observed:** the first call of every agent costs **~6.0 s** (p50), vs ~2 ms warm — a
  3,000× gap, paid once per agent.
- **Mechanism:** `chain.sign_call` shells out to `git init` + `git commit` + `auths sign
  HEAD` on the first call of each capability; the fast in-process SSHSIG path
  (`inproc_sign.rs`) is armed **only** when `AUTHS_PASSPHRASE` + a file keychain are set
  (this harness sets them). Without them, *every* call pays the multi-second cost.
- **Fix:** make in-process signing the default (or a resident signing service); never fork
  git on the hot path. Critical for short-lived/high-churn agents (an HFT fleet that
  re-delegates often pays this repeatedly).
- **Note (git2/wasm is not the blocker):** the fast path (`inproc_sign.rs`) is **already
  pure Rust** — SHA-1 + hand-built git object bytes + `create_sshsig`, **no `git2`, no
  subprocess** — so it carries no FFI/wasm baggage. The gateway crate has **no `git2`
  dependency**; the subprocess `git` in `chain.rs` runs **only on the first call**, to
  harvest a byte-fidelity *template* from the canonical `auths sign HEAD` ceremony. The
  deeper win is therefore to **construct that template in-process from the delegation
  metadata** (the static trailers `Auths-Id`/`Auths-Device`/`Auths-Anchor-Seq`/`Auths-Scope`
  + the identity line are all known at session setup), removing the subprocess cold-start
  entirely. (`git2` is used freely in `auths-id` and `auths-storage`, so it is not being
  avoided workspace-wide for wasm reasons.)

### 6. Fleet onboarding is serialized by the registry's single-writer model
- **Observed:** provisioning N agents **concurrently** under one shared root serializes and
  times out — 3 of 4 agents blocked past the 120 s init timeout. (The harness works around
  it by giving each agent its **own** isolated registry, which provisioned 256 agents in
  130 s — i.e. sharding into separate repos removes the contention.)
- **Mechanism (corrected):** it is **not** `.git/index.lock`. The write path is
  `auths-storage`'s `GitRegistryBackend` (`crates/auths-storage/src/git/adapter.rs`), a
  **deliberately single-writer** backend: every registry write calls
  `AdvisoryLock::acquire` — an **exclusive `registry.lock`** (`fs2::lock_exclusive`,
  blocking) — held **across** the git2 commit + a CAS on a **single** ref
  `REGISTRY_REF = refs/auths/registry` (a packed sharded *tree*, not per-DID refs). The
  `auths` CLI (init/auth/kel/org) writes through it, and `wrap` onboarding delegates via the
  CLI. Concurrent delegations block on the exclusive lock while the holder does its slow
  signed commit — hence the timeouts. The backend's own doc says so: *"This backend assumes
  a single-writer model … if you need retry/rebase semantics, you're drifting into
  multi-writer complexity that requires a different design."*
- **Fix (this is a design choice, not a bug):** decide whether high-fanout **concurrent
  onboarding** is a goal. If yes: (a) use the **`backend-postgres`** backend that already
  exists in `auths-storage` (row-level concurrency + real transactions — no global lock);
  (b) **batch** N delegations into one lock acquisition (the packed single-ref tree is built
  for exactly this); or (c) **shard into separate registries** per tenant/shard (what the
  harness did). Today a *shared-root* fleet can only be stood up **serially**.
- **Decision plan:** `docs/plans/storage/registry-backend-decision.md` — whether/where to
  adopt the `backend-postgres` registry backend (it is a **stub** today), and why it plugs in
  at the `RegistryBackend` port (`auths-cli` / `auths-api`), **not** the gateway.

### 7. No metrics/tracing on the payment path
- **Observed:** this study had to instrument entirely from the outside (latency, spend-log
  re-derivation, `ps` sampling) because there is nothing inside.
- **Mechanism:** `auths_telemetry::init_prometheus()` exists but is never called by the
  gateway; observability is `eprintln!` verdict lines only. No `/metrics`, no spans.
- **Fix:** wire `tracing` spans + `metrics!` counters around `PerCallGate::judge`/`settle`,
  `chain.sign_call`, `SettledCounter::settle`, and the treasury `answer()`; expose
  `/metrics`. You cannot tune what you cannot see.

---

## What already works well — keep these

- **Cryptographic correctness is unconditional.** 256/256 and 10/10 signed logs re-derived
  `consistent` under thrash. The hash-chained spend log + offline `verify-spend` are the
  right design and they held.
- **In-process SSHSIG signing is fast** once armed (~2 ms warm). The machinery exists; it
  just needs to be the default.
- **No leaks / no decay.** The 45 s soak held a flat 3,416 calls/s with flat RSS (~660 MB)
  and p99 12 ms — steady-state behavior is clean.
- **Bursts drain gracefully.** A 1,024-call spike drains in 256 ms with max latency 250 ms;
  only the first cold burst is slow. The system absorbs spikes well once warm.

---

## Not yet measured — identity storage (`auths-id/src/storage`)

This study stresses the **payment path**; it does **not** benchmark identity storage, which
sits on the **onboarding / resolve** path, not the per-call metered path. Reading the code,
that module is already well-shaped for concurrency: git2 **object** writes (blob → tree →
commit + **per-DID** refs `refs/did/keri/<prefix>/kel`, no working tree, no `.git/index.lock`,
no subprocess) plus a SQLite read index (`.auths-index.db`). None of the measured walls live
here — the subprocess-git `index.lock` cost is in the gateway's `chain.rs` (#5/#6), not here.

**TODO — add a `storage-bench` scenario** before drawing any storage conclusion. Drive
`KeriGitStorage::{store_event, read_kel_history}` and the SQLite `update_index`,
single-threaded and concurrent, to measure:
- write throughput under **high-fanout onboarding** (thousands of delegations/s);
- the SQLite index **single-writer** serialization on concurrent `update_index` upserts;
- `read_kel_history` cost at resolve time as KELs grow.

Only then is a storage change (e.g. sharded writes via the existing `registry/shard.rs`)
evidence-based rather than speculative. As of this run, nothing in the transaction data
points at identity storage as a bottleneck.

## Projection to 100,000 tx/s (modeled, not measured)

| Stage | calls/s | What changes |
|---|---:|---|
| Measured peak (today) | 3,964 | real system, one node |
| + group-commit durability | 6,038 | amortize per-call rename/append → 1 fsync per batch (#2) |
| + in-process transport & signing | 51,151 | drop the stdio hop (#1); crypto now binds — **per-node ceiling** |
| **Internet scale** | **100,000** | **shard ×2 nodes** at the per-node ceiling |

Two single-node rewrites — **group-commit durability** and **in-process transport** — lift
one node from ~4k to the ~51k crypto ceiling. Reaching 100k then needs only **~2 sharded
nodes** (each carrying independent agents / spend logs, coordinated by a sharded treasury
per #4). The identity/crypto core scales; the durable-append + stdio transport is what has
to change first.

---

## Reproduce

| Step | Command |
|---|---|
| Build gateway | `cargo build --release -p auths-mcp-gateway` (in `../auths`) |
| Full study | `node run.mjs` |
| One scenario | `node run.mjs microbench` (or `ramp-solo`, `ramp-fleet`, `soak`, `burst`) |
| Fast smoke | `node run.mjs --quick` |

All figures are re-derivable from the signed spend logs via `auths-mcp-gateway verify-spend`.
