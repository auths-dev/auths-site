#!/bin/sh
# Fails if site copy references CLI commands, package names, or claims that
# no longer exist in auths. Mirrors `cargo xtask check-command-drift` in the
# auths repo at grep cost. Add a pattern here whenever a rename bites us.
set -eu

cd "$(dirname "$0")/.."

if MATCHES=$(grep -rEn \
  -e 'auths ci setup' \
  -e 'auths id init' \
  -e 'auths id create' \
  -e 'auths id attest' \
  -e 'auths git setup' \
  -e 'auths verify-commit' \
  -e 'auths trust add' \
  -e '--device-key-alias' \
  -e 'auths-base/tap' \
  -e '@auths/(wasm|verifier|sdk|express)' \
  -e 'public\.auths\.dev' \
  apps/web/src apps/web/content \
  --include='*.ts' --include='*.tsx' --include='*.mdx' --include='*.md' \
  2>/dev/null); then
  echo "$MATCHES"
  echo "CLI drift check FAILED — fix the stale references above." >&2
  exit 1
fi

echo "CLI drift check passed."
