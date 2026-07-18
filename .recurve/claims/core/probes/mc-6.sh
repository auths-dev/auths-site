#!/usr/bin/env bash
# MC-6 (P3.2): spend logs rotate by period under spend-log/<delegation>/ and reads walk every file.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
f="$auths/crates/auths-mcp-gateway/src/spend_log.rs"
[ -n "$TRAP_FIXTURE" ] && f="$TRAP_FIXTURE/spend_log.rs"
[ -f "$f" ] || broken "spend_log.rs missing"
grep -q 'read_dir' "$f" || red "reads-single-file oracle=multi-file read via read_dir"
grep -qiE 'period' "$f" || red "no-period-rotation oracle=period-named log files"
green "spend log rotates by period and reads all files"
