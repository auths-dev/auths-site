#!/usr/bin/env bash
# MC-4 (A2.1): a declined x402 settle surfaces the facilitator errorReason, never a bare status.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
f="$root/../auths-mcp/examples/payments/adapters/x402-adapter/server.mjs"
[ -n "$TRAP_FIXTURE" ] && f="$TRAP_FIXTURE/server.mjs"
[ -f "$f" ] || broken "x402-adapter server.mjs missing (auths-mcp checkout absent)"
grep -q 'errorReason' "$f" || red "settle-error-omits-errorReason oracle=facilitator reason text in error"
green "facilitator errorReason surfaced"
