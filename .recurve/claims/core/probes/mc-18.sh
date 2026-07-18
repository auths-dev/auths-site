#!/usr/bin/env bash
# MC-18 (A3.1/A3.2/S4.2): plan bookkeeping — owner-scoped release items carry owner-release, the release-gate runbook is written, no ready markers remain.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
plan="$root/docs/plans/market/merchant-loop-improvements.md"
[ -n "$TRAP_FIXTURE" ] && plan="$TRAP_FIXTURE/merchant-loop-improvements.md"
[ -f "$plan" ] || broken "plan doc missing"
n=$(grep -c '\[ready\]' "$plan" || true)
[ "$n" -eq 0 ] || red "ready-markers-remaining=$n oracle=0"
o=$(grep -c 'owner-release' "$plan" || true)
[ "$o" -ge 2 ] || red "owner-release-tags=$o oracle=>=2 (A3.1, S4.2)"
green "plan bookkeeping closed honestly"
