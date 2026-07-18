#!/usr/bin/env bash
# MC-3 (A1.3): the gateway injects its own git identity (source claim; behavior proven by the merchant e2e on a clean HOME).
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
f="$auths/crates/auths-mcp-gateway/src/chain.rs"
[ -n "$TRAP_FIXTURE" ] && f="$TRAP_FIXTURE/chain.rs"
[ -f "$f" ] || broken "chain.rs missing"
grep -q 'GIT_AUTHOR_NAME' "$f" || red "no GIT_AUTHOR_NAME injection oracle=env-injected identity"
grep -q 'GIT_COMMITTER_EMAIL' "$f" || red "no GIT_COMMITTER_EMAIL injection oracle=env-injected identity"
green "gateway sets its own git identity"
