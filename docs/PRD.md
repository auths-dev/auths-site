# PRD — Close the Merchant-Loop Improvement Plan (ready items)

Source of truth: `docs/plans/market/merchant-loop-improvements.md`. This PRD carves that plan's ready items into a gateable goal across three trees: the target (`auths-site`, branch `agent-native-auth`), the `auths` sculpt (branch `pivot/close-374-262-registry-kel-transports`), and the `docs` sculpt (branch `main`). Items marked decide in the plan stay untouched, as do releases (A3.1, S4.1, S4.2) — those belong to the owner.

Goal in one sentence: close every ready item of the merchant-loop improvement plan — one-command seller publishing, an unambiguous listing contract, receipts that keep pace with growth, actionable failure surfaces, and the completed agent API — with the full merchant-loop test staying green end to end.

## Requirements — auths sculpt tree

- `auths-mcp export-spend-bundle --live-dir <dir> --out <out>` must write `spend.jsonl` plus an `audit.json` naming `registry_git_url`, `agent`, and `root`, and must leave the registry working files committed.
- Running `verify-spend` on a freshly exported, untampered bundle must print the line `consistent — N call(s), $X re-derived from signed costs`.
- A wrap on a HOME with no gitconfig and no `GIT_AUTHOR_NAME` env must build its signing chain without the git auto-detect email failure.
- A declined x402 facilitator settle must surface the facilitator `errorReason` text in the error, never a bare HTTP status alone.
- The `metered-amount-required` refusal message must include an example `tools/call` carrying `amount_atomic`.
- Spend logs must rotate by period under `spend-log/<delegation>/`, and `verify-spend` over a rotated multi-file log must print the `consistent` line.
- `authenticatePresentation` must run off the Node event loop as an async napi export.

## Requirements — target (auths-site)

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

## Requirements — the gate itself

- `node tests/e2e/full-merchant-loop.mjs` must exit 0 after every closed epic, with new capabilities adding checks and never removing one.
- The market checks (`check-market.mjs`, `eslint src`, `tsc --noEmit`, `next build`) must pass after every closed epic.
- Every closed plan item must be flipped to fixed status in `docs/plans/market/merchant-loop-improvements.md`, naming its closing commit.
- The loop must never resolve a decide item, must never merge to `main` in auths or auths-site, and must never weaken a fail-closed path (missing-addon 503, mandatory budget, refusal burns its challenge).
- The docs sculpt must change a page only when a shipped change altered documented behavior, and `check-docs.mjs --no-external` must pass after any docs change.

## Approach shape

Sculpt-first where a contract changes: the auths items land first, the sculpt rebuild refreshes the CLI plus the napi addon the target consumes, then the target work that consumes the new contract, then docs. The merchant-loop test runs after every slice; plan statuses flip in the same commit as the closing change. Pushes go to the existing branches named above with `--no-verify`; anything blocked gets parked with a note in the plan rather than guessed at.
