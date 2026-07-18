// soak.mjs — pin one concurrency and hammer for a fixed duration. Reveals what a ramp
// snapshot cannot: throughput/latency DRIFT over time, and the resource curve (RSS/%CPU)
// as the spend-log grows and per-call fs writes accumulate. A steady line ⇒ no leak/decay;
// a downward slope ⇒ the durable-append path degrading under sustained load.

import { makeLab, spawnAgents, paidCall, verifySpend } from '../lib/fleet.mjs';
import { Recorder, ThroughputTape, ResourceSampler } from '../lib/metrics.mjs';

const now = () => Number(process.hrtime.bigint()) / 1e6;

export async function runSoak({ concurrency = 10, durationSecs = 30, log = console.log }) {
  const lab = makeLab('soak');
  log(`  spawning ${concurrency} agents…`);
  const { agents, failures } = await spawnAgents(lab, { n: concurrency });
  log(`  ${agents.length}/${concurrency} up${failures ? ` (${failures} failed)` : ''}; warming…`);
  if (agents.length === 0) throw new Error(`no agents came up (${failures} failed)`);

  const cold = new Recorder();
  await Promise.all(agents.map(async (a) => {
    const c = await paidCall(a.mcp); cold.record(c.latencyMs, c.verdict);
  }));

  const rec = new Recorder();
  const tape = new ThroughputTape(500);
  const sampler = new ResourceSampler(() => agents.map((a) => a.mcp.child.pid), 500);
  sampler.start();

  log(`  soaking ${agents.length}-wide for ${durationSecs}s…`);
  const deadline = now() + durationSecs * 1000;
  await Promise.all(agents.map(async (a) => {
    while (now() < deadline) {
      const r = await paidCall(a.mcp);
      rec.record(r.latencyMs, r.verdict);
      tape.mark();
    }
  }));
  sampler.stop();

  for (const a of agents) a.mcp.kill();
  await new Promise((r) => setTimeout(r, 800));
  const verify = verifySpend(agents);

  const s = rec.summary();
  const series = tape.series();
  const cps = series.length ? series.reduce((a, b) => a + b.cps, 0) / series.length : 0;
  log(`  soak: ${s.calls} calls, mean ${cps.toFixed(0)} calls/s, `
    + `p50=${s.latency_ms.p50?.toFixed(1)}ms p99=${s.latency_ms.p99?.toFixed(1)}ms; `
    + `verify ${verify.consistent}/${verify.logs} consistent`);

  return {
    scenario: 'soak', concurrency: agents.length, duration_secs: durationSecs,
    mean_cps: cps, cold: cold.summary(), summary: s,
    throughput_series: series, histogram: rec.histogram(),
    resources: sampler.samples, verify,
  };
}
