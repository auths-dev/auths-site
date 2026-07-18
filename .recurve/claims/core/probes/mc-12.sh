#!/usr/bin/env bash
# MC-12 (P3.3): the receipts worker checkpoints log_hash + verified length and re-verifies only the suffix.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
f="$root/apps/market/src/lib/receipts-worker.ts"; mig="$root/apps/market/supabase/migrations"
if [ -n "$TRAP_FIXTURE" ]; then f="$TRAP_FIXTURE/receipts-worker.ts"; mig="$TRAP_FIXTURE/migrations"; fi
[ -f "$f" ] || broken "receipts-worker.ts missing"
grep -q 'verified_len' "$f" || red "no-checkpoint-use oracle=verified_len suffix re-verify"
grep -rq 'verified_len' "$mig" || red "no-checkpoint-schema oracle=log_hash+verified_len columns"
green "incremental re-verification checkpointed"
