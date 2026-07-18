#!/usr/bin/env bash
# MC-7 (P3.5): authenticatePresentation is an async napi export off the event loop.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
f="$auths/packages/auths-node/src/rp.rs"
[ -n "$TRAP_FIXTURE" ] && f="$TRAP_FIXTURE/rp.rs"
[ -f "$f" ] || broken "rp.rs missing"
grep -qE 'pub async fn authenticate_presentation' "$f" || red "authenticate_presentation=sync oracle=pub async fn"
grep -q 'spawn_blocking' "$f" || red "verification-on-event-loop oracle=spawn_blocking"
green "authenticatePresentation is async off the event loop"
