#!/usr/bin/env bash
# MC-10 (S1.2): GET /api/v1/endpoints/<slug> and get_integration both return example_call with amount_atomic.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
r="$root/apps/market/src/app/api/v1/endpoints/[slug]/route.ts"; m="$root/apps/market/mcp/market-directory.mjs"
if [ -n "$TRAP_FIXTURE" ]; then r="$TRAP_FIXTURE/route.ts"; m="$TRAP_FIXTURE/market-directory.mjs"; fi
[ -f "$r" ] && [ -f "$m" ] || broken "endpoint route or mcp directory missing"
grep -q 'example_call' "$r" || red "api-lacks-example_call oracle=example_call in endpoint detail"
grep -q 'amount_atomic' "$r" || red "api-example-lacks-amount_atomic oracle=derived from price_cents"
grep -q 'example_call' "$m" || red "mcp-lacks-example_call oracle=same field from get_integration"
green "example_call served by API and MCP directory"
