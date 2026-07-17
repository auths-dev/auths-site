#!/usr/bin/env bash
# Push the GitHub OAuth provider config to the hosted Supabase project.
# Reads GITHUB_OAUTH_CLIENT_ID / GITHUB_OAUTH_CLIENT_SECRET from
# apps/market/.env.local (the owner fills them after creating the OAuth app
# — see the PRD's "Owner setup" section). Run from anywhere.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_REF="xpbzlbwferiodzgphbac"

set -a; source "$HERE/../.env.local"; set +a

if [ -z "${GITHUB_OAUTH_CLIENT_ID:-}" ] || [ -z "${GITHUB_OAUTH_CLIENT_SECRET:-}" ]; then
  echo "GITHUB_OAUTH_CLIENT_ID / GITHUB_OAUTH_CLIENT_SECRET not set in apps/market/.env.local" >&2
  echo "Create the OAuth app first: https://github.com/settings/applications/new" >&2
  exit 1
fi

resolve_token() {
  if [ -n "${SUPABASE_ACCESS_TOKEN:-}" ]; then echo "$SUPABASE_ACCESS_TOKEN"; return; fi
  if [ -f "$HOME/.supabase/access-token" ]; then cat "$HOME/.supabase/access-token"; return; fi
  # macOS: the CLI stores the token in the keychain via go-keyring, which
  # wraps values >~128B as "go-keyring-base64:<b64>".
  raw="$(security find-generic-password -s "Supabase CLI" -w 2>/dev/null || true)"
  case "$raw" in
    go-keyring-base64:*) printf '%s' "${raw#go-keyring-base64:}" | base64 -d ;;
    *) printf '%s' "$raw" ;;
  esac
}
TOKEN="$(resolve_token)"
if [ -z "$TOKEN" ]; then
  echo "No Supabase access token (supabase login, or export SUPABASE_ACCESS_TOKEN)" >&2
  exit 1
fi

curl -sf -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"external_github_enabled\": true,
    \"external_github_client_id\": \"$GITHUB_OAUTH_CLIENT_ID\",
    \"external_github_secret\": \"$GITHUB_OAUTH_CLIENT_SECRET\",
    \"site_url\": \"https://market.auths.dev\",
    \"uri_allow_list\": \"https://market.auths.dev/**,http://localhost:3002/**\"
  }" > /dev/null

echo "GitHub provider configured on $PROJECT_REF (site_url + localhost allow-list included)"
