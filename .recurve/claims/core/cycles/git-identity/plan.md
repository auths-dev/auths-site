# Sculpting cycle: git-identity

> One cycle, finished and proven. The cycle is done when every probe below is
> GREEN and `recurve matrix --gate` is green across ALL suites — not just the
> ones that motivated the change.

## Gaps this cycle closes

| gap | suite | severity | class | probe |
| --- | --- | --- | --- | --- |
| MC-3 | core | feature | broken-route | `mc-3.sh` |

## Smallest fixes (the SCULPT scope — keep it minimal, type-driven)

- **MC-3** — Set GIT_AUTHOR_NAME/EMAIL + GIT_COMMITTER_NAME/EMAIL (agent-derived) on every git invocation in chain.rs so wraps on a HOME with no gitconfig build their signing chain.

## What gets stronger (the REBUILD payoff)

- **MC-3** unlocks: (state what gets stronger when this closes)

## Definition of done (the GATE)

- [ ] Every gap probe above flips RED → GREEN (`recurve probe --gap <id>`).
- [ ] `recurve matrix --gate` green across all suites: zero regressions, zero broken.
- [ ] Each touched suite's harness green.
- [ ] Tree changes satisfy the quality constitution (parse-don't-validate,
      ports/adapters, one source of truth); build/lint/tests clean; no suppressions.
- [ ] `gaps.yaml` statuses promoted open→closed; `GAPS.md` prose updated to
      describe the NEW reality (the gap becomes a feature note).
- [ ] Anything discovered mid-cycle that can't be closed is filed as a NEW gap
      with its own RED probe (the loop never silently drops scope).

## Matrix baseline (captured at cycle start)

```
    gap         outcome   status     Δ        detail
  ● MC-3        GREEN    closed               gateway sets its own git identity

holding 1 · ready_to_close 0 · regressions 0 · broken 0 · stale 0 · skipped 0 · missing 0
traps: 1/1 counterexamples still RED
GATE OK
```
