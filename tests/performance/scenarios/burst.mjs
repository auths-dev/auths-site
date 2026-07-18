// burst.mjs — HFT-style spike response. From idle, fire a burst of B calls all at once
// (no pacing) across a small warmed fleet, and measure how long the system takes to DRAIN
// the burst and what the tail latency does. Repeats for growing B. Models bursty market
// activity: the question is not steady-state rate but "how bad is the tail when everything
// arrives at once, and does drain time stay linear in burst size or blow up?"

import { makeLab, spawnAgents, paidCall, verifySpend } from '../lib/fleet.mjs';
import { Recorder } from '../lib/metrics.mjs';

const now = () => Number(process.hrtime.bigint()) / 1e6;

export async function runBurst({
  fleetSize = 10, bursts = [32, 64, 128, 256, 512], settleSecs = 1, log = console.log,
}) {
  const lab = makeLab('burst');
  log(`  spawning ${fleetSize} agents…`);
  const { agents, failures } = await spawnAgents(lab, { n: fleetSize });
  log(`  ${agents.length}/${fleetSize} up${failures ? ` (${failures} failed)` : ''}; warming…`);
  if (agents.length === 0) throw new Error(`no agents came up (${failures} failed)`);
  await Promise.all(agents.map((a) => paidCall(a.mcp)));

  const results = [];
  for (const B of bursts) {
    const rec = new Recorder();
    // Distribute B calls round-robin across the warmed agents, dispatch ALL at once.
    const t0 = now();
    await Promise.all(Array.from({ length: B }, (_, i) => {
      const a = agents[i % agents.length];
      return paidCall(a.mcp).then((r) => rec.record(r.latencyMs, r.verdict));
    }));
    const drainMs = now() - t0;
    const s = rec.summary();
    results.push({
      burst: B, drain_ms: drainMs, effective_cps: (B / drainMs) * 1000, summary: s,
    });
    log(`  burst=${String(B).padStart(4)}  drain=${drainMs.toFixed(0).padStart(6)}ms  `
      + `${((B / drainMs) * 1000).toFixed(0).padStart(6)} calls/s  `
      + `p50=${s.latency_ms.p50?.toFixed(0)}ms p99=${s.latency_ms.p99?.toFixed(0)}ms max=${s.latency_ms.max?.toFixed(0)}ms`);
    await new Promise((r) => setTimeout(r, settleSecs * 1000));  // return to idle between bursts
  }

  for (const a of agents) a.mcp.kill();
  await new Promise((r) => setTimeout(r, 800));
  const verify = verifySpend(agents);

  return { scenario: 'burst', fleet_size: agents.length, bursts: results, verify };
}
