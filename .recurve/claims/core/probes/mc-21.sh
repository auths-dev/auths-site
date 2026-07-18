#!/usr/bin/env bash
# MC-21 (M-S1): the market schema gains billing_accounts, fleets, settlements keyed to the root, every fee row citing its log_hash.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
mig="$root/apps/market/supabase/migrations"
[ -n "$TRAP_FIXTURE" ] && mig="$TRAP_FIXTURE/migrations"
[ -d "$mig" ] || broken "migrations dir missing"
grep -rq 'billing_accounts' "$mig" || red "no-billing_accounts oracle=billing schema"
grep -rq 'fleets' "$mig" || red "no-fleets oracle=billing schema"
f=$(grep -rl 'settlements' "$mig" || true)
[ -n "$f" ] || red "no-settlements oracle=billing schema"
grep -q 'log_hash' $f || red "fee-rows-lack-log_hash oracle=every fee row cites its log_hash"
green "billing schema present and re-derivable"
