# treasury-coordinator — outcome

MC-20 closed. The fleet treasury coordinator shipped in the auths sculpt:

- `auths_mcp_core::treasury`: pure FleetLedger (commit-on-grant reserve, monotonic,
  restart-restore), the newline-JSON wire types, the signed checkpoint payload
  (P-256 over canonical JSON), and `verify_checkpoint_trail` (signature, stable
  signer, monotonicity, cumulative cross-check) — unit-tested.
- `auths-mcp-gateway treasury serve`: TCP coordinator, atomic ledger persistence,
  checkpoint trail on a cadence; refuses to serve an over-spent fleet.
- Hot path: `wrap` reserves fleet capacity (TREASURY_URL/TREASURY_FLEET, fleet id
  defaults to the delegator root) BEFORE the local judge; fleet refusal =
  usage-cap-exceeded before any rail touch; unreachable coordinator degrades to the
  local (smaller) budget with a one-time stderr note — fail-closed, never open.
- `verify-spend --treasury-checkpoints [--treasury-pubkey] [--expect-cumulative]`
  cross-checks the trail offline.
- Live smoke: grant→headroom, refuse past cap, status, wrong-fleet error, signed
  checkpoint line, persisted ledger — all observed.

Harness repair discovered mid-cycle (the gate's behavioral harness was red for a
cause unrelated to this claim): the market prober and receipts worker cold-install
the published @auths-dev/mcp (~70 MB) inside every probe's fresh HOME, and tonight
that extraction crawls (minutes). Both now honor AUTHS_MCP_LAUNCHER to pin a local
launcher; the merchant e2e pins it plus GATEWAY_BIN at the freshly built gateway,
kills only LISTENERS on :3002 (it was SIGKILLing itself through its own client
sockets), and exits explicitly. Merchant loop: 17/17 green, exit 0. Market gates
clean (check-market 35 files, eslint, tsc). Full uncached federated gate: GATE OK.
Ledger entries also gained explicit `covers:` anchors (coverage gate now 0 orphans).
