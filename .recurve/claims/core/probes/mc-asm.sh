#!/usr/bin/env bash
# MC-ASM: the decomposition of MC-1 is SUFFICIENT — every live [ready] item in
# the merchant plan is claimed by some child (covers_claim: MC-1), and the
# scaling fixes (P3.2-P3.5), the monetization epics (M-A1/M-A2/M-S1/M-S2), and
# the fleet-throughput test all have children. A GREEN here mechanically proves
# "the sub-claims imply MC-1's goal" before any child is individually proven.
source "$(dirname "$0")/_contract.sh"
root="$(cd "$(dirname "$0")/../../../.." && pwd)"
claims="$root/.recurve/claims/core"
plan="$root/docs/plans/market/merchant-loop-improvements.md"
if [ -n "$TRAP_FIXTURE" ]; then
  plan="$TRAP_FIXTURE/merchant-loop-improvements.md"
  claims="$TRAP_FIXTURE"
fi
[ -f "$plan" ] || broken "plan doc missing at $plan"
out=$(python3 - "$plan" "$claims" <<'PY'
import re, sys, os
plan, claims = sys.argv[1], sys.argv[2]
ready = set(re.findall(r'\*\*([ASP]\d+\.\d+) \[ready\]', open(plan).read()))
titles = []
for f in ('gaps.yaml', 'gaps.draft.yaml'):
    p = os.path.join(claims, f)
    if not os.path.exists(p):
        continue
    for e in re.split(r'\n- id: ', '\n' + open(p).read())[1:]:
        eid = e.split('\n', 1)[0].strip()
        if eid in ('MC-1', 'MC-ASM'):
            continue
        m = re.search(r'title: (.+)', e)
        if m and re.search(r'covers_claim:[^\n]*MC-1|covers_claim:\s*\n\s*- MC-1', e):
            titles.append(m.group(1))
union = ' | '.join(titles)
missing = sorted(i for i in ready if i not in union)
need = [t for t in ('P3.2', 'P3.3', 'P3.4', 'P3.5', 'M-A1', 'M-A2', 'M-S1', 'M-S2',
                    'fleet-throughput') if t not in union]
if missing:
    print('uncovered-ready-items=' + ','.join(missing)); sys.exit(1)
if need:
    print('uncovered-goal-areas=' + ','.join(need)); sys.exit(1)
if len(titles) < 5:
    print('children=%d oracle=a-real-decomposition' % len(titles)); sys.exit(1)
print('children=%d cover %d ready items + scaling + monetization + fleet'
      % (len(titles), len(ready)))
PY
) || red "insufficient cut: $out"
green "assembly holds: $out"
