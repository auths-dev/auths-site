#!/usr/bin/env bash
# MC-20 (M-A2): a treasury coordinator enforces one cap across N gateways, fails closed to the local budget, and signs checkpoints.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
g="$auths/crates/auths-mcp-gateway/src"; c="$auths/crates/auths-mcp-core/src"
if [ -n "$TRAP_FIXTURE" ]; then g="$TRAP_FIXTURE/gateway-src"; c="$TRAP_FIXTURE/core-src"; fi
[ -d "$g" ] && [ -d "$c" ] || broken "gateway/core src missing"
grep -rq 'TREASURY_URL' "$g" "$c" || red "no-coordinator-wiring oracle=TREASURY_URL reserve client"
grep -rqE 'fn reserve|reserve\(' "$g" "$c" || red "no-reserve-call oracle=reserve(delegation, cents)"
grep -rqiE 'checkpoint' "$g" "$c" || red "no-signed-checkpoints oracle={fleet,count,cumulative} signed"
green "treasury coordinator wired with reserve + signed checkpoints"
