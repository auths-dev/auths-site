# decompose-mc1 — outcome

MC-1 (both market plans closed, proven, fleet-guarded) was too big for one
cycle. Move B: decomposed RED-first into 21 children + the MC-ASM assembly.

- MC-ASM (sufficiency) went RED (13 uncovered ready items enumerated) before
  any child existed, GREEN the moment the drafted children covered every live
  [ready] item, P3.2–P3.5, M-A1/M-A2/M-S1/M-S2, and the fleet test. Its trap
  (a phantom A9.9 [ready] no child covers) stays RED. Baseline promoted it
  closed as the mechanical proof the cut is sufficient.
- All 21 children armed RED with per-child traps (current known-bad copies or
  stub binaries); every trap verified RED before baseline.
- mc-11 was sharpened after arming GREEN prematurely: the real known-bads are
  `new Date()` run-day bucketing and `rail_split: {}` hardcoded empty.
- Sculpt rebuild extended with `-p auths-mcp-gateway` (child probes observe
  the built gateway binary).
- Gate after baseline: holding 23, regressions 0, broken 0, GATE OK,
  federated (auths + docs sculpt gates OK).

MC-1 stays OPEN; it discharges when every child closes and MC-ASM composes
them. Known wall queued: MC-4's honest fix lives in ../auths-mcp, outside the
declared sculpt trees — park candidate.
