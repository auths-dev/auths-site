# PRD — Close Both Market Plans, Overnight, With Solid Work

Sources of truth: `docs/plans/market/merchant-loop-improvements.md` (every ready item in Part 1 and Part 2, plus the P3.1–P3.5 scaling fixes) and `docs/plans/market/monetization.md` (the buildable epics, external-credential legs env-gated). Three trees, one fresh branch each, already created: the target `auths-site` on `merchant-close`, the `auths` sculpt on `merchant-close`, the `docs` sculpt on `merchant-close`. The goal is finished, working slices — not breadth for its own sake.

Goal in one sentence: work both market plans end to end — publishing, listing contract, receipts scale, agent API, channels, fleet treasury, billing surfaces — proven by the merchant-loop test and a new headless-fleet throughput test, on quality that honors the auths engineering standards.

## Requirements — process and quality

- All work must land on the existing `merchant-close` branch of each repo; the loop must never merge to `main` and must never create another branch.
- Commits must stay small, one commit per subtask, pushed with `--no-verify` to the `merchant-close` branches.
- Every auths change must follow `auths/CLAUDE.md`: typed thiserror errors, doc comments with Args and Usage, no unwrap or expect outside tests, collapsed if-chains, clock injection.
- A design question must be answered by an empirical test weighing throughput against correctness, and parked with a note in the plan doc only when truly blocked.
- Every closed plan item must be flipped to fixed status in its plan doc, naming the closing commit.
- The morning report must name what shipped, what parked and why, and the final result of both e2e tests.

## Requirements — merchant-loop plan, auths sculpt

- `auths-mcp export-spend-bundle --live-dir <dir> --out <out>` must write `spend.jsonl` plus an `audit.json` naming `registry_git_url`, `agent`, and `root`, and must leave the registry working files committed.
- Running `verify-spend` on a freshly exported, untampered bundle must print the line `consistent — N call(s), $X re-derived from signed costs`.
- A wrap on a HOME with no gitconfig and no `GIT_AUTHOR_NAME` env must build its signing chain without the git auto-detect email failure.
- A declined x402 facilitator settle must surface the facilitator `errorReason` text in the error, never a bare HTTP status alone.
- The `metered-amount-required` refusal message must include an example `tools/call` carrying `amount_atomic`.
- Spend logs must rotate by period under `spend-log/<delegation>/`, and `verify-spend` over a rotated multi-file log must print the `consistent` line.
- `authenticatePresentation` must run off the Node event loop as an async napi export.

## Requirements — merchant-loop plan, target

- The market must reject agent login evidence larger than 64 KB with a typed 401 before any verification runs.
- `parseListingInput` must refuse an `endpointValue` containing `@auths-dev/mcp wrap`, telling the seller to list the bare MCP server command.
- The `demo-echo` seed listing must carry a raw downstream command with no embedded wrap.
- `GET /api/v1/endpoints/<slug>` must include an `example_call` whose arguments carry `amount_atomic` derived from `price_cents`.
- The MCP directory server's `get_integration` tool must return the same `example_call` field.
- `receipt_summaries` must bucket calls and cents by each spend-log record's own UTC day, one row per day with activity.
- `rail_split` must be populated from the records' rails whenever settled calls exist.
- The receipts worker must checkpoint `log_hash` and verified length per listing, and must re-verify only the suffix while the stored prefix hash is unchanged.
- The receipts worker must fetch only `refs/auths/*` and the published branch with a blob filter, and a fetch failure must mark `receipts_invalid` with a stated reason.
- `mcp/market-directory.mjs` must expose `create_listing` and `my_listings` tools that drive the challenge, presentation, and POST flow end to end.
- `POST /api/v1/me/listings` must return the presented agent's listings with `status`, `fail_reason`, `verified_at`, and `live_proven_at`.
- The sell page must show the four-command agent recipe with test-mode before live-mode and every command runnable as pasted.

## Requirements — monetization plan

- `auths-mcp channel open` must record a funded reservation (capacity, rail, escrow reference) that the gateway meters against with zero rail touches per call.
- `auths-mcp channel close` must settle the netted total in one rail action and emit a settlement record the receipts worker reads.
- A treasury coordinator must enforce one cap across N gateway processes via a reserve call, and an unreachable coordinator must fail closed to the local, smaller budget.
- The coordinator must sign periodic `{fleet, count, cumulative}` checkpoints that `verify-spend` can cross-check.
- The market schema must gain `billing_accounts`, `fleets`, and `settlements` keyed to the root identity, with every fee row citing the `log_hash` it was computed from.
- The fleet dashboard must render delegations, the one treasury cap with headroom, and channel states, from re-derived figures only.
- Org member management in the dashboard must read members from the org identity history, never from a mirror table alone.
- Rail-touching legs (Stripe Connect onboarding, live x402 escrow) must be env-gated and must skip with a stated reason when credentials are absent, never faked.

## Requirements — the fleet throughput test

- A new `tests/e2e/fleet-throughput.mjs` must run at least 8 headless agents delegated under one root, driving concurrent metered test-mode calls through real gateways.
- The fleet test must enforce one shared cap: an aggregate spend that crosses it must be refused with `usage-cap-exceeded` on every agent, not just one.
- The fleet test must report aggregate calls per second and p50 and p95 per-call latency, and must fail below 20 aggregate calls per second.
- After the run, the combined spend logs must re-derive with the `consistent` line and the re-derived total must equal the sum the test observed.

## Requirements — the gate itself

- `node tests/e2e/full-merchant-loop.mjs` must exit 0 after every closed epic, with new capabilities adding checks and never removing one.
- The market checks (`check-market.mjs`, `eslint src`, `tsc --noEmit`, `next build`) must pass after every closed epic.
- The docs sculpt must change a page only when a shipped change altered documented behavior, and `check-docs.mjs --no-external` must pass after any docs change.
- The loop must never resolve the three parked open questions (prober wallet custody, release-gate home, challenge-table cron) and must never weaken a fail-closed path.

## Approach shape

Sculpt-first where a contract changes: auths items land first, the sculpt rebuild refreshes the CLI plus the napi addon the target consumes, then the target work, then docs. Monetization builds on the merchant-loop items (channels need rotated logs and the exported bundle; the fleet test needs the coordinator), so sequence merchant-loop epics before their monetization dependents. The merchant-loop test runs after every slice; the fleet test gates the treasury and channel work. Anything truly blocked gets parked with a plan note, and finished beats broad.
