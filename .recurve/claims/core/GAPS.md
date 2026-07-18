# core — claims & gaps

> **Reader:** a human deciding what this suite promises and what is still
> unproven. Your next action: read §1; every section below it is one claim
> with a stable anchor that a ledger entry `covers`.
>
> The prose here is for humans deciding; `gaps.yaml` is for the loop
> executing. They must never drift — `recurve coverage --gate` fails on a
> section without a ledger entry (an orphan is invisible to the loop and
> therefore never fixed).

## Conventions

- One section per claim, numbered with a stable anchor (`## 3. …` or
  `## T-TOKEN — …`). The anchor never changes once a ledger entry covers it.
- A claim that's a piece of a larger goal too big for one cycle sets
  `covers_claim: [<parent id>]` on its ledger entry (`.recurve/RUN.md`
  §DECOMPOSE) — the claim-to-claim DAG edge a later cycle walks to discharge
  the parent once every child closes. Distinct from `covers` above (prose ↔
  ledger anchor linkage, not a claim-to-claim edge).
- Every claim names its **observable** ("user can X and sees Y"), never its
  implementation ("uses library Z").
- Every claim states its **negative space**: what a wrong input does
  ("…and a tampered W is rejected with a distinct error").
- Sections map to the closed class enum via this table when the fit isn't
  obvious; new domains document their mapping here, never new classes.
- A closed claim's section is rewritten to describe the new reality and its
  heading gains "(CLOSED)". An adjudicated fork records "Adjudicated: …" in
  the section the decision touched.
- A retired claim leaves a tombstone: "Retired <date>: superseded by X."

<!-- First claim template — copy out of this comment, de-indent, number, and
     fill in. A real `## N.` heading becomes a coverage obligation:
     `recurve coverage --gate` fails until a ledger entry covers it. That is
     the point.

    ## 1. <claim title: the observable, not the implementation>

    What the user/consumer can observe today: <quote actual output, dated>.

    What this suite claims should happen: <the observable>.

    And the negative space: <what a wrong/tampered/absent input must do>.

    Smallest fix: <the minimal honest change that closes this>.
-->

## 1. Both market plans are closed, proven, and fleet-guarded

What is observable today: `docs/plans/market/merchant-loop-improvements.md`
carries 14 open [ready] items (probe output 2026-07-18: `ready-items-remaining=14
oracle=0`), `tests/e2e/fleet-throughput.mjs` does not exist, and the suite
harness runs only the merchant-loop test. The goal (docs/PRD.md, admitted
41/41): every ready item in both market plans closed on the `merchant-close`
branches, a headless-fleet throughput test (8+ delegated agents, one shared
cap refused fleet-wide with the exact `usage-cap-exceeded` string, calls/sec
and p50/p95 reported, 20 cps floor, logs re-deriving `consistent`) present and
wired into this suite's harness so the gate itself runs it. Negative space: a
plan with any [ready] marker left, a missing fleet test, or a fleet test not
wired into the gate keeps this claim RED — and the trap fixture (a plan copy
with [ready] markers) must always evaluate RED. Too big for one cycle by
construction: cycles decompose it via `covers_claim: [MC-1]` per the PRD's
epics, sculpt-first (auths contract changes land in the auths sculpt, then the
target consumes them, then docs).
