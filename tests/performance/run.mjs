#!/usr/bin/env node
// run.mjs — the max-throughput study orchestrator.
//
//   node run.mjs [scenarios…] [--quick]
//
// scenarios: microbench ramp-solo ramp-fleet soak burst   (default: all, in that order)
//   --quick   tiny levels / short durations for a fast end-to-end smoke of the harness
//
// Scenarios run SEQUENTIALLY — each wants the whole machine, so overlapping them would
// pollute the measurement. Results are written to results/<ts>.json (ground truth) and
// rendered into a self-contained report.html. Everything is local + hermetic: no chain,
// no network, no marketplace. The target under study is the AUTHS enforcement path.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { availableParallelism } from 'node:os';
import { execFileSync } from 'node:child_process';
import { killAllChildren } from './lib/mcp.mjs';
import { cleanupLabs } from './lib/fleet.mjs';
import { GATEWAY_BIN, REPOS } from './lib/env.mjs';
import { runRamp } from './scenarios/ramp.mjs';
import { runSoak } from './scenarios/soak.mjs';
import { runBurst } from './scenarios/burst.mjs';
import { runMicrobench } from './scenarios/microbench.mjs';
import { buildReportHtml } from './lib/report.mjs';

const HERE = import.meta.dirname;
const argv = process.argv.slice(2);
const quick = argv.includes('--quick');
const names = argv.filter((a) => !a.startsWith('--'));
const want = names.length ? names : ['microbench', 'ramp-solo', 'ramp-fleet', 'soak', 'burst'];

const cfg = quick
  ? { rampLevels: [1, 2, 4], rampSecs: 2, soakConc: 4, soakSecs: 6, bursts: [16, 32, 64], burstFleet: 4, microMs: 800 }
  : { rampLevels: [1, 2, 4, 8, 16, 32, 64, 128, 256], rampSecs: 5, soakConc: availableParallelism(), soakSecs: 45, bursts: [32, 64, 128, 256, 512, 1024], burstFleet: 16, microMs: 3000 };

function gitShort(dir) {
  try { return execFileSync('git', ['-C', dir, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim(); }
  catch { return null; }
}

const results = {
  meta: {
    started_at: new Date().toISOString(),
    host: {
      platform: process.platform, arch: process.arch,
      cores: availableParallelism(), node: process.version,
      ram_gb: Math.round(Number(execFileSync('sysctl', ['-n', 'hw.memsize'], { encoding: 'utf8' })) / 1073741824),
    },
    gateway_bin: GATEWAY_BIN,
    auths_commit: gitShort(join(REPOS, 'auths')),
    quick,
  },
  scenarios: {},
};

let interrupted = false;
process.on('SIGINT', () => { interrupted = true; console.log('\n⚠ interrupted — tearing down…'); killAllChildren(); cleanupLabs(); process.exit(130); });

async function main() {
  console.log(`\n▶ max-throughput study${quick ? ' (quick smoke)' : ''} — cores=${results.meta.host.cores}, `
    + `ram=${results.meta.host.ram_gb}GB, auths@${results.meta.auths_commit}\n`);

  for (const name of want) {
    if (interrupted) break;
    const t0 = Date.now();
    console.log(`\n═══ ${name} ═══`);
    try {
      if (name === 'microbench') results.scenarios.microbench = await runMicrobench({ durationMs: cfg.microMs });
      else if (name === 'ramp-solo') results.scenarios.ramp_solo = await runRamp({ variant: 'solo', levels: cfg.rampLevels, levelSecs: cfg.rampSecs, treasuryPort: 7861 });
      else if (name === 'ramp-fleet') results.scenarios.ramp_fleet = await runRamp({ variant: 'fleet', levels: cfg.rampLevels, levelSecs: cfg.rampSecs, treasuryPort: 7862 });
      else if (name === 'soak') results.scenarios.soak = await runSoak({ concurrency: cfg.soakConc, durationSecs: cfg.soakSecs });
      else if (name === 'burst') results.scenarios.burst = await runBurst({ fleetSize: cfg.burstFleet, bursts: cfg.bursts });
      else { console.log(`  (unknown scenario "${name}" — skipped)`); continue; }
      console.log(`  ✓ ${name} in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    } catch (e) {
      console.error(`  ✗ ${name} failed: ${e.message}`);
      results.scenarios[name.replace('-', '_')] = { error: e.message };
    } finally {
      killAllChildren();           // never leak a fleet between scenarios
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  results.meta.finished_at = new Date().toISOString();

  const stamp = results.meta.started_at.replace(/[:.]/g, '-');
  mkdirSync(join(HERE, 'results'), { recursive: true });
  const jsonPath = join(HERE, 'results', `${stamp}.json`);
  writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  const htmlPath = join(HERE, 'report.html');
  writeFileSync(htmlPath, buildReportHtml(results));

  console.log(`\n▶ wrote ${jsonPath}`);
  console.log(`▶ wrote ${htmlPath}\n`);
  cleanupLabs();
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); killAllChildren(); cleanupLabs(); process.exit(1); });
