#!/usr/bin/env bash
# MC-1: both market plans are closed and the fleet test guards the result.
# GREEN only when (a) no [ready] item remains in the merchant-loop plan,
# (b) tests/e2e/fleet-throughput.mjs exists, and (c) that test is wired into
# the suite harness so the gate itself runs it. The heavy behavioral proof
# (merchant loop + market checks + fleet run) lives in the HARNESS; this
# probe checks the cheap observables that only an honest finish produces.
source "$(dirname "$0")/_contract.sh"

root="$(cd "$(dirname "$0")/../../../.." && pwd)"
plan="$root/docs/plans/market/merchant-loop-improvements.md"
fleet="$root/tests/e2e/fleet-throughput.mjs"
toml="$root/.recurve/recurve.toml"

if [ -n "$TRAP_FIXTURE" ]; then
  plan="$TRAP_FIXTURE/merchant-loop-improvements.md"
  fleet="$TRAP_FIXTURE/fleet-throughput.mjs"
  toml="$TRAP_FIXTURE/recurve.toml"
fi

[ -f "$plan" ] || broken "plan doc missing at $plan"
ready=$(grep -c '\[ready\]' "$plan" || true)
[ "$ready" -eq 0 ] || red "ready-items-remaining=$ready oracle=0"
[ -f "$fleet" ] || red "fleet-test=absent oracle=tests/e2e/fleet-throughput.mjs"
grep -q 'fleet-throughput.mjs' "$toml" || red "fleet-test-in-harness=no oracle=recurve.toml harness"
green "plans closed, fleet test present and gate-wired"
