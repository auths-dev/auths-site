# fleet-throughput — outcome

MC-17 closed: tests/e2e/fleet-throughput.mjs, gate-wired. 21 checks green, exit 0:
8 agents / one root / one $1 cap / 53.7 cps (bar 20) / p50 133ms p95 269ms /
fleet-wide usage-cap-exceeded / all logs consistent / checkpoint trail cross-checked.

Two real gateway defects surfaced and fixed in the sculpt on the way:
1. Fleet join — Chain::build now reuses an existing org root and takes
   AUTHS_MCP_AGENT_LABEL so N wraps delegate under ONE root (was: every wrap
   minted its own root).
2. Per-call work-repo collisions — work dirs are now namespaced per delegation
   (was: 8 gateways raced git init in the same call-0 dir).
And the throughput wall itself: per-call subprocess signing (git ceremony +
Argon2id keychain reopen per sign, ~5s/call measured) replaced by in-process
session signing (inproc_sign.rs) — first call per kind harvests the exact
subprocess-signed shape as a template, later calls sign in memory. verify-spend
re-derives every record from both paths consistent; the fidelity check is the
verifier itself.
