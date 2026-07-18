# Auths MCP — Maximum Throughput Study

A local, hermetic load study that drives the **real Auths payment path** —
`gate → sign → verify → reserve → settle → hash-chained spend-log append` — as hard
as the machine allows, to answer one question:

> **Can the Auths enforcement path scale to internet scale (100,000 tx/s)? If not, what
> is the wall, and what has to change in the `auths` architecture to move it?**

It is a sibling of `tests/e2e/fleet-throughput.mjs` (which proves a fleet under one root
and one cap at throughput), scaled into a proper study with a ramp sweep, a soak, burst
storms, a primitive-level micro-benchmark, an interactive HTML dashboard, and a written
`FINDINGS.md`.

Everything runs **locally and hermetically** — no chain, no network, no marketplace, no
Supabase. The x402 settle is the recorded testnet fixture (`--test-mode`), so thousands of
transactions/second are repeatable and free. The target under study is the **auths**
machinery, not the Base network. (There is no on-chain leg here by design — see the note at
the bottom.)

## Quick start

| Step | Command |
|---|---|
| Build the gateway (release) | `cargo build --release -p auths-mcp-gateway` (in `../auths`) |
| Full study (writes report) | `node run.mjs` |
| Fast smoke of the harness | `node run.mjs --quick` |
| One scenario only | `node run.mjs soak` (or `ramp-solo`, `ramp-fleet`, `burst`, `microbench`) |
| View the dashboard | open `report.html` in a browser |

Node 20+ is required; the study auto-detects cores/RAM. The run prints a live summary and
writes `results/<timestamp>.json` (ground truth) plus `report.html` (the dashboard). No
flags spend money or touch a network.

## What each scenario measures

| Scenario | Drives | The question it answers |
|---|---|---|
| `microbench` | Node's own ed25519 + fs, single-core and across all cores | Which per-call primitive is the wall — crypto (parallelizes) or durable writes (serialize)? |
| `ramp-solo` | 1→N agents, each its own budget, **no** treasury | How does the per-process path scale? Where is the throughput **knee**? |
| `ramp-fleet` | 1→N agents under **one** treasury cap | What does fleet coordination cost? (`fleet − solo` isolates the treasury lock + TCP round-trip.) |
| `soak` | one concurrency pinned for a fixed duration | Any drift, leak, or spend-log-append decay under sustained load? |
| `burst` | idle → spike of B calls → drain, for growing B | HFT-style spikes: does drain time stay linear, or does the tail blow up? |

## How the throughput number is produced

Each transaction is one MCP `tools/call` of `paid_call` through a `wrap` gateway process
over the hermetic x402 adapter. Real parallelism = **many processes** (a `wrap` is stdio,
one agent per process). Every agent gets its **own** isolated registry + keychain + root so
a fleet provisions in parallel; in `ramp-fleet` a `treasury serve` coordinator still enforces
one shared cap across all of them over TCP.

After each run, every agent's signed spend log is re-derived offline with `verify-spend` —
the harness asserts the hash-chained log stays **`consistent`** even at peak concurrency, so
the throughput numbers are backed by cryptographic ground truth, not self-reported counters.

## Layout

| Path | What |
|---|---|
| `run.mjs` | Orchestrator + CLI (scenarios run sequentially, each owns the machine) |
| `lib/env.mjs` | Path resolution + the headless env recipe that **arms in-process signing** |
| `lib/mcp.mjs` | MCP wire (JSON-RPC over stdio) + treasury TCP RPC |
| `lib/fleet.mjs` | Spawn / warm / drive / verify / teardown a fleet |
| `lib/metrics.mjs` | Latency reservoir, throughput tape, resource sampler, bounded pool |
| `lib/report.mjs` | Renders the self-contained HTML dashboard (dataviz-validated charts) |
| `scenarios/*.mjs` | `ramp`, `soak`, `burst`, `microbench` |
| `results/*.json` | Raw metrics per run (ground truth) |
| `report.html` | Generated dashboard — theme-aware, hover charts, table views |
| `FINDINGS.md` | Measured bottlenecks → concrete `auths` architecture recommendations |

## Tuning

| Env / flag | Effect |
|---|---|
| `--quick` | Tiny levels / short durations (harness smoke, ~2 min) |
| `GATEWAY_BIN` | Override the gateway binary (default: `../auths/target/release/auths-mcp-gateway`) |
| `AUTHS_CLI` | Override the `auths` CLI (default: `../auths/target/release/auths`) |
| `X402_ADAPTER` | Override the downstream adapter |

The critical env is set for you in `lib/env.mjs`: a **file keychain + `AUTHS_PASSPHRASE`**,
which arms the fast in-process SSHSIG signing path. Without it, every brokered call falls
back to the multi-second git-subprocess signing ceremony (that cost is measured as the
"cold first call" in the report).

## Why no on-chain leg

An earlier draft included a small base-sepolia sanity run. It was cut on purpose: HFT-scale
throughput cannot be exercised against a real chain (~1 block / 2 s, RPC rate limits, one
nonce per sender), and it would measure the Base network rather than **auths**. This study
is intentionally local so the numbers isolate the enforcement path. The existing
`tests/e2e/live-onchain-fleet.mjs` covers the real-settlement proof.
