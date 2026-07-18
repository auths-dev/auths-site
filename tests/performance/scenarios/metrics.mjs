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
  const bump = (v) => { external[v] += 1; };
  await pool(fleet, 12, async (a) => bump((await paidCall(a.mcp)).verdict));

  log(`  driving ${callsPerAgent} calls/agent…`);
  await Promise.all(fleet.map(async (a) => {
    for (let i = 0; i < callsPerAgent; i += 1) bump((await paidCall(a.mcp)).verdict);
  }));
  const externalTotal = external.granted + external.refused + external.error;

  // Scrape each agent's own /metrics and aggregate the gateway-reported counts.
  const internal = {
    granted: 0, refused: 0, denied: 0, callsTotal: 0, latencyCount: 0,
    signInproc: 0, signSubprocess: 0, settle: 0, scraped: 0,
  };
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
      internal.scraped += 1;
    } catch (e) {
      log(`  scrape :${a.metricsPort} failed: ${e.message}`);
    }
  }

  for (const a of fleet) a.mcp.kill();
  await new Promise((r) => setTimeout(r, 600));
  const verify = verifySpend(fleet);

  const match = internal.callsTotal === externalTotal;
  log(`  external drove ${externalTotal} calls; gateway /metrics counted `
    + `${internal.callsTotal} across ${internal.scraped} agents → ${match ? 'MATCH ✓' : 'MISMATCH ✗'}`);
  log(`  internal: granted=${internal.granted} refused=${internal.refused} `
    + `sign(inproc=${internal.signInproc}, subprocess=${internal.signSubprocess}) `
    + `settle=${internal.settle} latency-samples=${internal.latencyCount}`);
  log(`  verify: ${verify.consistent}/${verify.logs} consistent`);

  return {
    scenario: 'metrics', agents: fleet.length, calls_per_agent: callsPerAgent,
    external, external_total: externalTotal, internal, dogfood_match: match, verify,
  };
}
