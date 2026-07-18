#!/usr/bin/env bash
# MC-16 (S3.3): the sell page shows the runnable four-command agent recipe, test-mode first.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
d="$root/apps/market/src/app/sell"
[ -n "$TRAP_FIXTURE" ] && d="$TRAP_FIXTURE/sell"
[ -d "$d" ] || broken "sell page missing"
grep -rq 'market:sell' "$d" || red "no-agent-recipe oracle=credential issue with market:sell"
grep -rq 'challenge' "$d" || red "recipe-lacks-challenge oracle=challenge then presentation"
green "sell page documents the agent path"
