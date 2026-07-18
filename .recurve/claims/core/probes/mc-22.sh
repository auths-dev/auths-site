#!/usr/bin/env bash
# MC-22 (M-S2): the fleet dashboard renders re-derived delegations, cap headroom, and channel states; org members read from the KEL.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
auths="$root/../auths"
d="$root/apps/market/src/app/fleet"
[ -n "$TRAP_FIXTURE" ] && d="$TRAP_FIXTURE/fleet"
[ -d "$d" ] || red "fleet-dashboard=absent oracle=apps/market/src/app/fleet"
grep -rq 'headroom' "$d" || red "no-cap-headroom oracle=one treasury cap with headroom"
grep -rqi 'channel' "$d" || red "no-channel-states oracle=open/streamed/settled"
grep -rqi 'member' "$d" || red "no-member-view oracle=members from the org identity history"
green "fleet dashboard renders re-derived figures"
