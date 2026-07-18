// fleet.mjs — lifecycle for a fleet of `wrap` gateway processes over the hermetic x402
// adapter. The real transaction path — gate → sign → verify → reserve → settle → signed
// spend-log append — with zero chain/network (hermetic settle fixture).
//
// Each agent gets its OWN isolated registry + keychain + root, so a fleet provisions in
// PARALLEL. (Onboarding N agents under ONE shared git registry is serialized by git's
// index lock — proven by the e2e's strictly-sequential spawn — so a shared root cannot be
// stood up in parallel. That serialization is itself a finding; for a throughput study we
// model N independently-bounded agents instead.) In fleet mode a treasury coordinator still
// enforces ONE spend cap across all of them over TCP, independent of their git roots.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, rmSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GATEWAY_BIN, AUTHS_CLI, X402_ADAPTER, agentEnv } from './env.mjs';
import { StdioMcp, treasuryRpc, children } from './mcp.mjs';
import { pool } from './metrics.mjs';

export const CALL_ATOMIC = 10_000;        // $0.01 micro-transaction (USDC 6-decimals)
const HUGE_BUDGET = '$100000000';         // effectively uncapped — throughput runs never refuse

const tempDirs = [];
export function cleanupLabs() { for (const d of tempDirs) rmSync(d, { recursive: true, force: true }); }

/** Parent dir for one fleet configuration; each agent gets an isolated subtree under it. */
export function makeLab(tag) {
  const lab = mkdtempSync(join(tmpdir(), `perf-${tag}-`));
  tempDirs.push(lab);
  return { lab };
}

/** Per-agent isolated paths (own HOME, registry, keychain, spend-log). */
function agentPaths(lab, i) {
  const home = join(lab.lab, `agent-${i}`);
  const liveDir = join(home, 'live');
  const registry = join(liveDir, 'registry');
  mkdirSync(liveDir, { recursive: true });
  return { home, liveDir, registry, keyfile: join(home, 'keys.enc'), spendLogDir: join(registry, 'spend-log') };
}

/** Start the fleet treasury coordinator and wait until it answers `status`. */
export async function startTreasury({ port, fleetId, capCents, stateDir, checkpointSecs = 5 }) {
  execFileSync('bash', ['-c', `lsof -ti tcp:${port} -sTCP:LISTEN | xargs kill -9 2>/dev/null || true`]);
  const child = spawn(GATEWAY_BIN, [
    'treasury', 'serve', '--listen', `127.0.0.1:${port}`, '--fleet', fleetId,
    '--cap', `$${(capCents / 100).toFixed(2)}`, '--state-dir', stateDir, '--checkpoint-secs', String(checkpointSecs),
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  children.push(child);
  let status = null;
  for (let i = 0; i < 60 && !status; i += 1) {
    await new Promise((r) => setTimeout(r, 200));
    status = await treasuryRpc(port, { op: 'status', fleet: fleetId }).catch(() => null);
    if (status && status.outcome !== 'status') status = null;
  }
  if (!status) throw new Error(`treasury coordinator did not come up on :${port}`);
  return { child, port, fleetId, stateDir };
}

/**
 * Spawn `n` agents in parallel (bounded), each a `wrap` over the adapter, initialized and
 * ready. Failure-tolerant: at very high N the process-per-agent model can still hit an OS
 * spawn ceiling — we return the agents that came up plus a `failures` count, so "could not
 * reach N" becomes measured data rather than a crash.
 */
export async function spawnAgents(lab, { n, treasury, spawnConcurrency = 24 }) {
  const agents = [];
  let failures = 0;
  await pool(Array.from({ length: n }, (_, i) => i + 1), Math.min(spawnConcurrency, n), async (i) => {
    const paths = agentPaths(lab, i);
    const env = agentEnv({
      lab: paths.home, liveDir: paths.liveDir, keyfile: paths.keyfile, label: `agent-${i}`,
      treasury: treasury ? { url: `tcp://127.0.0.1:${treasury.port}`, fleet: treasury.fleetId } : undefined,
    });
    try {
      const mcp = new StdioMcp(GATEWAY_BIN, [
        'wrap', '--scope', 'paid.call', '--budget', HUGE_BUDGET, '--ttl', '30m',
        '--rail', 'x402', '--test-mode', '--', 'node', X402_ADAPTER,
      ], env);
      const init = await mcp.request('initialize', {
        protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: `perf-agent-${i}`, version: '0.1.0' },
      }, 120_000);
      if (init.error) { mcp.kill(); failures += 1; return; }
      mcp.notify('notifications/initialized');
      agents.push({ mcp, label: `agent-${i}`, paths, env });
    } catch { failures += 1; }
  });
  return { agents, failures };
}

/** One paid_call. Returns { verdict, latencyMs }. verdict ∈ granted|refused|error. */
export async function paidCall(mcp, amountAtomic = CALL_ATOMIC) {
  const t0 = process.hrtime.bigint();
  let verdict = 'error';
  try {
    const res = await mcp.request('tools/call', {
      name: 'paid_call', arguments: { amount_atomic: amountAtomic, network: 'base-sepolia', endpoint: '/paid-call' },
    }, 60_000);
    const text = JSON.stringify(res);
    if (text.includes('usage-cap-exceeded')) verdict = 'refused';
    else if (!res.error) verdict = 'granted';
  } catch { verdict = 'error'; }
  return { verdict, latencyMs: Number(process.hrtime.bigint() - t0) / 1e6 };
}

/** One agent's own root DID. */
function rootDid(paths, env) {
  const out = execFileSync(AUTHS_CLI, ['--repo', paths.registry, '--json', 'id', 'show'], { env, encoding: 'utf8' });
  return JSON.parse(out).data.controller_did;
}

/**
 * Re-derive every agent's signed spend log offline against its own root; aggregate totals
 * and per-log consistency. Proves the hash-chained log stays correct under load.
 */
export function verifySpend(agents) {
  let logs = 0; let consistent = 0; let calls = 0; let cents = 0;
  for (const a of agents) {
    if (!a.paths || !existsSync(a.paths.spendLogDir)) continue;
    let root;
    try { root = rootDid(a.paths, a.env); } catch { continue; }
    for (const logDir of readdirSync(a.paths.spendLogDir).filter((f) => !f.startsWith('.'))) {
      logs += 1;
      const agentDid = `did:keri:${logDir.replace(/\.jsonl$/, '')}`;
      try {
        const out = execFileSync(GATEWAY_BIN, [
          'verify-spend', '--log', join(a.paths.spendLogDir, logDir),
          '--registry', a.paths.registry, '--agent', agentDid, '--root', root,
        ], { env: a.env, encoding: 'utf8' });
        const m = out.match(/consistent — (\d+) call\(s\), \$([0-9.]+) re-derived/);
        if (m) { consistent += 1; calls += Number(m[1]); cents += Math.round(Number(m[2]) * 100); }
      } catch { /* non-consistent → consistent < logs, surfaced by the caller */ }
    }
  }
  return { logs, consistent, rederivedCalls: calls, rederivedCents: cents };
}
