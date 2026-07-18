#!/usr/bin/env bash
# MC-9 (S1.1): parseListingInput refuses a wrapped endpointValue and the demo-echo seed stays raw.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
li="$root/apps/market/src/lib/listing-input.ts"; seed="$root/apps/market/scripts/seed-demo.mjs"
if [ -n "$TRAP_FIXTURE" ]; then li="$TRAP_FIXTURE/listing-input.ts"; seed="$TRAP_FIXTURE/seed-demo.mjs"; fi
[ -f "$li" ] && [ -f "$seed" ] || broken "listing-input.ts or seed-demo.mjs missing"
grep -q 'mcp wrap' "$li" || red "no-wrap-refusal oracle=endpointValue containing the wrap launcher is refused"
grep -qiE 'bare|raw|downstream' "$li" || red "refusal-does-not-teach oracle=tells seller to list the bare command"
grep -A3 'demo-echo' "$seed" | grep -q 'mcp wrap' && red "seed-embeds-wrap oracle=raw downstream command"
green "raw-downstream convention enforced and seeded"
