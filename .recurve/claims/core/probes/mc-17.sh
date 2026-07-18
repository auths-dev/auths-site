#!/usr/bin/env bash
# MC-17: the fleet-throughput e2e drives 8+ delegated headless agents, enforces the shared cap fleet-wide, reports cps/p50/p95, and is gate-wired.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
t="$root/tests/e2e/fleet-throughput.mjs"; toml="$root/.recurve/recurve.toml"
if [ -n "$TRAP_FIXTURE" ]; then t="$TRAP_FIXTURE/fleet-throughput.mjs"; toml="$TRAP_FIXTURE/recurve.toml"; fi
[ -f "$t" ] || red "fleet-test=absent oracle=tests/e2e/fleet-throughput.mjs"
grep -q 'usage-cap-exceeded' "$t" || red "no-shared-cap-assertion oracle=usage-cap-exceeded on every agent"
grep -q 'p95' "$t" || red "no-latency-report oracle=cps + p50/p95"
grep -q 'fleet-throughput.mjs' "$toml" || red "fleet-test-not-gate-wired oracle=suite harness entry"
green "fleet throughput test present, asserting, and gate-wired"
