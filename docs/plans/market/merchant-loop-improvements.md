# Merchant-Loop Improvements — What the E2E Taught Us

**Source:** `tests/e2e/full-merchant-loop.mjs` (17 checks green, 2026-07-18) — the first
run of the complete create → verify → sell → buy → settle loop with no human anywhere.
Every finding below was hit live, not speculated. Split by repo; each epic has subtasks
with a plain-English description and a concrete code idea; open questions are flagged
where a task needs an owner decision first.

Status codes: **[fixed: repo@sha]** closed by the named commit · **[owner-release]** waits on an owner-run release ·
**[decide]** blocked on an open question.

You will be working in auths, so you must read this first:
/Users/bordumb/workspace/repositories/auths-base/auths/CLAUDE.md

---

## Part 1 — `auths` (SDK / gateway / CLI)

### Epic A1: One-command seller publishing

Publishing a spend bundle today takes internals knowledge no agent should need: find
the gateway's live dir, derive the agent DID *from a spend-log filename*, run `id show`
against the registry for the root, know the budget counter is an uncommitted working
file that must be committed or verification fails `budget-mismatch`, then hand-write
`audit.json`. This is the exact gap `--with-evidence` closed for presentations —
close it the same way.

- **A1.1 [fixed: auths@12d3f338] `export-spend-bundle` one-shot.** One command emits everything a
  relying party's `verify-spend` needs, correctly, every time:

  ```
  auths-mcp export-spend-bundle --live-dir "$AUTHS_MCP_LIVE_DIR" --out ./published/
  # → published/spend.jsonl
  # → published/audit.json        {"registry_git_url": …, "agent": …, "root": …}
  # → registry working files committed (budget counter included), ready to clone
  ```

  Implementation sketch: the gateway already knows all three identifiers
  (`chain.org_repo()`, `chain.agent_did`, `chain.root_did` — the replay path prints
  them as `audit-cmd`); this is the same data written to disk plus a
  `git add -A && git commit` on the org repo. Lives beside `verify-spend` in
  `auths-mcp-gateway/src/main.rs`.

- **A1.2 [decided 2026-07-18] The budget counter stays a file.** The durable
  cross-rail counter lives at `<registry>/budget-ledger/<agent>` as a working file;
  `export-spend-bundle` (A1.1) commits a snapshot of it at publish time, making the
  commit step the documented contract. Resolved by the scaling analysis (P3.1 and its
  Redis note): refs-based storage pays blob+tree+commit+ref per settled call and grows
  forever, while integrity is carried by the agent-signed running cumulative plus
  eventual external anchoring — never by commit frequency. Nothing blocks A1.1.

- **A1.3 [fixed: auths@86cf30e2] The gateway sets its own git identity.** Chain builds die on clean
  machines ("unable to auto-detect email address") — precisely the machines autonomous
  agents run on. The prober already solves this with env vars; the gateway should too.
  Note: the docs deliberately do NOT document the `GIT_AUTHOR_NAME`/`GIT_AUTHOR_EMAIL`
  workaround (decided 2026-07-18) — this gets fixed in the gateway, not papered over
  in install instructions, so ship A1.3 before agents hit it in the wild:

  ```rust
  // chain.rs, before shelling git/auths:
  cmd.env("GIT_AUTHOR_NAME", "auths-mcp-gateway")
     .env("GIT_AUTHOR_EMAIL", "gateway@auths.dev")
     .env("GIT_COMMITTER_NAME", "auths-mcp-gateway")
     .env("GIT_COMMITTER_EMAIL", "gateway@auths.dev");
  ```

### Epic A2: Honest, actionable failure surfaces

- **A2.1 [fixed: auths-mcp@7eb9ad5 — owner sanctioned the fourth repo; adapter suite is now a sculpt gate] The x402 adapter surfaces the facilitator's reason.** A live settle
  against an unfunded wallet fails as `x402 facilitator settle failed: HTTP 200` — the
  facilitator's 200-with-`success:false` body carries an `errorReason` that gets
  swallowed. One debugging cycle for me; more for an agent.

  ```js
  // settle.mjs: on !settlement.success
  throw new Error(`x402 facilitator declined (${network}): ${body.errorReason ?? 'no reason given'}`);
  ```

