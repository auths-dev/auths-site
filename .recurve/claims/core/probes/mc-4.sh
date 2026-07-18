#!/usr/bin/env bash
# MC-4 (A2.1): a declined x402 facilitator settle surfaces the facilitator's own
# errorReason in the thrown error, never a bare HTTP status alone (source claim;
# the behavioral proof is the adapter's own test suite, run by the mcp sculpt gate).
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
f="$root/../auths-mcp/examples/payments/adapters/x402-adapter/settle.mjs"
[ -n "$TRAP_FIXTURE" ] && f="$TRAP_FIXTURE/settle.mjs"
[ -f "$f" ] || broken "x402-adapter settle.mjs missing (auths-mcp checkout absent)"
grep -q 'errorReason' "$f" || red "settle-error-omits-errorReason oracle=facilitator reason text in error"
green "facilitator errorReason surfaced"
