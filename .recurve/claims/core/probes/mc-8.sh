#!/usr/bin/env bash
# MC-8 (P3.5): agent-login evidence over 64 KB is refused with a typed 401 before verification.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
d="$root/apps/market/src/lib/auth"
[ -n "$TRAP_FIXTURE" ] && d="$TRAP_FIXTURE/auth"
[ -d "$d" ] || broken "auth lib missing"
grep -rqE '64 \* 1024|65536' "$d" || red "no-size-bound oracle=64KB cap before verify"
grep -rq 'evidence-too-large' "$d" || red "no-typed-401 oracle=evidence-too-large denial code"
green "oversized evidence refused with typed 401"