- **A2.2 [fixed: auths@dff1f705] `metered-amount-required` teaches the fix.** A buyer following the
  integration snippet verbatim omits `amount_atomic` and gets a bare refusal. The
  gateway knows exactly what was missing — say it:

  ```
  metered-amount-required — a metered x402 call must carry its intended amount,
  e.g. tools/call { name, arguments: { amount_atomic: 30000 } }  ($0.03)
  ```

### Epic A3: Ship the contract (release train)

- **A3.1 [owner-release: publish @auths-dev/sdk from main — owner action, not loop scope] Release `@auths-dev/sdk` from main after PR #377 merges.** Everything
  the market's agent door needs (relying-party surface, `subjectRoot`,
  `KelUnauthenticated`, conformance vectors) exists only in checkout builds. The npm
  release is the switch that turns production agent sign-in from an honest 503 into a
  live door. Same train releases the CLI binaries (`--with-evidence`) and the gateway.

- **A3.2 [documented: run `node tests/e2e/full-merchant-loop.mjs` and `node tests/e2e/fleet-throughput.mjs` against RC binaries via the `AUTHS_CLI` / `GATEWAY_BIN` / `AUTHS_MCP_LAUNCHER` overrides; where this wiring lives in the release pipeline stays the parked release-gate question] The merchant loop as a release gate.** Every seam this loop crosses
  broke on first live contact (delegated attachments, seal rehydration, registry clone
  semantics, the counter). Run `full-merchant-loop.mjs` against the release candidates
  (local CLI + local addon via `AUTHS_CLI` / `AUTHS_SDK_PATH`) before publishing —
  manual is fine; skipping it is how the seams rot.
  **Open question (non-blocking, later):** does this live in the auths release runbook
  (`just release`) or as an auths-site invocation documented in both places? Until
  decided, running it from either checkout works — the loop takes `AUTHS_CLI` /
  `AUTHS_SDK_PATH` overrides precisely so release candidates can be pointed at it.

---

## Part 2 — `auths-site` (the market)

### Epic S1: The listing contract, unambiguous

- **S1.1 [fixed: auths-site@041b13b] One `endpointValue` convention: the RAW downstream command.** Two
  conventions exist in the wild today — the seed listing embeds a full
  `npx -y @auths-dev/mcp wrap …` command while the e2e lists the bare server. The
  prober wraps whatever it is given (wrap-of-wrap works but double-spawns), and the
  integration builder assumes raw. Pick raw; enforce gently:

  ```ts
  // listing-input.ts
  if (endpointValue.includes('@auths-dev/mcp wrap')) {
    return { ok: false, error:
      'List the bare MCP server command — buyers and the prober add their own wrap (and budget).' };
  }
  ```

  Plus: reseed `demo-echo`'s endpoint to the raw form, and say the rule on /sell.

