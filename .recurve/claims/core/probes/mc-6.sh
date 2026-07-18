#!/usr/bin/env bash
# MC-6 (P3.2): spend logs rotate by period under spend-log/<delegation>/ and the
# shared reader walks every period file in order (source claim; the behavioral
# proof is verify-spend over a rotated log in both e2e harnesses).
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
w="$root/../auths/crates/auths-mcp-gateway/src/spend_log.rs"
r="$root/../auths/crates/auths-mcp-core/src/audit.rs"
if [ -n "$TRAP_FIXTURE" ]; then w="$TRAP_FIXTURE/spend_log.rs"; r="$TRAP_FIXTURE/audit.rs"; fi
[ -f "$w" ] && [ -f "$r" ] || broken "spend log sources missing"
grep -q 'spend_log_period_path' "$w" || red "writer-not-rotating oracle=period-named files under spend-log/<delegation>/"
grep -q 'read_dir' "$r" || red "reader-single-file oracle=sorted multi-file walk"
grep -qiE 'period' "$r" || red "no-period-layout oracle=spend_log_period_path"
green "spend log rotates by period; reader walks all files"
