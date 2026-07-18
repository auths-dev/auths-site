# Sculpting cycle: async-rp

> One cycle, finished and proven. The cycle is done when every probe below is
> GREEN and `recurve matrix --gate` is green across ALL suites — not just the
> ones that motivated the change.

## Gaps this cycle closes

| gap | suite | severity | class | probe |
| --- | --- | --- | --- | --- |
| MC-7 | core | feature | friction | `mc-7.sh` |

## Smallest fixes (the SCULPT scope — keep it minimal, type-driven)

- **MC-7** — Make the napi export pub async fn using spawn_blocking around the verification; regenerate index.d.ts + lib/native.ts shadow.

## What gets stronger (the REBUILD payoff)

- **MC-7** unlocks: (state what gets stronger when this closes)

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
  ● MC-7        GREEN    closed               authenticatePresentation is async off the event loop

holding 1 · ready_to_close 0 · regressions 0 · broken 0 · stale 0 · skipped 0 · missing 0
traps: 1/1 counterexamples still RED
GATE OK
```