- **S1.2 [fixed: auths-site@98026b0] `get_integration` includes one example metered call.** The snippet
  gets a buyer connected but not paying; the first `tools/call` then fails
  `metered-amount-required`. Extend the integration payload:

  ```ts
  example_call: {
    method: 'tools/call',
    params: { name: firstTool, arguments: { amount_atomic: listing.price_cents * 10_000 } },
    note: 'amount_atomic is USDC at 6 decimals; the gateway meters it against YOUR budget.',
  }
  ```

  (Mirror it in the MCP directory server's `get_integration` tool and the /sell docs.)

### Epic S2: Receipts and probe depth

- **S2.1 [fixed] Registry fetch semantics.** The worker now does
  `git init` + `fetch refs/*` + checkout (a bare clone loses `refs/auths/*` AND the
  counter file), and one listing's derivation error no longer 500s the whole cron.
  Kept here for the record — this was the "receipts worker had never actually succeeded
  against a real registry" finding.

- **S2.2 [decide] Fund the prober's testnet wallet.** The probe's metered-call leg
  (check b) is skipped in production: `PROBER_X402_WALLET_PRIVATE_KEY` is unset. With a
  funded base-sepolia wallet, the platform genuinely becomes every listing's first
  paying customer and the Verified tooltip gets stronger.
  **Open question (non-blocking, later):** who custodies the prober wallet, and is the
  per-probe testnet spend acceptable ops overhead? (Same wallet could serve
  `X402_LIVE=1` e2e runs.) Until decided the metered leg stays honestly soft — probe
  detail records the skip and the Verified tooltip claims only what ran.

- **S2.3 [fixed: auths-site@eef1d60] True day-bucketing for receipt summaries.** v0 writes one all-time
  row per run-day. The spend log's records carry timestamps; bucket them:

  ```ts
  // parse each SpendLogRecord's timestamp → group cents/calls by UTC day,
  // upsert one row per day; log_hash stays the reproducibility anchor.
  ```

  Also populate `rail_split` (currently `{}`) from each record's rail.

### Epic S3: Finish the agent API surface (deferred from #20)

- **S3.1 [fixed: auths-site@9cd0ea1] MCP write tools** (`create_listing`, `my_listings`) in
  `mcp/market-directory.mjs`, driving the same challenge → present → POST flow the e2e
  proves — an agent should sell without ever leaving MCP. The agent side shells
  `auths credential present --with-evidence`; the tool passes header + evidence through.

- **S3.2 [fixed: auths-site@a979fe6] `me/listings` for agents.** Agents currently list blind (no way to see
  their probe status or fail_reason). POST-with-presentation (stateless auth can't ride
  a GET body):

  ```
  POST /api/v1/me/listings   { evidence }  + Auths-Presentation header
  → [{ slug, status, fail_reason, verified_at, live_proven_at }]
  ```

- **S3.3 [fixed: auths-site@e75091f] /sell documents the agent path.** The wizard page gains the
  four-command agent recipe (init → credential issue `market:sell` → challenge →
  present + POST) next to the GitHub flow — test-mode before live, commands runnable
  as pasted, per the copy rules.

### Epic S4: Turn production on

- **S4.1 [ready, after A3.1]** Swap `AUTHS_SDK_PATH` for a real
  `@auths-dev/sdk` dependency in `apps/market/package.json`, redeploy, delete nothing —
  the 503 fail-closed path stays as the honest posture for any load failure.

- **S4.2 [owner-release: needs the released @auths-dev/sdk dependency]** Run `check-verifier-vectors.mjs` in market CI once the dependency is
  real (it skips cleanly today), so a contract-drifting SDK bump fails the build
  instead of the first agent.

- **S4.3 [decide — non-blocking, later] Challenge-table hygiene.** Expired nonces are
  pruned opportunistically on each mint; under zero traffic rows linger.
  **Open question:** good enough (rows are inert — an expired nonce can never consume),
  or add a cleanup to the daily cron? Default posture until decided: leave it.

---

## Part 3 — Scaling & performance notes on the Part-1 changes

Concerns surfaced by thinking each change through at 10³–10⁵ calls and 10²–10³
listings. Two of these should change decisions above.

### P3.1 A1.2 should be decided AGAINST refs-based counters (performance)

The durable counter is written **per settled call**. As a working file that is one
small write. Under `refs/auths/*` it becomes a blob + tree + commit + ref update per
call: at 100 calls/sec that is 100 git commits/sec on the registry, a single
serialized ref (lock contention), and an object store that grows forever because
every historical counter value stays reachable. Git-as-storage is right for
low-frequency identity events; it is the wrong store for a high-frequency monotonic
counter. **Recommendation: close A1.2 as "counter stays a file; `export-spend-bundle`
commits a snapshot of it at publish time"** — the audit only ever needs the counter's
value at verification, not a committed value per call. *(Adopted — A1.2 above is
decided accordingly, 2026-07-18.)*

On "just put Redis in front" (the relay already uses Redis for shared state across
stateless processes): that solves *distribution*, not the write-path model — the
amplification would only move behind a cache and reappear at flush. A Redis
write-back tier with git *checkpoints* (one commit per interval/publish, mirroring
the relay's Memory-vs-Redis store pattern) is a legitimate multi-process design, but
it is an availability answer, not an integrity one: the window since the last
checkpoint is only as tamper-evident as Redis. Integrity is carried by what the
spend log already has — the agent-signed running cumulative per settlement (an
operator cannot forge a lower total without the agent's key) — plus the documented
follow-on of anchoring `{count, cumulative}` outside the operator's control. With
those, per-call durable commits buy almost nothing; never spend write bandwidth on
commit frequency for tamper-evidence.

### P3.2 A1.1 needs spend-log rotation behind it (quadratic re-hash)

`git add` re-hashes a changed file whole. The spend log is one append-only JSONL per
delegation, so committing at publish re-hashes the ENTIRE history every time — O(n)
per publish, O(n²) cumulative. At ~500 B/record, a million settled calls is a ~500 MB
re-hash per publish. Add to A1.1: **rotate logs by period**
(`spend-log/<delegation>/<yyyy-mm>.jsonl`), with the chain's `Auths-Prev` back-link
carrying across file boundaries. Bounded blobs also shrink what the receipts worker
fetches (P3.3).

### P3.3 Re-derive-everything is O(n²) over a listing's lifetime — needs an incremental mode

`verify-spend` re-verifies EVERY record's signatures on EVERY run, and the receipts
worker does that per listing per cron, behind a fresh `npx -y` (cold gateway
download) and a fresh registry fetch each time. Cumulative cost is quadratic in log
length, and on serverless (300 s ceiling) the sequential per-listing loop breaches
the budget somewhere around tens of listings. The honesty model survives an
incremental variant because the log is a hash-chained sequence: **checkpoint
`(log_hash, verified_len, counter_snapshot)` per listing and verify only the suffix
since the last checkpoint**, re-deriving from genesis only when the prefix hash
changes (which is itself a tamper signal). Independently: cache/vendor the gateway
binary in the worker's deployment instead of `npx -y` per run, and bound the
per-listing registry fetch (P3.4).

### P3.4 `registry_git_url` is attacker-sized input

The worker fetches `refs/*` from whatever URL a seller published. A hostile or
merely huge repo makes the worker download gigabytes inside its cron budget. Cap it:
fetch only what verification reads (`refs/auths/*` plus the published branch),
`--filter=blob:none` with a sparse checkout of `budget-ledger/`, and keep the
existing timeouts as hard failures with `receipts_invalid` + a loud reason.

### P3.5 The RP surface is synchronous native work on the event loop

`authenticatePresentation` runs KEL signature validation inside a synchronous napi
call. Honest presentations are ~1 ms (a handful of ECDSA verifies) — but the
contract's generous bounds (1 MiB request, 1024 events per KEL slice, three slices)
let an adversary submit hundreds of milliseconds of signature work per request, and
a sync napi call blocks Node's event loop for all of it: a cheap DoS on the door.
Two-part fix: **mark the napi export async** (`#[napi]` on an async fn → tokio
`spawn_blocking`, off the event loop), and market-side, cap evidence at a realistic
interactive size (real login KELs are a few events; ~64 KB is roomy) plus per-IP
rate limits on `/api/v1/challenge` and the write routes. The verifier's 1 MiB bound
is right for batch/offline surfaces; the login path should not inherit it.

### Non-concerns, for the record

A1.3 (env vars), A2.x (error strings), the conformance sync (build-time only), and
the Supabase challenge store (single-row insert/delete per auth; opportunistic
pruning) are all flat-cost and fine at any plausible scale.
