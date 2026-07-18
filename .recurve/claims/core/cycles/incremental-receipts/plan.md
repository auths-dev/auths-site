# Sculpting cycle: incremental-receipts

> One cycle, finished and proven. The cycle is done when every probe below is
> GREEN and `recurve matrix --gate` is green across ALL suites — not just the
> ones that motivated the change.

## Gaps this cycle closes

| gap | suite | severity | class | probe |
| --- | --- | --- | --- | --- |
| MC-12 | core | feature | missing-surface | `mc-12.sh` |

## Smallest fixes (the SCULPT scope — keep it minimal, type-driven)

- **MC-12** — Store log_hash + verified_len per listing; on unchanged prefix hash re-verify only the suffix; migration adds the checkpoint columns.

## What gets stronger (the REBUILD payoff)

- **MC-12** unlocks: (state what gets stronger when this closes)

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
  ● MC-12       GREEN    closed               incremental re-verification checkpointed

holding 1 · ready_to_close 0 · regressions 0 · broken 0 · stale 0 · skipped 0 · missing 0
traps: 1/1 counterexamples still RED
GATE OK
```
