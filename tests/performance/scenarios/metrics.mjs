// metrics.mjs — dogfood the gateway's new /metrics surface (#7).
//
// Spawn a small fleet with Prometheus /metrics enabled, drive a KNOWN number of calls, then
// scrape each gateway's own counters and prove they equal what the harness actually drove.
// This exercises the exact observability the study previously had to reconstruct from the
// outside — now it comes from inside the gateway, and we verify it is load-bearing, not
// decorative.

import { makeLab, spawnAgents, paidCall, verifySpend } from '../lib/fleet.mjs';
import { pool } from '../lib/metrics.mjs';
import { scrapeMetrics, sumFamily, atLabel } from '../lib/scrape.mjs';

export async function runMetricsDogfood({
  agents = 4, callsPerAgent = 300, metricsBasePort = 9400, log = console.log,
}) {
  const lab = makeLab('metrics');
  log(`  spawning ${agents} agents with /metrics enabled (base :${metricsBasePort})…`);
  const { agents: fleet, failures } = await spawnAgents(lab, { n: agents, metricsBasePort });
  if (fleet.length === 0) throw new Error(`no agents came up (${failures} failed)`);

  // The gateway counts EVERY brokered call, so the harness counts every one it drives —
  // warm-up and measured alike — for an exact cross-check.
  const external = { granted: 0, refused: 0, error: 0 };
  let extLatSum = 0; let extLatN = 0;
  const tally = (r) => { external[r.verdict] += 1; extLatSum += r.latencyMs; extLatN += 1; };
  await pool(fleet, 12, async (a) => tally(await paidCall(a.mcp)));

  log(`  driving ${callsPerAgent} calls/agent…`);
  await Promise.all(fleet.map(async (a) => {
    for (let i = 0; i < callsPerAgent; i += 1) tally(await paidCall(a.mcp));
  }));
  const externalTotal = external.granted + external.refused + external.error;
  const externalMeanMs = extLatN ? extLatSum / extLatN : 0;

  // Scrape each agent's own /metrics and aggregate the gateway-reported counts.
  const STAGES = ['sign', 'gate', 'downstream', 'settle', 'spend_log'];
  const internal = {
    granted: 0, refused: 0, denied: 0, callsTotal: 0, latencyCount: 0,
    signInproc: 0, signSubprocess: 0, settle: 0, scraped: 0,
  };
  const stageSum = {}; const stageCount = {};
  let callSum = 0; let callCount = 0;
  for (const a of fleet) {
    if (!a.metricsPort) continue;
    try {
      const m = await scrapeMetrics(a.metricsPort);
      internal.granted += atLabel(m, 'auths_mcp_calls_total', 'verdict', 'granted');
      internal.refused += atLabel(m, 'auths_mcp_calls_total', 'verdict', 'refused');
      internal.denied += atLabel(m, 'auths_mcp_calls_total', 'verdict', 'denied');
      internal.callsTotal += sumFamily(m, 'auths_mcp_calls_total');
      internal.latencyCount += m['auths_mcp_call_latency_seconds_count'] ?? 0;
      internal.signInproc += atLabel(m, 'auths_mcp_sign_total', 'path', 'inproc');
      internal.signSubprocess += atLabel(m, 'auths_mcp_sign_total', 'path', 'subprocess');
      internal.settle += sumFamily(m, 'auths_mcp_settle_total');
      callSum += m['auths_mcp_call_latency_seconds_sum'] ?? 0;
      callCount += m['auths_mcp_call_latency_seconds_count'] ?? 0;
      for (const s of STAGES) {
        stageSum[s] = (stageSum[s] ?? 0) + atLabel(m, 'auths_mcp_stage_seconds_sum', 'stage', s);
        stageCount[s] = (stageCount[s] ?? 0) + atLabel(m, 'auths_mcp_stage_seconds_count', 'stage', s);
      }
      internal.scraped += 1;
    } catch (e) {
      log(`  scrape :${a.metricsPort} failed: ${e.message}`);
    }
  }

  // Per-stage mean (ms) from the gateway's own histograms. The stages sum to ≈ the whole-call
  // mean; the remainder between the caller-observed round-trip and the whole-call mean is the
  // agent↔gateway transport (decode/encode + pipe), invisible from inside the tool handler.
  const stageMeanMs = {};
  for (const s of STAGES) stageMeanMs[s] = stageCount[s] ? (stageSum[s] / stageCount[s]) * 1000 : 0;
  const stagesSumMs = STAGES.reduce((a, s) => a + stageMeanMs[s], 0);
  const callMeanMs = callCount ? (callSum / callCount) * 1000 : 0;
  // Everything inside the handler NOT in an instrumented stage: canonicalization, the
  // arg/verdict clones, lock acquisitions, and the per-call eprintln — the hot-path hygiene target.
  const orchestrationMs = Math.max(0, callMeanMs - stagesSumMs);
  const transportGapMs = Math.max(0, externalMeanMs - callMeanMs);

  for (const a of fleet) a.mcp.kill();
  await new Promise((r) => setTimeout(r, 600));
  const verify = verifySpend(fleet);

  const match = internal.callsTotal === externalTotal;
  log(`  external drove ${externalTotal} calls; gateway /metrics counted `
    + `${internal.callsTotal} across ${internal.scraped} agents → ${match ? 'MATCH ✓' : 'MISMATCH ✗'}`);
  log(`  internal: granted=${internal.granted} refused=${internal.refused} `
    + `sign(inproc=${internal.signInproc}, subprocess=${internal.signSubprocess}) `
    + `settle=${internal.settle} latency-samples=${internal.latencyCount}`);
  log(`  per-call budget (mean ms): ${STAGES.map((s) => `${s}=${stageMeanMs[s].toFixed(3)}`).join(' ')}`
    + ` orchestration=${orchestrationMs.toFixed(3)}`);
  log(`    stages+orch=${(stagesSumMs + orchestrationMs).toFixed(3)}  call=${callMeanMs.toFixed(3)}  `
    + `transport(ext−int)=${transportGapMs.toFixed(3)}  external=${externalMeanMs.toFixed(3)}`);
  log(`  verify: ${verify.consistent}/${verify.logs} consistent`);

  return {
    scenario: 'metrics', agents: fleet.length, calls_per_agent: callsPerAgent,
    external, external_total: externalTotal, internal, dogfood_match: match,
    budget: {
      stage_mean_ms: stageMeanMs, stages_sum_ms: stagesSumMs, orchestration_ms: orchestrationMs,
      call_mean_ms: callMeanMs, external_mean_ms: externalMeanMs, transport_gap_ms: transportGapMs,
    },
    verify,
  };
}
