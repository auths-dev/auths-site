#!/usr/bin/env bash
# MC-2 (A1.1): export-spend-bundle emits a verifier-ready bundle in one shot.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
bin="$auths/target/debug/auths-mcp-gateway"
[ -n "$TRAP_FIXTURE" ] && bin="$TRAP_FIXTURE/auths-mcp-gateway"
[ -x "$bin" ] || broken "gateway binary missing at $bin (run the sculpt rebuild)"
help=$("$bin" export-spend-bundle --help 2>&1) || red "export-spend-bundle-subcommand=absent oracle=present"
echo "$help" | grep -q -- '--live-dir' || red "no --live-dir flag oracle=--live-dir"
echo "$help" | grep -q -- '--out' || red "no --out flag oracle=--out"
green "export-spend-bundle present with --live-dir/--out"
