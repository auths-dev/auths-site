# core — claims & gaps

> **Reader:** a human deciding what this suite promises and what is still
> unproven. Your next action: read §1; every section below it is one claim
> with a stable anchor that a ledger entry `covers`.
>
> The prose here is for humans deciding; `gaps.yaml` is for the loop
> executing. They must never drift — `recurve coverage --gate` fails on a
> section without a ledger entry (an orphan is invisible to the loop and
> therefore never fixed).

## Conventions

- One section per claim, numbered with a stable anchor (`## 3. …` or
  `## T-TOKEN — …`). The anchor never changes once a ledger entry covers it.
- A claim that's a piece of a larger goal too big for one cycle sets
  `covers_claim: [<parent id>]` on its ledger entry (`.recurve/RUN.md`
  §DECOMPOSE) — the claim-to-claim DAG edge a later cycle walks to discharge
  the parent once every child closes. Distinct from `covers` above (prose ↔
  ledger anchor linkage, not a claim-to-claim edge).
- Every claim names its **observable** ("user can X and sees Y"), never its
  implementation ("uses library Z").
- Every claim states its **negative space**: what a wrong input does
  ("…and a tampered W is rejected with a distinct error").
- Sections map to the closed class enum via this table when the fit isn't
  obvious; new domains document their mapping here, never new classes.
- A closed claim's section is rewritten to describe the new reality and its
  heading gains "(CLOSED)". An adjudicated fork records "Adjudicated: …" in
  the section the decision touched.
- A retired claim leaves a tombstone: "Retired <date>: superseded by X."

<!-- First claim template — copy out of this comment, de-indent, number, and
     fill in. A real `## N.` heading becomes a coverage obligation:
     `recurve coverage --gate` fails until a ledger entry covers it. That is
     the point.

    ## 1. <claim title: the observable, not the implementation>

    What the user/consumer can observe today: <quote actual output, dated>.

    What this suite claims should happen: <the observable>.

    And the negative space: <what a wrong/tampered/absent input must do>.

    Smallest fix: <the minimal honest change that closes this>.
-->

## 1. Both market plans are closed, proven, and fleet-guarded

What is observable today: `docs/plans/market/merchant-loop-improvements.md`
carries 14 open [ready] items (probe output 2026-07-18: `ready-items-remaining=14
oracle=0`), `tests/e2e/fleet-throughput.mjs` does not exist, and the suite
harness runs only the merchant-loop test. The goal (docs/PRD.md, admitted
41/41): every ready item in both market plans closed on the `merchant-close`
branches, a headless-fleet throughput test (8+ delegated agents, one shared
cap refused fleet-wide with the exact `usage-cap-exceeded` string, calls/sec
and p50/p95 reported, 20 cps floor, logs re-deriving `consistent`) present and
wired into this suite's harness so the gate itself runs it. Negative space: a
plan with any [ready] marker left, a missing fleet test, or a fleet test not
wired into the gate keeps this claim RED — and the trap fixture (a plan copy
with [ready] markers) must always evaluate RED. Too big for one cycle by
construction: cycles decompose it via `covers_claim: [MC-1]` per the PRD's
epics, sculpt-first (auths contract changes land in the auths sculpt, then the
target consumes them, then docs).


## MC-2 — A1.1 export-spend-bundle emits spend.jsonl plus audit.json and leaves the registry committed (CLOSED)

Closed 2026-07-18. `auths-mcp export-spend-bundle --live-dir --agent --root
--registry-url --out` flattens the delegation's (rotated) spend log into one
validated `spend.jsonl`, writes `audit.json` naming `registry_git_url`, `agent`,
and `root`, and commits the registry working files — one command, verifier-ready.
The merchant loop publishes through it (19 checks) and the worker re-derives
`consistent` from the exported bundle.

And the negative space: a corrupt log line aborts the export (fail-closed), and a
clean registry tree exports without error.

## MC-3 — A1.3 the gateway injects its own git identity on clean machines (CLOSED)

Closed 2026-07-18. Every chain subprocess (git and the auths CLI) receives a
default `GIT_AUTHOR_NAME/EMAIL` + `GIT_COMMITTER_NAME/EMAIL` identity
(`auths-mcp-gateway <gateway@auths.local>`) whenever the machine provides none —
caller-provided env always wins. A wrap on a HOME with no gitconfig and no GIT_*
env builds its signing chain and answers `initialize` (reproduced before, green
after).

And the negative space: an operator-supplied identity is never overridden.

