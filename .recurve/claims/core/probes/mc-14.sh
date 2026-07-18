#!/usr/bin/env bash
# MC-14 (S3.1): the MCP directory exposes create_listing and my_listings driving the full presented flow.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
m="$root/apps/market/mcp/market-directory.mjs"
[ -n "$TRAP_FIXTURE" ] && m="$TRAP_FIXTURE/market-directory.mjs"
[ -f "$m" ] || broken "market-directory.mjs missing"
grep -q 'create_listing' "$m" || red "create_listing=absent oracle=write tool present"
grep -q 'my_listings' "$m" || red "my_listings=absent oracle=write tool present"
green "MCP write tools present"
