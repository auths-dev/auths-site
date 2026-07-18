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


## MC-2 — A1.1 export-spend-bundle emits spend.jsonl plus audit.json and leaves the registry committed

What this suite claims should happen: A seller agent runs `auths-mcp export-spend-bundle --live-dir <dir> --out <out>` and gets `spend.jsonl` plus an `audit.json` naming `registry_git_url`, `agent`, and `root`, with the registry working files committed — one command, verifier-ready.

And the negative space: Running `verify-spend` on a fresh, untampered export prints `consistent — N call(s), $X re-derived from signed costs`; a tampered export does not.

## MC-3 — A1.3 the gateway injects its own git identity on clean machines

What this suite claims should happen: A wrap on a HOME with no gitconfig and no GIT_AUTHOR_NAME env still builds its signing chain: the gateway injects an agent-derived git identity into every git invocation.

And the negative space: The old failure — git auto-detect email aborting the chain build — must be impossible on a clean machine.

## MC-4 — A2.1 a declined x402 settle surfaces the facilitator errorReason

What this suite claims should happen: A declined x402 facilitator settle surfaces the facilitator's `errorReason` text in the adapter's error.

And the negative space: A bare HTTP status alone is never the whole error. NOTE: the honest fix lives in ../auths-mcp, outside the declared sculpt trees — park unless sanctioned.

## MC-5 — A2.2 the metered-amount-required refusal teaches an amount_atomic tools/call

What this suite claims should happen: A buyer refused with `metered-amount-required` reads, inside the refusal, an example `tools/call` carrying `amount_atomic` and can self-correct without docs.

And the negative space: The refusal still fails closed: the call is refused, signed, and persisted as a refused record.

## MC-6 — P3.2 spend logs rotate by period under spend-log/<delegation>/ and verify across files

What this suite claims should happen: Spend logs rotate by period under `spend-log/<delegation>/`; `verify-spend` over a rotated multi-file log prints the `consistent` line.

And the negative space: A missing middle file breaks the back-link chain and re-derivation reports it — rotation never weakens tamper evidence.

## MC-7 — P3.5 authenticatePresentation runs async off the Node event loop

What this suite claims should happen: `authenticatePresentation` is an async napi export; verification runs via spawn_blocking off the Node event loop.

And the negative space: Denial semantics are unchanged: same kebab denial codes, same verdicts — only the scheduling moved.

## MC-8 — P3.5 agent-login evidence over 64 KB is refused with a typed 401

What this suite claims should happen: Agent login evidence larger than 64 KB is refused with a typed 401 (`evidence-too-large`) before any parse or verification runs.

And the negative space: An attacker cannot make the market do unbounded work: the bound is checked first, fail-closed.

## MC-9 — S1.1 endpointValue is the raw downstream command and demo-echo is seeded bare

What this suite claims should happen: `parseListingInput` refuses an `endpointValue` containing the wrap launcher and tells the seller to list the bare MCP server command; the `demo-echo` seed carries a raw downstream command.

And the negative space: A wrapped endpoint never reaches the prober — the refusal names the convention instead of half-working.

## MC-10 — S1.2 endpoint detail and get_integration return example_call with amount_atomic

What this suite claims should happen: `GET /api/v1/endpoints/<slug>` includes an `example_call` whose arguments carry `amount_atomic` derived from `price_cents`; the MCP `get_integration` tool returns the same field.

And the negative space: The example must match what the gateway actually accepts — a buyer pasting it is not refused for shape.

## MC-11 — S2.3 receipt summaries bucket by record day and populate rail_split (CLOSED)

Closed 2026-07-18. After the log re-derives `consistent`, the worker walks the
verified records and buckets by each receipt's OWN UTC day (`at`), one row per day
with activity: `calls`, `cents_settled` (cumulative deltas), and `rail_split`
populated from each settled record's rail. The breakdown replaces the listing's
rows wholesale each run — re-derived, never accreted — and a per-day sum that
diverges from verify-spend's total marks the listing invalid with a stated reason.

And the negative space: the run day never masquerades as the activity day, and an
unverified log writes no rows at all.

## MC-12 — P3.3 the receipts worker checkpoints log_hash and re-verifies only the suffix

What this suite claims should happen: The receipts worker checkpoints `log_hash` and verified length per listing and re-verifies only the suffix while the stored prefix hash is unchanged.

And the negative space: A prefix mutation invalidates the checkpoint and forces full re-verification — the shortcut never trusts a changed history.

## MC-13 — P3.4 the worker fetches only refs/auths/* and the published branch with a blob filter

What this suite claims should happen: The receipts worker fetches only `refs/auths/*` and the published branch, with a blob filter.

And the negative space: A fetch failure marks `receipts_invalid` with a stated reason — never silently green.

## MC-14 — S3.1 the MCP directory gains create_listing and my_listings write tools

What this suite claims should happen: `mcp/market-directory.mjs` exposes `create_listing` and `my_listings` tools that drive challenge → presentation → POST end to end.

And the negative space: The tools fail with the server's typed denial codes — no swallowed 401/403.

## MC-15 — S3.2 POST /api/v1/me/listings returns the presented agent listings

What this suite claims should happen: `POST /api/v1/me/listings` authenticates the presentation and returns the caller's listings with `status`, `fail_reason`, `verified_at`, `live_proven_at`.

And the negative space: Another agent's listings are never returned; a failed authentication gets the standard 401/403 doctrine.

## MC-16 — S3.3 the sell page shows the runnable agent recipe, test-mode first

What this suite claims should happen: The sell page shows the four-command agent recipe — issue the `market:sell` credential, mint a challenge, present, create the listing — test-mode before live-mode, every command runnable as pasted.

And the negative space: No command drifts from the real CLI surface (the drift lint owns this).

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

## MC-21 — M-S1 billing_accounts, fleets, settlements keyed to the root with log_hash-cited fees

What this suite claims should happen: The market schema gains `billing_accounts`, `fleets`, and `settlements` keyed to the root identity; every fee row cites the `log_hash` it was computed from.

And the negative space: A fee that cannot be re-derived from its cited log does not render — we bill the way we badge.

## MC-22 — M-S2 the fleet dashboard renders re-derived figures and KEL-read members

What this suite claims should happen: The fleet dashboard renders delegations, the one treasury cap with live headroom, and channel states, all from re-derived figures; org member management reads members from the org identity history.

And the negative space: Gateway-reported numbers never render as settled figures; a mirror table alone never defines membership.

## MC-ASM — the decomposition of MC-1 covers every ready item, the scaling fixes, monetization, and the fleet test

What this suite claims should happen: Mechanical sufficiency of the MC-1 decomposition: every live `[ready]` item ID in the merchant plan, the scaling fixes P3.2–P3.5, the monetization epics M-A1/M-A2/M-S1/M-S2, and the fleet-throughput test each appear in a child claim covering MC-1.

And the negative space: A plan item no child covers turns this RED — the cut is revised, never forced.
