#!/usr/bin/env bash
# MC-15 (S3.2): POST /api/v1/me/listings returns the presented agents listings with status detail.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
r="$root/apps/market/src/app/api/v1/me/listings/route.ts"
[ -n "$TRAP_FIXTURE" ] && r="$TRAP_FIXTURE/route.ts"
[ -f "$r" ] || red "me/listings-route=absent oracle=apps/market/src/app/api/v1/me/listings/route.ts"
grep -q 'fail_reason' "$r" || red "no-fail_reason oracle=status,fail_reason,verified_at,live_proven_at"
grep -q 'live_proven_at' "$r" || red "no-live_proven_at oracle=status,fail_reason,verified_at,live_proven_at"
green "agents can read their own listings"
