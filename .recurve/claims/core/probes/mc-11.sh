#!/usr/bin/env bash
# MC-11 (S2.3): receipt summaries bucket by each record's own UTC day (never
# the run day) and rail_split is populated from the records' rails.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
f="$root/apps/market/src/lib/receipts-worker.ts"
[ -n "$TRAP_FIXTURE" ] && f="$TRAP_FIXTURE/receipts-worker.ts"
[ -f "$f" ] || broken "receipts-worker.ts missing"
grep -qE 'new Date\(\)\.toISOString\(\)\.slice\(0, ?10\)' "$f" && red "bucket-by-run-day oracle=each record's own UTC day"
grep -q 'rail_split: {}' "$f" && red "rail_split-hardcoded-empty oracle=rails from records"
grep -qE 'slice\(0, ?10\)|substring\(0, ?10\)' "$f" || red "no-per-record-day oracle=UTC day from each record timestamp"
grep -q 'rail_split' "$f" || red "rail_split-not-populated oracle=rails from records"
green "day bucketing + rail_split derived from records"
