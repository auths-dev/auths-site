#!/usr/bin/env bash
# MC-13 (P3.4): the worker fetches only refs/auths/* plus the published branch with a blob filter; fetch failure states its reason.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
f="$root/apps/market/src/lib/receipts-worker.ts"
[ -n "$TRAP_FIXTURE" ] && f="$TRAP_FIXTURE/receipts-worker.ts"
[ -f "$f" ] || broken "receipts-worker.ts missing"
grep -q "refs/\*:refs/\*" "$f" && red "broad-fetch oracle=refs/auths/* + published branch only"
grep -q 'refs/auths/' "$f" || red "no-scoped-refspec oracle=refs/auths/*"
grep -q 'blob:none' "$f" || red "no-blob-filter oracle=--filter=blob:none"
grep -q 'receipts_invalid' "$f" || red "fetch-failure-unstated oracle=receipts_invalid with reason"
green "bounded registry fetch with stated failure"
