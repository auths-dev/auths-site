#!/usr/bin/env bash
# MC-5 (A2.2): the metered-amount-required refusal embeds an example tools/call carrying amount_atomic.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
f="$auths/crates/auths-mcp-gateway/src/proxy.rs"
[ -n "$TRAP_FIXTURE" ] && f="$TRAP_FIXTURE/proxy.rs"
[ -f "$f" ] || broken "proxy.rs missing"
grep -q 'MeteredAmountRequired' "$f" || broken "refusal site moved out of proxy.rs — update the probe"
grep -qF '\"amount_atomic\"' "$f" || red "refusal-lacks-embedded-example oracle=escaped amount_atomic JSON in the message"
green "refusal teaches the amount_atomic example"
