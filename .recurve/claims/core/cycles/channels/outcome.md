# channels — outcome

MC-19 closed. `channel open` (capacity reservation, deterministic id, env-gated
escrow posture with stated reasons) + `channel close` (netted min(cumulative,
capacity) from the signed log, settlement record citing log_hash + calls,
double-close refused). Domain shapes + netted math + log_hash in
auths-mcp-core::channel (unit-tested); file I/O + CLI in the gateway. Smoke:
open→close→double-close all observed, incl. the empty-log SHA-256 constant.
Custody-never honored: no held balances anywhere; rail actions live in the
non-custodial legs keyed to the emitted evidence. Gate OK federated (traps 3/3).
