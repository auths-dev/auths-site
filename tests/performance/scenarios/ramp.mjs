// ramp.mjs — the headline scenario: sweep concurrency 1→N and record aggregate throughput
// and latency at each step, so the saturation KNEE is visible. Run in two variants:
//
//   solo   — each agent carries its own local budget, NO treasury. Measures how the
//            per-process path (gate → sign → verify → per-call fs writes → adapter) scales.
//   fleet  — all agents share ONE treasury cap. Adds a TCP round-trip under a fleet-wide
//            global mutex per call. The fleet−solo delta ISOLATES the treasury cost.
//
// One fleet is spawned at max size and reused across all levels (agents warmed once, on
// demand). Cold warm-up latencies are captured separately — they are the git-signing
// evidence. Each level is duration-bounded, so wall-clock stays predictable regardless of N.

import { makeLab, startTreasury, spawnAgents, paidCall, verifySpend } from '../lib/fleet.mjs';
import { Recorder, ResourceSampler, pool } from '../lib/metrics.mjs';

const now = () => Number(process.hrtime.bigint()) / 1e6;

export async function runRamp({
  variant = 'solo',
  levels = [1, 2, 4, 8, 16, 32, 64, 128, 256],
  levelSecs = 5,
  treasuryPort = 7861,
  log = console.log,
}) {
  const maxAgents = Math.max(...levels);
  const lab = makeLab(`ramp-${variant}`);
  let treasury = null;
  if (variant === 'fleet') {
    treasury = await startTreasury({
      port: treasuryPort, fleetId: `ramp-fleet-${treasuryPort}`,
      capCents: 100_000_000, stateDir: `${lab.lab}/treasury`, checkpointSecs: 5,
    });
    log(`  treasury coordinator up on :${treasuryPort}`);
  }

  log(`  spawning up to ${maxAgents} agents (${variant})…`);
  const spawn0 = now();
  const { agents, failures } = await spawnAgents(lab, { n: maxAgents, treasury });
  log(`  ${agents.length}/${maxAgents} agents up in ${((now() - spawn0) / 1000).toFixed(1)}s`
    + (failures ? ` (${failures} failed to spawn — a real process-per-agent ceiling)` : ''));
  if (agents.length === 0) throw new Error(`no agents came up (${failures} failed)`);

  const sampler = new ResourceSampler(() => agents.map((a) => a.mcp.child.pid), 500);
  sampler.start();

  const effective = levels.filter((k) => k <= agents.length);
  if (agents.length && !effective.includes(agents.length)) effective.push(agents.length);
  effective.sort((a, b) => a - b);

  const cold = new Recorder();
  let warmed = 0;
  const perLevel = [];

  for (const k of effective) {
    // Warm the newly-included agents once (cold path — pays the git-signing ceremony).
    if (k > warmed) {
      const fresh = agents.slice(warmed, k);
      log(`  warming agents ${warmed + 1}..${k} (cold signing ceremony)…`);
      await pool(fresh, 24, async (a) => {
        const c = await paidCall(a.mcp);
        cold.record(c.latencyMs, c.verdict);
      });
      warmed = k;
    }

    // Measure: k agents each fire warm calls in a loop until the level deadline.
    const rec = new Recorder();
    const deadline = now() + levelSecs * 1000;
    const start = now();
    await Promise.all(agents.slice(0, k).map(async (a) => {
      while (now() < deadline) {
        const r = await paidCall(a.mcp);
        rec.record(r.latencyMs, r.verdict);
      }
    }));
    const secs = (now() - start) / 1000;
    const s = rec.summary();
    const cps = s.calls / secs;
    perLevel.push({ concurrency: k, secs, cps, ...s });
    log(`  k=${String(k).padStart(3)}  ${cps.toFixed(0).padStart(6)} calls/s   `
      + `p50=${s.latency_ms.p50?.toFixed(1)}ms p95=${s.latency_ms.p95?.toFixed(1)}ms `
      + `p99=${s.latency_ms.p99?.toFixed(1)}ms  (${s.calls} calls${s.verdicts.error ? `, ${s.verdicts.error} err` : ''})`);
  }

  sampler.stop();
  for (const a of agents) a.mcp.kill();
  await new Promise((r) => setTimeout(r, 800));
  const verify = verifySpend(agents);
  log(`  verify-spend: ${verify.consistent}/${verify.logs} logs consistent, `
    + `${verify.rederivedCalls} calls re-derived ($${(verify.rederivedCents / 100).toFixed(2)})`);

  const peak = perLevel.reduce((m, l) => (l.cps > m.cps ? l : m), perLevel[0]);
  return {
    scenario: 'ramp', variant,
    requested_max: maxAgents, actual_max: agents.length, spawn_failures: failures,
    cold: cold.summary(),
    levels: perLevel,
    peak: { concurrency: peak.concurrency, cps: peak.cps },
    resources: sampler.samples,
    verify,
  };
}