## MC-4 — A2.1 a declined x402 settle surfaces the facilitator errorReason

What this suite claims should happen: A declined x402 facilitator settle surfaces the facilitator's `errorReason` text in the adapter's error.

And the negative space: A bare HTTP status alone is never the whole error. NOTE: the honest fix lives in ../auths-mcp, outside the declared sculpt trees — park unless sanctioned.

## MC-5 — A2.2 the metered-amount-required refusal teaches an amount_atomic tools/call (CLOSED)

Closed 2026-07-18. The `metered-amount-required` refusal now carries, inside the
error a buyer reads, a runnable example `tools/call` for the refused tool with
`"amount_atomic": 30000` (USDC 6-decimals, $0.03) plus the
`_auths_reserve_ceiling_cents` raw-cent alternative — self-correction without
docs. The refusal still fails closed: refused, signed, persisted.

And the negative space: every other verdict keeps its terse code-first error.

## MC-6 — P3.2 spend logs rotate by period under spend-log/<delegation>/ and verify across files (CLOSED)

Closed 2026-07-18. The writer appends to `spend-log/<delegation>/<YYYY-MM>.jsonl`
(the record's OWN timestamp names the period); the shared reader accepts a file or
a rotated directory, walking period files in sorted order into one record stream.
`verify-spend --log <delegation-dir>` re-derives `consistent` across files —
proven by the fleet e2e (8 rotated logs, 21 checks) and the merchant loop.

And the negative space: a missing middle period breaks the `Auths-Prev` chain and
re-derivation reports it — rotation never weakens tamper evidence.

## MC-7 — P3.5 authenticatePresentation runs async off the Node event loop (CLOSED)

Closed 2026-07-18. `authenticatePresentation` is `pub async fn` (a Promise on the
JS side); the CPU-bound KEL replay + signature verification runs inside
`tokio::task::spawn_blocking`, off the Node event loop. Wire parse, binding and
nonce checks stay synchronous ahead of it. `index.d.ts` regenerated
(`Promise<NapiAgentAuthReport>`); the market adapter awaits it.

And the negative space: denial semantics are unchanged — same kebab denial codes,
same verdicts; only the scheduling moved.

## MC-8 — P3.5 agent-login evidence over 64 KB is refused with a typed 401 (CLOSED)

Closed 2026-07-18. `authenticateAgent` sizes the serialized evidence FIRST —
before nonce consumption, before any verification — and refuses anything over
64 KB with the typed 401 `evidence-too-large`. The sized string is the same one
handed to the verifier, so nothing is serialized twice.

And the negative space: an unauthenticated caller cannot make the market do
unbounded verification work, and the bound never consumes a challenge.

## MC-9 — S1.1 endpointValue is the raw downstream command and demo-echo is seeded bare (CLOSED)

Closed 2026-07-18. `parseListingInput` refuses any `endpointValue` embedding the
wrap launcher (`@auths-dev/mcp wrap`, `auths-mcp wrap`, `auths-mcp-gateway wrap`)
with an error that teaches the convention: list the bare downstream command — the
prober and every buyer run their own wrap, so a nested gateway meters nothing.
Both listing doors (sell wizard, agent API) share this one rulebook; the
`demo-echo` seed already carries the raw command.

And the negative space: a wrapped endpoint never reaches the prober.

## MC-10 — S1.2 endpoint detail and get_integration return example_call with amount_atomic (CLOSED)

Closed 2026-07-18. `GET /api/v1/endpoints/<slug>` now includes
`integration.example_call` — a runnable `tools/call` for the listing's first tool
whose arguments carry `amount_atomic = price_cents × 10_000` (USDC 6-decimals,
plus the network for x402). `get_integration` returns the same integration object
and names `example_call` in its tool contract.

And the negative space: the example prices from the LISTING, never a hardcoded
number, so a buyer pasting it is not refused for shape.

## MC-11 — S2.3 receipt summaries bucket by record day and populate rail_split (CLOSED)

Closed 2026-07-18. After the log re-derives `consistent`, the worker walks the
verified records and buckets by each receipt's OWN UTC day (`at`), one row per day
with activity: `calls`, `cents_settled` (cumulative deltas), and `rail_split`
populated from each settled record's rail. The breakdown replaces the listing's
rows wholesale each run — re-derived, never accreted — and a per-day sum that
diverges from verify-spend's total marks the listing invalid with a stated reason.

And the negative space: the run day never masquerades as the activity day, and an
unverified log writes no rows at all.

## MC-12 — P3.3 the receipts worker checkpoints log_hash and re-verifies only the suffix (CLOSED)

Closed 2026-07-18. The auditor gained a RESUMED entrypoint (`AuditResume`:
prior records, final binding, settled cents — state the caller's own earlier
audit proved); `verify-spend` exposes it (`--resume-index/--resume-binding/
--resume-cents`) and prints a machine-readable `checkpoint:` line. The worker
stores that end-state per listing (`receipt_checkpoints`, applied live) and, when
the fetched log's prefix bytes still hash to the stored `log_hash`, re-verifies
only the suffix. The merchant loop (20 checks) proves a second pass resumes and
stays consistent.

And the negative space: any prefix mutation misses the hash and forces a full
re-verification — the shortcut skips only work the worker itself proved, never
trust in the operator; suffix signatures and the `Auths-Prev` link to the stored
binding are still fully verified.

## MC-13 — P3.4 the worker fetches only refs/auths/* and the published branch with a blob filter (CLOSED)

Closed 2026-07-18. The worker fetches ONLY `refs/auths/*` plus `refs/heads/*`
(the published branch) — never the remote's whole refspace — attempting
`--filter=blob:none` first and falling back to the same bounded refspecs
unfiltered for remotes that cannot serve partial fetches (dumb HTTP): the
boundedness comes from the refspecs either way. A fetch failure surfaces as
`receipts_invalid` with the stated derivation error.

And the negative space: `refs/*:refs/*` never returns, and a fetch failure is
never silently green.

## MC-14 — S3.1 the MCP directory gains create_listing and my_listings write tools (CLOSED)

Closed 2026-07-18. `market-directory.mjs` gains `create_listing` and
`my_listings`: each mints a server challenge, presents the named `market:sell`
credential through the agent's own auths CLI (`credential present
--with-evidence` — the directory never touches key material), and drives the
authenticated POST. Refusals surface the server's typed denial codes verbatim.

And the negative space: no credential SAID, no writes — the tools are inert
without the agent's own signer.

## MC-15 — S3.2 POST /api/v1/me/listings returns the presented agent listings (CLOSED)

Closed 2026-07-18. `POST /api/v1/me/listings` authenticates the presentation
(same challenge → present flow as every agent write) and returns only the
presented seller's rows: `slug`, `name`, `status`, `fail_reason`, `verified_at`,
`live_proven_at`, `receipts_invalid`. Proven in the merchant loop (now 18
checks): the seller lists, then reads its listing back.

And the negative space: another agent's listings never return, and a failed
authentication gets the standard 401/403 doctrine.

## MC-16 — S3.3 the sell page shows the runnable agent recipe, test-mode first (CLOSED)

Closed 2026-07-18. /sell gained section 04 — "Agents list here too": the
four-command recipe (init → issue the `market:sell` credential to yourself →
mint a single-use challenge → present with evidence), every command runnable as
pasted (values flow via shell substitution, no placeholders), plus the MCP
alternative (`create_listing` / `my_listings` on the directory server). The
page-wide test-mode-before-live rule and the paste lint both hold
(check-market clean, 37 files).

## MC-17 — the fleet-throughput e2e proves 8+ agents under one shared cap at 20+ calls/s (CLOSED)

Closed 2026-07-18. `tests/e2e/fleet-throughput.mjs` (gate-wired in the suite harness)
runs 8 headless agents delegated under ONE shared root registry (the gateway's
fleet-join: `AUTHS_MCP_AGENT_LABEL` reuses an existing org root and adds its own
delegation), each behind its own real gateway wrap over the x402 adapter, metering
$0.01 test-mode micro-calls against one $1.00 treasury cap. Measured: 53.7 calls/s
aggregate (bar: 20), p50 133 ms, p95 269 ms after a disclosed one-call-per-agent
warmup. Every agent is refused `usage-cap-exceeded` once the fleet cap exhausts —
exactly at the cap, never past it. All 8 signed logs re-derive `consistent`; the
re-derived sum equals the observed total, equals the coordinator's settled counter,
and the signed checkpoint trail cross-checks via
`verify-spend --treasury-checkpoints --expect-cumulative`.

The throughput came from in-process per-call signing (`inproc_sign.rs`): the first
call of each kind still runs the full subprocess ceremony and is harvested as a
byte-template; later calls build + SSHSIG-sign the same commit shape in memory
(seconds → ~133 ms/call). The offline audit re-verifies every record from both
paths through the same verifier.

And the negative space: a below-bar run fails, a single-agent-only refusal fails,
a re-derived total diverging from observation fails, and a tampered or rolled-back
checkpoint trail fails the cross-check.

## MC-18 — A3.1 A3.2 S4.2 plan bookkeeping: owner-release tags and the release-gate runbook

What this suite claims should happen: The merchant plan carries zero `[ready]` markers: release-scoped items (A3.1, S4.2) are tagged `owner-release`, the A3.2 release-gate runbook is written without deciding its parked home, and the legend describes the final vocabulary.

And the negative space: No item is silently dropped — every flip names its closing commit or its owner.

## MC-19 — M-A1 channel open records a funded reservation and channel close settles netted (CLOSED)

Closed 2026-07-18. `auths-mcp-gateway channel open --seller --capacity --rail
--live-dir` records the capacity reservation (deterministic channel id, escrow
reference, KEL-adjacent seller binding) the gateway meters against with zero rail
touches per call — the signed spend log IS the channel state. `channel close
--channel --log` re-derives the streamed cumulative from the signed log, nets it
to `min(cumulative, capacity)`, and emits a settlement record citing the exact
`log_hash` (SHA-256 of the log bytes) plus the call count — the evidence one rail
action settles and the receipts worker re-derives. Double-close is refused.

Rail legs are env-gated with stated reasons, never faked (custody-never): absent
credentials record an explicit `unfunded:<rail>:credentials-absent` posture
("seller-bounded credit, settle at close"); present credentials still route the
hold/capture through the non-custodial leg (Stripe Connect direct charges on the
seller's account, or the x402 channel contract) keyed to the settlement evidence.

And the negative space: closing an unknown or already-settled channel fails with a
distinct error, and streamed spend beyond the reserved capacity never settles.

## MC-20 — M-A2 a treasury coordinator enforces one fleet cap and signs checkpoints (CLOSED)

Closed 2026-07-18. `auths-mcp-gateway treasury serve --listen --fleet --cap --state-dir`
holds the ONE fleet counter: `reserve(delegation, cents) → granted|refused` over a
newline-JSON TCP wire (`TREASURY_URL=tcp://host:port`), commit-on-grant, persisted
atomically so restarts resume the high-water. Every wrapped gateway pre-authorizes
each metered call there BEFORE its local budget; a fleet refusal is
`usage-cap-exceeded` before any rail touch, and an unreachable coordinator degrades
to the local (smaller) budget — fail-closed to the tighter cap, never open. The
coordinator signs periodic `{fleet, count, cumulative}` checkpoints (P-256 over
canonical JSON) that `verify-spend --treasury-checkpoints [--treasury-pubkey]
[--expect-cumulative]` re-verifies: signature, one stable signer, monotonicity, and
the re-derived total.

And the negative space: a tampered checkpoint line fails its signature, a rolled-back
trail is refused, a changed signer is refused, and a cumulative that disagrees with
the caller's re-derived fleet sum exits non-zero.

## MC-21 — M-S1 billing_accounts, fleets, settlements keyed to the root with log_hash-cited fees (CLOSED)

Closed 2026-07-18. Migration `20260718000003_billing.sql` (applied live):
`billing_accounts` keyed to the root identity (with a pre-root seller fallback,
one subject required), `fleets` (org root, delegation count, the ONE cap,
coordinator URL), `settlements` (channel_ref, rail, gross/fee cents, and a
NOT-NULL `log_hash` — every fee row cites the exact bytes it was computed
from), `usage_rollups` per period. Service-role only.

## MC-22 — M-S2 the fleet dashboard renders re-derived figures and KEL-read members (CLOSED)

Closed 2026-07-18. `/fleet` renders: the one treasury cap with headroom
computed from re-derived settlements (never gateway-reported), channel states
(settled channels with their cited log_hash; open channels stated as
gateway-side until close), and the member view built from KEL-verified
presentations — each subject proved key control and `auths_root` is the
verifier-surfaced delegator chain, never a mirror table alone.

## MC-ASM — the decomposition of MC-1 covers every ready item, the scaling fixes, monetization, and the fleet test

What this suite claims should happen: Mechanical sufficiency of the MC-1 decomposition: every live `[ready]` item ID in the merchant plan, the scaling fixes P3.2–P3.5, the monetization epics M-A1/M-A2/M-S1/M-S2, and the fleet-throughput test each appear in a child claim covering MC-1.

And the negative space: A plan item no child covers turns this RED — the cut is revised, never forced.
